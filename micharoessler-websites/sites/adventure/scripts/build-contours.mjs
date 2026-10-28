// One-off build step: real-terrain contour lines from AWS Terrain Tiles (Mapzen "terrarium" encoding).
// Run with `node scripts/build-contours.mjs` – writes src/data/terrain/<area>.json so the site build needs no network.
// Source: https://registry.opendata.aws/terrain-tiles/  ·  elevation = (R * 256 + G + B / 256) - 32768 metres.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { contours } from 'd3-contour';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'src/data/terrain');
const cacheDir = join(tmpdir(), 'terrarium-cache');
const TILE = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';

// Areas are only places documented in src/data/projects.ts. bbox = [west, south, east, north].
const areas = [
	{
		id: 'kilimanjaro',
		label: 'Kilimanjaro · Kibo',
		anchor: { name: 'Kibo summit', lat: -3.0758, lon: 37.3533 },
		bbox: [37.18, -3.25, 37.56, -2.93],
		z: 11,
		interval: 100,
		index: 500,
		gridW: 260,
	},
	{
		id: 'sajama',
		label: 'Nevado Sajama',
		anchor: { name: 'Nevado Sajama', lat: -18.1086, lon: -68.8831 },
		bbox: [-69.06, -18.24, -68.72, -17.96],
		z: 11,
		interval: 100,
		index: 500,
		gridW: 260,
	},
];

const lon2x = (lon, z) => ((lon + 180) / 360) * 2 ** z * 256;
const lat2y = (lat, z) => {
	const s = Math.sin((lat * Math.PI) / 180);
	return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * 2 ** z * 256;
};

async function tile(z, x, y) {
	const file = join(cacheDir, `${z}-${x}-${y}.png`);
	if (!existsSync(file)) {
		const url = TILE.replace('{z}', z).replace('{x}', x).replace('{y}', y);
		const res = await fetch(url);
		if (!res.ok) throw new Error(`${res.status} ${url}`);
		await writeFile(file, Buffer.from(await res.arrayBuffer()));
	}
	const { data, info } = await sharp(await readFile(file)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
	if (info.width !== 256 || info.height !== 256) throw new Error('unexpected tile size');
	const ele = new Float32Array(256 * 256);
	for (let i = 0; i < ele.length; i++) ele[i] = data[i * 3] * 256 + data[i * 3 + 1] + data[i * 3 + 2] / 256 - 32768;
	return ele;
}

// Douglas–Peucker. Closed rings are split in two halves first (identical endpoints have no baseline).
function simplify(pts, tol) {
	if (pts.length < 3) return pts;
	const [fx, fy] = pts[0];
	const [lx, ly] = pts[pts.length - 1];
	if (fx === lx && fy === ly && pts.length > 4) {
		const mid = pts.length >> 1;
		return [...dp(pts.slice(0, mid + 1), tol).slice(0, -1), ...dp(pts.slice(mid), tol)];
	}
	return dp(pts, tol);
}
function dp(pts, tol) {
	if (pts.length < 3) return pts;
	const keep = new Uint8Array(pts.length);
	keep[0] = keep[pts.length - 1] = 1;
	const stack = [[0, pts.length - 1]];
	while (stack.length) {
		const [a, b] = stack.pop();
		const [ax, ay] = pts[a];
		const [bx, by] = pts[b];
		const dx = bx - ax;
		const dy = by - ay;
		const len = Math.hypot(dx, dy) || 1;
		let max = 0;
		let idx = -1;
		for (let i = a + 1; i < b; i++) {
			const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / len;
			if (d > max) {
				max = d;
				idx = i;
			}
		}
		if (max > tol && idx > 0) {
			keep[idx] = 1;
			stack.push([a, idx], [idx, b]);
		}
	}
	return pts.filter((_, i) => keep[i]);
}

function blur(grid, w, h) {
	// 3x3 box blur, twice: removes the pixel-stair noise of the 30 m source before contouring.
	let src = grid;
	for (let pass = 0; pass < 2; pass++) {
		const dst = new Float32Array(w * h);
		for (let y = 0; y < h; y++)
			for (let x = 0; x < w; x++) {
				let s = 0;
				let n = 0;
				for (let j = -1; j <= 1; j++)
					for (let i = -1; i <= 1; i++) {
						const xx = x + i;
						const yy = y + j;
						if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
						s += src[yy * w + xx];
						n++;
					}
				dst[y * w + x] = s / n;
			}
		src = dst;
	}
	return src;
}

const r1 = (v) => Math.round(v * 10) / 10;

async function build(a) {
	const [west, south, east, north] = a.bbox;
	const x0 = lon2x(west, a.z);
	const x1 = lon2x(east, a.z);
	const y0 = lat2y(north, a.z);
	const y1 = lat2y(south, a.z);
	const tx0 = Math.floor(x0 / 256);
	const tx1 = Math.floor(x1 / 256);
	const ty0 = Math.floor(y0 / 256);
	const ty1 = Math.floor(y1 / 256);
	const tiles = [];
	const mosaicW = (tx1 - tx0 + 1) * 256;
	const mosaicH = (ty1 - ty0 + 1) * 256;
	const mosaic = new Float32Array(mosaicW * mosaicH);
	for (let ty = ty0; ty <= ty1; ty++)
		for (let tx = tx0; tx <= tx1; tx++) {
			tiles.push(`${a.z}/${tx}/${ty}`);
			const t = await tile(a.z, tx, ty);
			const ox = (tx - tx0) * 256;
			const oy = (ty - ty0) * 256;
			for (let y = 0; y < 256; y++) mosaic.set(t.subarray(y * 256, y * 256 + 256), (oy + y) * mosaicW + ox);
		}

	// Resample the bbox (Web Mercator pixel space, conformal) to a coarser grid with bilinear sampling.
	const pw = x1 - x0;
	const ph = y1 - y0;
	const gw = a.gridW;
	const gh = Math.round((gw * ph) / pw);
	const sample = (px, py) => {
		const fx = px - tx0 * 256;
		const fy = py - ty0 * 256;
		const ix = Math.max(0, Math.min(mosaicW - 2, Math.floor(fx)));
		const iy = Math.max(0, Math.min(mosaicH - 2, Math.floor(fy)));
		const u = fx - ix;
		const v = fy - iy;
		const q = (i, j) => mosaic[(iy + j) * mosaicW + ix + i];
		return q(0, 0) * (1 - u) * (1 - v) + q(1, 0) * u * (1 - v) + q(0, 1) * (1 - u) * v + q(1, 1) * u * v;
	};
	let grid = new Float32Array(gw * gh);
	for (let y = 0; y < gh; y++)
		for (let x = 0; x < gw; x++) grid[y * gw + x] = sample(x0 + ((x + 0.5) / gw) * pw, y0 + ((y + 0.5) / gh) * ph);
	grid = blur(grid, gw, gh);

	let min = Infinity;
	let max = -Infinity;
	let maxAt = 0;
	for (let i = 0; i < grid.length; i++) {
		if (grid[i] < min) min = grid[i];
		if (grid[i] > max) {
			max = grid[i];
			maxAt = i;
		}
	}

	const W = 1000;
	const k = W / gw;
	const H = Math.round(gh * k);
	const first = Math.ceil(min / a.interval) * a.interval;
	const levels = [];
	for (let e = first; e < max; e += a.interval) levels.push(e);

	const edge = (p) => p[0] <= 0.01 || p[1] <= 0.01 || p[0] >= gw - 0.01 || p[1] >= gh - 0.01;
	const paths = [];
	for (const g of contours().size([gw, gh]).thresholds(levels)(Array.from(grid))) {
		const parts = [];
		for (const poly of g.coordinates)
			for (const ring of poly) {
				// Drop the segments d3 adds along the grid border so contours end cleanly at the neatline.
				let run = [];
				for (let i = 0; i < ring.length; i++) {
					const p = ring[i];
					const prev = ring[i - 1];
					if (prev && edge(prev) && edge(p)) {
						if (run.length > 1) parts.push(run);
						run = [];
					}
					run.push(p);
				}
				if (run.length > 1) parts.push(run);
			}
		let d = '';
		for (const part of parts) {
			const s = simplify(
				part.map(([x, y]) => [x * k, y * k]),
				1.1,
			);
			if (s.length < 2) continue;
			const len = s.reduce((acc, p, i) => (i ? acc + Math.hypot(p[0] - s[i - 1][0], p[1] - s[i - 1][1]) : 0), 0);
			if (len < 14) continue; // speckle
			d += 'M' + s.map(([x, y]) => `${r1(x)} ${r1(y)}`).join('L');
		}
		if (d) paths.push({ e: g.value, i: g.value % a.index === 0 ? 1 : 0, d });
	}

	// Profile: an east–west section through the anchor point, sampled from the same grid.
	const ay = Math.round(((lat2y(a.anchor.lat, a.z) - y0) / ph) * gh);
	const kmPerDeg = 111.32 * Math.cos((a.anchor.lat * Math.PI) / 180);
	const widthKm = (east - west) * kmPerDeg;
	const profile = [];
	const N = 120;
	for (let i = 0; i <= N; i++) {
		const gx = Math.min(gw - 1, Math.round((i / N) * (gw - 1)));
		profile.push(Math.round(grid[ay * gw + gx]));
	}

	const peak = { x: r1(((maxAt % gw) + 0.5) * k), y: r1((Math.floor(maxAt / gw) + 0.5) * k) };
	const anchor = {
		...a.anchor,
		x: r1(((lon2x(a.anchor.lon, a.z) - x0) / pw) * W),
		y: r1(((lat2y(a.anchor.lat, a.z) - y0) / ph) * H),
	};
	const out = {
		id: a.id,
		label: a.label,
		source: 'AWS Terrain Tiles (Mapzen terrarium), https://registry.opendata.aws/terrain-tiles/',
		tiles,
		bbox: { west, south, east, north },
		viewBox: [W, H],
		interval: a.interval,
		index: a.index,
		range: [Math.round(min), Math.round(max)],
		anchor,
		peak,
		profile: { widthKm: Math.round(widthKm * 10) / 10, lat: a.anchor.lat, samples: profile },
		paths,
	};
	await writeFile(join(outDir, `${a.id}.json`), JSON.stringify(out));
	const size = Buffer.byteLength(JSON.stringify(out));
	console.log(`${a.id}: ${tiles.join(', ')} · ${paths.length} levels · ${Math.round(min)}–${Math.round(max)} m · ${(size / 1024).toFixed(1)} KB`);
}

await mkdir(outDir, { recursive: true });
await mkdir(cacheDir, { recursive: true });
for (const a of areas) await build(a);
