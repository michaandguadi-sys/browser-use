// Shared world-map projection: the dotted land SVG (/world-dots.svg) and the HTML pins use the same one.
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import land110 from 'world-atlas/land-110m.json';

export const W = 1000;
export const H = 470;
const STEP = 7;

export const projection = geoNaturalEarth1()
	.rotate([-10, 0])
	.fitExtent(
		[
			[0, 0],
			[W, H],
		],
		{ type: 'Sphere' },
	)
	.translate([W / 2, H / 2 + 38])
	.scale(205);

/** Land outline as a clip mask over a dot pattern (static file, cached and lazy-loaded). */
export function worldDotsSvg(fill = '#3b3a37') {
	const topo = land110 as unknown as Parameters<typeof feature>[0];
	const land = feature(topo, (topo as any).objects.land) as any;
	const d = geoPath(projection).digits(1)(land) ?? '';
	const o = STEP / 2 - 1.3;
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs><pattern id="g" width="${STEP}" height="${STEP}" patternUnits="userSpaceOnUse"><rect x="${o}" y="${o}" width="2.6" height="2.6" fill="${fill}"/></pattern><clipPath id="c"><path d="${d}"/></clipPath></defs><rect width="${W}" height="${H}" fill="url(#g)" clip-path="url(#c)"/></svg>`;
}
