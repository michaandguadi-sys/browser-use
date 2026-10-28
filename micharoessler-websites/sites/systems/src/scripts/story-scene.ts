// The living background of the scroll story, rendered live with three.js.
//  · ambient: refractive glass clips drifting over colour fields, breathing and following the cursor
//  · c: the "60 h" numerals (texture twin of the DOM odometer) shatter into shards; the camera flies through
//  · d: a 3D glass timeline — clips pop in ahead of an accelerating playhead, speed lines, camera locked on
// Driven by the scrubbed scroll progress in `state.p`; renders only while the story is on screen,
// DPR ≤ 1.5 (lower on touch), fewer objects on small screens, adaptive resolution decided once at start.
// Lite mode (phones / touch / narrow): no WebGL shards (the DOM counter shatters itself, see story.ts), no
// transmission passes (cheap reflective materials), fewer objects. Every shader is compiled and every buffer
// uploaded before the canvas fades in, so nothing compiles mid-scroll.
import {
	AdditiveBlending,
	BoxGeometry,
	BufferAttribute,
	BufferGeometry,
	CanvasTexture,
	CapsuleGeometry,
	Color,
	DoubleSide,
	Group,
	InstancedMesh,
	MathUtils,
	Matrix4,
	Mesh,
	MeshBasicMaterial,
	MeshPhysicalMaterial,
	MeshStandardMaterial,
	NeutralToneMapping,
	Object3D,
	PerspectiveCamera,
	PlaneGeometry,
	PMREMGenerator,
	Quaternion,
	Scene,
	ShaderMaterial,
	SRGBColorSpace,
	TetrahedronGeometry,
	Vector3,
	WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { CH, type StoryState } from './story-ch';
import type { Post } from './story-post';

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => {
	x = clamp01(x);
	return x * x * (3 - 2 * x);
};
const range = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const CLIP_COLS = ['#ff8a7a', '#5546ff', '#2bb3a3', '#ff9f5c', '#8b80ff', '#d36bff'];
const BG = '#eef0f5';
const FOV = 35;
const TZ = -36; // depth of the timeline wall

function backdrop() {
	const c = document.createElement('canvas');
	c.width = 1024;
	c.height = 640;
	const g = c.getContext('2d')!;
	g.fillStyle = BG;
	g.fillRect(0, 0, c.width, c.height);
	const blob = (x: number, y: number, r: number, col: string) => {
		const gr = g.createRadialGradient(x, y, 0, x, y, r);
		gr.addColorStop(0, col);
		gr.addColorStop(1, 'rgba(238,240,245,0)');
		g.fillStyle = gr;
		g.fillRect(0, 0, c.width, c.height);
	};
	// same fields as the CSS .story-bg, so the fade-in is seamless
	blob(225, 166, 470, 'rgba(85,70,255,0.42)');
	blob(820, 192, 440, 'rgba(255,150,100,0.46)');
	blob(594, 550, 470, 'rgba(80,210,190,0.42)');
	const t = new CanvasTexture(c);
	t.colorSpace = SRGBColorSpace;
	return t;
}

// "60 h" in the odometer's type, transparent around the glyphs → the shards are pieces of the letters
function numeralTexture(aspect: number) {
	const c = document.createElement('canvas');
	c.height = 360;
	c.width = Math.round(360 * aspect);
	const g = c.getContext('2d')!;
	g.textBaseline = 'alphabetic';
	const fs = c.height * 0.97;
	g.font = `900 ${fs}px "Inter Variable", Inter, system-ui, sans-serif`;
	g.letterSpacing = `${-0.03 * fs}px`;
	const num = '60';
	const wNum = g.measureText(num).width;
	const wH = g.measureText('h').width;
	const gap = 0.1 * fs;
	const total = wNum + gap + wH;
	const x0 = (c.width - total) / 2;
	const y = c.height * 0.8;
	g.fillStyle = '#1d1d1f';
	g.fillText(num, x0, y);
	const gr = g.createLinearGradient(0, 0, 0, c.height);
	gr.addColorStop(0, '#8b80ff');
	gr.addColorStop(0.5, '#5546ff');
	gr.addColorStop(1, '#2f22c9');
	g.fillStyle = gr;
	g.fillText('h', x0 + wNum + gap, y);
	const t = new CanvasTexture(c);
	t.colorSpace = SRGBColorSpace;
	t.anisotropy = 4;
	return t;
}

// a jittered triangle grid; every triangle carries its centroid + a random spin/direction for the burst
function shardGeometry(cols: number, rows: number) {
	const pts: [number, number][][] = [];
	for (let j = 0; j <= rows; j++) {
		pts[j] = [];
		for (let i = 0; i <= cols; i++) {
			const edge = i === 0 || j === 0 || i === cols || j === rows;
			const jx = edge ? 0 : (Math.random() - 0.5) * 0.7;
			const jy = edge ? 0 : (Math.random() - 0.5) * 0.7;
			pts[j][i] = [(i + jx) / cols - 0.5, (j + jy) / rows - 0.5];
		}
	}
	const pos: number[] = [];
	const uv: number[] = [];
	const cen: number[] = [];
	const rnd: number[] = [];
	const tri = (a: [number, number], b: [number, number], c: [number, number]) => {
		const cx = (a[0] + b[0] + c[0]) / 3;
		const cy = (a[1] + b[1] + c[1]) / 3;
		const r = [Math.random() - 0.5, Math.random() - 0.5, Math.random(), Math.random()];
		for (const v of [a, b, c]) {
			pos.push(v[0], v[1], 0);
			uv.push(v[0] + 0.5, v[1] + 0.5);
			cen.push(cx, cy, 0);
			rnd.push(...r);
		}
	};
	for (let j = 0; j < rows; j++)
		for (let i = 0; i < cols; i++) {
			const a = pts[j][i];
			const b = pts[j][i + 1];
			const c = pts[j + 1][i];
			const d = pts[j + 1][i + 1];
			if ((i + j) % 2) {
				tri(a, b, d);
				tri(a, d, c);
			} else {
				tri(a, b, c);
				tri(b, d, c);
			}
		}
	const g = new BufferGeometry();
	g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
	g.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2));
	g.setAttribute('aC', new BufferAttribute(new Float32Array(cen), 3));
	g.setAttribute('aR', new BufferAttribute(new Float32Array(rnd), 4));
	return g;
}

export async function mount(canvas: HTMLCanvasElement, state: StoryState) {
	const small = innerWidth < 720;
	const touch = matchMedia('(pointer: coarse)').matches;
	const lite = state.lite;
	const N = lite ? { glass: 4, bars: 4, shards: 0, clips: 48, lines: 32, gx: 1, gy: 1 } : small ? { glass: 4, bars: 4, shards: 14, clips: 54, lines: 40, gx: 10, gy: 4 } : { glass: 7, bars: 6, shards: 32, clips: 110, lines: 90, gx: 16, gy: 6 };

	const renderer = new WebGLRenderer({ canvas, antialias: !touch, alpha: false, powerPreference: 'high-performance' });
	let dpr = Math.min(touch ? 1.25 : 1.5, devicePixelRatio || 1);
	renderer.setPixelRatio(dpr);
	renderer.toneMapping = NeutralToneMapping;
	renderer.outputColorSpace = SRGBColorSpace;
	renderer.setClearColor(new Color(BG));
	renderer.transmissionResolutionScale = small ? 0.5 : 0.75;

	const scene = new Scene();
	const pmrem = new PMREMGenerator(renderer);
	scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
	pmrem.dispose();

	const camera = new PerspectiveCamera(FOV, 1, 0.1, 140);
	scene.add(camera);
	const bg = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ map: backdrop(), depthWrite: false, toneMapped: false }));
	bg.position.z = -100;
	bg.renderOrder = -1;
	camera.add(bg);

	// lite: a reflective, see-through stand-in for glass — no transmission render pass
	const liteGlass = new MeshStandardMaterial({ color: '#f3f1ff', roughness: 0.06, metalness: 0.12, transparent: true, opacity: 0.42, envMapIntensity: 1.7, depthWrite: false });
	const fullGlass = new MeshPhysicalMaterial({
		color: '#ffffff',
		transmission: 1,
		roughness: 0.07,
		thickness: 0.6,
		ior: 1.46,
		clearcoat: 1,
		clearcoatRoughness: 0.08,
		iridescence: 0.4,
		iridescenceIOR: 1.3,
		attenuationColor: new Color('#d8d2ff'),
		attenuationDistance: 2.6,
		specularIntensity: 1,
		envMapIntensity: 1.15,
	});
	const glass = lite ? liteGlass : fullGlass;

	// ---------- ambient: glass clips + colour bars behind them ----------
	const amb = new Group();
	scene.add(amb);
	type Drift = { m: Object3D; ax: number; ay: number; z: number; ph: number; sp: number; r0: number };
	const drift: Drift[] = [];
	const anchors = [
		[-0.4, 0.3],
		[0.38, 0.32],
		[-0.33, -0.3],
		[0.41, -0.24],
		[0.06, 0.45],
		[-0.3, -0.47],
		[0.2, 0.05],
	];
	for (let i = 0; i < N.glass; i++) {
		const pill = i % 3 === 1;
		const geo = pill ? new CapsuleGeometry(0.34, 1.3 + (i % 2) * 0.5, 8, 24) : new RoundedBoxGeometry(1.7 + (i % 3) * 0.6, 0.62 + (i % 2) * 0.3, 0.26, 5, 0.13);
		const m = new Mesh(geo, glass);
		if (pill) m.rotation.z = Math.PI / 2;
		const [ax, ay] = anchors[i % anchors.length];
		drift.push({ m, ax, ay, z: -1.4 + ((i * 37) % 7) * 0.6, ph: i * 1.7, sp: 0.6 + (i % 4) * 0.13, r0: (i % 2 ? 1 : -1) * (0.25 + (i % 3) * 0.12) });
		amb.add(m);
	}
	const bars: Drift[] = [];
	for (let i = 0; i < N.bars; i++) {
		const m = new Mesh(new RoundedBoxGeometry(2.2 + (i % 3) * 0.9, 0.34, 0.06, 3, 0.08), new MeshBasicMaterial({ color: CLIP_COLS[i % CLIP_COLS.length] }));
		bars.push({ m, ax: -0.45 + (i / Math.max(1, N.bars - 1)) * 0.9, ay: (i % 2 ? 1 : -1) * (0.36 + (i % 3) * 0.05), z: -4.2, ph: i * 2.3, sp: 0.35 + (i % 3) * 0.1, r0: 0 });
		amb.add(m);
	}

	// ---------- c: numeral shards + glass splinters ----------
	const shardMat = new ShaderMaterial({
		uniforms: { map: { value: null }, uP: { value: 0 }, uO: { value: 0 } },
		transparent: true,
		depthWrite: false,
		side: DoubleSide,
		vertexShader: /* glsl */ `
			attribute vec3 aC; attribute vec4 aR;
			uniform float uP; varying vec2 vUv; varying float vA;
			mat3 rotA(vec3 a, float t){ a = normalize(a); float s = sin(t), c = cos(t), o = 1.0 - c;
				return mat3(o*a.x*a.x + c, o*a.x*a.y + a.z*s, o*a.z*a.x - a.y*s,
					o*a.x*a.y - a.z*s, o*a.y*a.y + c, o*a.y*a.z + a.x*s,
					o*a.z*a.x + a.y*s, o*a.y*a.z - a.x*s, o*a.z*a.z + c); }
			void main(){
				vUv = uv;
				float d = clamp(uP * 1.25 - aR.w * 0.25, 0.0, 1.0);
				float e = d * d * (3.0 - 2.0 * d);
				vec3 p = position - aC;
				p = rotA(vec3(aR.xy, 0.4) + 0.01, e * (2.0 + 5.0 * aR.w)) * p;
				vec3 c = aC + vec3(aC.xy * (2.4 + 3.0 * aR.z) + aR.xy * 1.6, (1.2 + 5.0 * aR.z)) * e;
				vA = 1.0 - smoothstep(0.55, 1.0, d);
				gl_Position = projectionMatrix * modelViewMatrix * vec4(c + p, 1.0);
			}`,
		fragmentShader: /* glsl */ `
			uniform sampler2D map; uniform float uO; varying vec2 vUv; varying float vA;
			void main(){
				vec4 t = texture2D(map, vUv);
				gl_FragColor = vec4(t.rgb, t.a * vA * uO);
				#include <tonemapping_fragment>
				#include <colorspace_fragment>
			}`,
	});
	const numeral = new Mesh(shardGeometry(N.gx, N.gy), shardMat);
	numeral.visible = false;
	if (!lite) scene.add(numeral);

	const splinters = new InstancedMesh(new TetrahedronGeometry(0.22, 0), glass, N.shards);
	const spl = Array.from({ length: N.shards }, () => ({
		o: new Vector3((Math.random() - 0.5) * 0.9, (Math.random() - 0.5) * 0.7, 0),
		d: new Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, 0.6 + Math.random() * 1.4),
		ax: new Vector3(Math.random(), Math.random(), Math.random()).normalize(),
		s: new Vector3(0.6 + Math.random(), 0.15 + Math.random() * 0.25, 0.6 + Math.random()),
		k: Math.random(),
	}));
	splinters.visible = false;
	if (!lite) scene.add(splinters);

	// ---------- d: the timeline wall ----------
	const line = new Group();
	line.position.z = TZ;
	line.visible = false;
	scene.add(line);
	const LANES = small ? 4 : 5;
	const laneY = (i: number) => 1.15 - i * 0.62;
	const laneMat = lite
		? new MeshStandardMaterial({ color: '#ffffff', roughness: 0.2, transparent: true, opacity: 0.38, envMapIntensity: 1.2, depthWrite: false })
		: new MeshPhysicalMaterial({ color: '#ffffff', transmission: 1, roughness: 0.22, thickness: 0.3, ior: 1.4, envMapIntensity: 1, specularIntensity: 0.8 });
	for (let i = 0; i < LANES; i++) {
		const lane = new Mesh(new BoxGeometry(140, 0.5, 0.08), laneMat);
		lane.position.set(50, laneY(i), -0.12);
		line.add(lane);
	}
	const clipGeo = new RoundedBoxGeometry(1, 0.38, 0.14, 2, 0.06);
	const clips = new InstancedMesh(clipGeo, new MeshStandardMaterial({ roughness: 0.32, metalness: 0, envMapIntensity: 0.9 }), N.clips);
	const clipData: { x: number; y: number; len: number }[] = [];
	{
		const perLane = Math.ceil(N.clips / LANES);
		for (let l = 0; l < LANES; l++) {
			let x = -8 + Math.random() * 3;
			for (let k = 0; k < perLane && clipData.length < N.clips; k++) {
				const len = 0.8 + Math.random() * (l === 0 ? 3.2 : 2.2);
				clipData.push({ x, y: laneY(l), len });
				x += len + 0.18 + Math.random() * 0.9;
			}
		}
		const col = new Color();
		clipData.forEach((c, i) => clips.setColorAt(i, col.set(CLIP_COLS[(i * 7 + Math.floor(c.y * 3)) % CLIP_COLS.length])));
	}
	line.add(clips);
	// instanced meshes move far from where they were first bounded → never frustum-cull them on a stale sphere
	clips.frustumCulled = false;
	const playhead = new Group();
	const ph = new Mesh(new BoxGeometry(0.07, 3.9, 0.07), new MeshBasicMaterial({ color: '#5546ff', toneMapped: false }));
	const glow = (() => {
		const c = document.createElement('canvas');
		c.width = 64;
		c.height = 256;
		const g = c.getContext('2d')!;
		g.scale(1, 4); // elliptical falloff that reaches zero inside the plane on every side
		const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
		gr.addColorStop(0, 'rgba(255,255,255,0.95)');
		gr.addColorStop(0.2, 'rgba(140,128,255,0.6)');
		gr.addColorStop(1, 'rgba(85,70,255,0)');
		g.fillStyle = gr;
		g.fillRect(0, 0, 64, 64);
		const m = new Mesh(new PlaneGeometry(1.1, 5.4), new MeshBasicMaterial({ map: new CanvasTexture(c), transparent: true, opacity: lite ? 0.5 : 1, blending: AdditiveBlending, depthWrite: false, toneMapped: false }));
		m.position.z = 0.05;
		return m;
	})();
	playhead.add(ph, glow);
	playhead.position.z = 0.32;
	line.add(playhead);
	const speedMat = new MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, toneMapped: false });
	const speed = new InstancedMesh(new BoxGeometry(1, 0.018, 0.018), speedMat, N.lines);
	const sl = Array.from({ length: N.lines }, () => ({ x: Math.random() * 40 - 10, y: (Math.random() - 0.5) * 6, z: Math.random() * 7 - 1, l: 1.5 + Math.random() * 4 }));
	speed.frustumCulled = false;
	splinters.frustumCulled = false;
	line.add(speed);

	// ---------- sizing ----------
	let vw = 1;
	let vh = 1;
	let post: Post | null = null; // desktop only: bloom + motion blur + grain + vignette (story-post.ts)
	let numeralReady = false; // placed for the current layout
	let texAspect = 0;
	const resize = () => {
		const w = canvas.clientWidth;
		const h = canvas.clientHeight;
		if (!w || !h) return;
		renderer.setSize(w, h, false);
		post?.setSize(w, h, dpr);
		camera.aspect = w / h;
		camera.updateProjectionMatrix();
		vh = 2 * 10 * Math.tan(MathUtils.degToRad(FOV / 2)); // visible size at the z = 0 plane from the home pose
		vw = vh * camera.aspect;
		const bh = 2 * 100 * Math.tan(MathUtils.degToRad(60 / 2));
		bg.scale.set(bh * Math.max(camera.aspect, 0.6) * 1.1, bh * 1.1, 1);
		// keep the ambient glass in proportion on narrow screens
		const k = Math.min(1, Math.max(0.45, vw / 11));
		for (const d of drift) d.m.scale.setScalar(k);
		for (const b of bars) b.m.scale.set(k, k, 1);
		numeralReady = false;
		texAspect = 0;
	};
	const ro = new ResizeObserver(resize);
	ro.observe(canvas);
	resize();

	// the "60 h" texture is drawn once (warm-up / font load / resize), never during the scroll
	const buildNumeralTexture = () => {
		if (lite) return;
		const odo = document.querySelector<HTMLElement>('[data-odo]');
		if (!odo || !odo.offsetHeight) return;
		const fs = parseFloat(getComputedStyle(odo).fontSize);
		const tensOn = !!odo.querySelector('[data-tens].on');
		const aspect = (odo.offsetWidth + (tensOn ? 0 : 0.62 * fs)) / odo.offsetHeight; // final layout: two digits + h
		if (Math.abs(aspect - texAspect) < 0.02) return;
		texAspect = aspect;
		shardMat.uniforms.map.value?.dispose();
		shardMat.uniforms.map.value = numeralTexture(aspect);
		renderer.initTexture(shardMat.uniforms.map.value);
	};
	// place the numeral plane exactly over the DOM odometer (home pose, z = 0)
	const fitNumeral = () => {
		const r = state.odo();
		if (!r || !r.width) return;
		if (!shardMat.uniforms.map.value) buildNumeralTexture();
		const cw = canvas.clientWidth;
		const chh = canvas.clientHeight;
		const cr = canvas.getBoundingClientRect();
		const w = (r.width / cw) * vw;
		const h = (r.height / chh) * vh;
		const cx = ((r.left - cr.left + r.width / 2) / cw - 0.5) * vw;
		const cy = -((r.top - cr.top + r.height / 2) / chh - 0.5) * vh;
		numeral.scale.set(w * 1.02, h * 1.02, 1);
		numeral.position.set(cx, cy, 0);
		splinters.position.copy(numeral.position);
		splinters.scale.set(w, h, 1);
		numeralReady = true;
	};

	// ---------- loop ----------
	const m4 = new Matrix4();
	const q = new Quaternion();
	const v = new Vector3();
	const s3 = new Vector3();
	const camPos = new Vector3(0, 0, 10);
	const camLook = new Vector3();
	const look = new Vector3();
	const pos = new Vector3();
	const cursor = { x: 0, y: 0 };
	let visible = true;
	let raf = 0;
	let last = performance.now();
	let slow = 0;
	let frames = 0;
	let first = true;
	let tlSpeed = 0;
	// cinematic post inputs (smoothed)
	const lastCam = new Vector3(0, 0, 10);
	let lastP = 0;
	let fxZoom = 0;
	let fxX = 0;
	let fxCA = 0;

	const tick = (now: number) => {
		raf = 0;
		const rawDt = Math.max(1 / 240, (now - last) / 1000); // real frame time (for velocities)
		const dt = Math.min(0.05, rawDt);
		last = now;
		const t = now / 1000;
		const p = state.p;
		cursor.x += (state.px - cursor.x) * 0.05;
		cursor.y += (state.py - cursor.y) * 0.05;

		// ambient (alive in a, b, f; the camera leaves it behind in c)
		const spread = 1 + ease(range(p, CH.hoursIn, CH.count[1])) * 0.22;
		const ambOn = p < CH.tl[0] + 0.02 || p > CH.home;
		amb.visible = ambOn;
		const barsOn = p < CH.hoursOut + 0.03; // colour bars: chapters a–b only (they'd cross the H1 at the end)
		for (const b of bars) b.m.visible = barsOn;
		if (ambOn) {
			for (const d of drift) {
				d.m.position.set(d.ax * vw * spread + Math.sin(t * 0.5 * d.sp + d.ph) * 0.18 + cursor.x * 0.25 * (d.z + 2), d.ay * vh * spread + Math.cos(t * 0.6 * d.sp + d.ph) * 0.14 - cursor.y * 0.18 * (d.z + 2), d.z);
				d.m.rotation.x = Math.sin(t * 0.4 + d.ph) * 0.25 + cursor.y * 0.35;
				d.m.rotation.y = d.r0 + Math.sin(t * 0.33 + d.ph) * 0.3 + cursor.x * 0.5;
			}
			for (const b of bars) {
				b.m.position.set(((b.ax * vw * 1.3 + t * b.sp + vw) % (vw * 2.2)) - vw * 1.1, b.ay * vh * 0.9, b.z);
			}
		}

		// c: numerals → shards
		const burst = range(p, CH.hoursOut - 0.005, CH.tl[0] - 0.01);
		const nOn = !lite && p > CH.count[1] - 0.04 && p < CH.tl[0] + 0.02;
		if (nOn && !numeralReady) fitNumeral();
		numeral.visible = nOn && numeralReady;
		splinters.visible = nOn && numeralReady && burst > 0;
		shardMat.uniforms.uP.value = burst;
		shardMat.uniforms.uO.value = p >= CH.hoursOut - 0.004 ? 1 : 0; // DOM digits on top until the hand-over
		if (splinters.visible) {
			const e = ease(burst);
			for (let i = 0; i < spl.length; i++) {
				const s = spl[i];
				const k = clamp01(e * 1.2 - s.k * 0.2);
				v.copy(s.o).addScaledVector(s.d, k * 2.4);
				v.z = s.d.z * k * 5;
				q.setFromAxisAngle(s.ax, k * 7 + t * 0.4);
				const sc = Math.sin(Math.min(1, k * 1.4) * Math.PI) * 1.1 + 0.05;
				s3.copy(s.s).multiplyScalar(sc);
				m4.compose(v, q, s3);
				splinters.setMatrixAt(i, m4);
			}
			splinters.instanceMatrix.needsUpdate = true;
		}

		// d: timeline
		const tt = range(p, CH.tl[0] - 0.02, CH.tl[1] + 0.06);
		const tlOn = p > CH.hoursOut + 0.03 && p < CH.home; // the wall is already ahead during the fly-through
		line.visible = tlOn;
		const phx = -5 + 74 * Math.pow(tt, 2.3);
		const vel = 2.3 * Math.pow(Math.max(tt, 0.001), 1.3); // d(phx)/dt, normalised
		tlSpeed += (vel - tlSpeed) * 0.08;
		if (tlOn) {
			playhead.position.x = phx;
			glow.scale.set(1 + tlSpeed * (lite ? 0.6 : 1.4), 1, 1);
			for (let i = 0; i < clipData.length; i++) {
				const c = clipData[i];
				const k = clamp01((phx + 9 - c.x) / 2.2);
				// pop in ahead of the playhead with a small overshoot
				const sc = k <= 0 ? 0.0001 : Math.min(1, k * 1.6) * (1 + Math.sin(k * Math.PI) * 0.25 * (1 - k));
				v.set(c.x + c.len / 2, c.y + (1 - Math.min(1, k * 1.6)) * 0.5, 0.06);
				s3.set(c.len, sc, sc);
				m4.compose(v, q.identity(), s3);
				clips.setMatrixAt(i, m4);
			}
			clips.instanceMatrix.needsUpdate = true;
			speedMat.opacity = Math.min(0.85, tlSpeed * 0.42);
			for (let i = 0; i < sl.length; i++) {
				const s = sl[i];
				s.x -= (6 + tlSpeed * 70) * dt;
				if (s.x < -14) s.x += 46;
				v.set(phx + s.x, s.y, s.z);
				s3.set(s.l * (0.4 + tlSpeed * 1.2), 1, 1);
				m4.compose(v, q.identity(), s3);
				speed.setMatrixAt(i, m4);
			}
			speed.instanceMatrix.needsUpdate = true;
		}

		// camera path
		const fly = ease(range(p, CH.hoursOut, CH.tl[0]));
		const toTl = ease(range(p, CH.tl[0] - 0.03, CH.tl[0] + 0.05));
		if (p >= CH.home) {
			camPos.set(cursor.x * 0.45, -cursor.y * 0.28, 10);
			camLook.set(0, 0, 0);
		} else {
			// a, b → c: home, then forward through the shards
			pos.set(cursor.x * 0.45 + Math.sin(t * 0.3) * 0.05, -cursor.y * 0.28 + Math.cos(t * 0.27) * 0.04, 10 - 19 * fly);
			look.set(cursor.x * 0.2 * (1 - fly), 0, pos.z - 10);
			// d: lock onto the playhead, three-quarter view of the wall, closing in as it speeds up
			const zoom = ease(range(p, CH.line - 0.04, CH.line + 0.04));
			const pf = clamp01((1.2 - camera.aspect) / 0.7); // portrait: frame the playhead from further back and more head-on
			v.set(phx + MathUtils.lerp(-4.2, -1.3, pf) + tlSpeed * 1.1 + zoom * 3.4 + cursor.x * 0.4, 0.55 - cursor.y * 0.25, TZ + MathUtils.lerp(7.6, 10.5, pf) - tlSpeed * 1.3 - zoom * 5.2);
			pos.lerp(v, toTl);
			v.set(phx + MathUtils.lerp(1.8, 0.7, pf) + zoom * 0.4, 0.1, TZ);
			look.lerp(v, toTl);
			camPos.copy(pos);
			camLook.copy(look);
		}
		camera.position.copy(camPos);
		camera.fov = FOV + toTl * (6 + tlSpeed * 7) * (p < CH.home ? 1 : 0);
		camera.updateProjectionMatrix();
		camera.lookAt(camLook);
		camera.rotateZ(Math.sin(fly * Math.PI) * 0.12);

		if (post) {
			const idt = 1 / rawDt;
			const fwd = Math.max(0, (lastCam.z - camPos.z) * idt); // flying forward (-z)
			const lat = (camPos.x - lastCam.x) * idt; // tracking the playhead
			const sv = Math.abs(p - lastP) * idt; // scroll speed in progress / s
			fxZoom += (Math.min(0.05, fwd * 0.0025) - fxZoom) * 0.2;
			fxX += (MathUtils.clamp(lat * 0.0012, -0.03, 0.03) - fxX) * 0.2;
			fxCA += (Math.min(1, sv * 6) - fxCA) * 0.15;
			lastCam.copy(camPos);
			lastP = p;
			post.render(dt, t, fxX, 0, fxZoom, fxCA);
		} else renderer.render(scene, camera);
		if (first) {
			first = false;
			canvas.classList.add('is-live');
		}

		// adaptive resolution, decided once in the first ~90 frames (while the story sits on chapter a), then locked
		// for the session — the pixel ratio never changes mid-scroll
		if (frames < 90) {
			frames++;
			const ms = performance.now() - now;
			if (ms > 22 || dt > 0.03) slow++;
			if (frames === 90 && slow > 30) {
				if (post) post.bloom.enabled = false; // first thing to go on a slow machine
				if (dpr > 1) {
					dpr = 1;
					renderer.setPixelRatio(dpr);
					resize();
				}
			}
		}
		if (visible && !document.hidden) raf = requestAnimationFrame(tick);
	};
	let ready = false; // the loop must not run before the warm-up below has finished (it toggles visibility)
	const start = () => {
		if (ready && !raf && visible && !document.hidden) {
			last = performance.now();
			raf = requestAnimationFrame(tick);
		}
	};
	new IntersectionObserver(([e]) => {
		visible = e.isIntersecting;
		start();
	}).observe(canvas.closest('[data-story-root]') ?? canvas);
	document.addEventListener('visibilitychange', start);
	canvas.addEventListener('webglcontextlost', (e) => {
		e.preventDefault();
		visible = false;
		canvas.classList.remove('is-live');
	});
	// numeral texture uses the web font
	document.fonts?.ready.then(() => {
		texAspect = 0;
		buildNumeralTexture();
		numeralReady = false;
	});

	// desktop: the cinematic post chain (lazy chunk; the story still renders without it if it fails)
	if (!lite) {
		try {
			const m = await import('./story-post');
			post = m.createPost(renderer, scene, camera);
			post.setSize(canvas.clientWidth, canvas.clientHeight, dpr);
		} catch {
			post = null;
		}
	}

	// warm-up: compile every program and upload every buffer/texture before the first visible frame
	buildNumeralTexture();
	const groups = [amb, numeral, splinters, line];
	const was = groups.map((g) => g.visible);
	for (const g of groups) g.visible = true;
	try {
		await renderer.compileAsync(scene, camera);
	} catch {
		renderer.compile(scene, camera);
	}
	// draw from the home pose and from inside the timeline, so every pipeline state is exercised on screen
	// (some drivers finish compiling only at the first real draw); the canvas is still at opacity 0 — never seen
	camera.position.set(0, 0, 10);
	camera.lookAt(0, 0, 0);
	const draw = () => (post ? post.render(0, 0, 0.001, 0, 0.001, 0) : renderer.render(scene, camera)); // non-zero blur → compiles the blur branch too
	draw();
	camera.position.set(-3, 0.5, TZ + 8);
	camera.lookAt(2, 0, TZ);
	draw();
	camera.position.set(0, 0, 10);
	camera.lookAt(0, 0, 0);
	groups.forEach((g, i) => (g.visible = was[i]));
	ready = true;
	start();
}
