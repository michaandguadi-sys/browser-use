// Build-prep: render the edit film's posters + MP4s with Remotion. Not part of `astro build`.
// Usage: node scripts/render-film.mjs [--stills-only] [--og] [--frames=0,60,150 --out=dir]
// Needs a Chromium: set REMOTION_CHROME (defaults to the Playwright headless shell if present).
import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import { existsSync, globSync, mkdirSync, statSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]));
const root = path.resolve(import.meta.dirname, '..');
const chrome =
	process.env.REMOTION_CHROME ?? globSync('/opt/pw-browsers/chromium_headless_shell-*/chrome-*/chrome-headless-shell')[0];
const browserExecutable = chrome && existsSync(chrome) ? chrome : null;
const serveUrl = await bundle({ entryPoint: path.join(root, 'src/remotion/index.ts') });
const comps = [
	{ id: 'EditFilm', tag: 'wide' },
	{ id: 'EditFilmTall', tag: 'tall' },
];

const still = async (id, lang, frame, out) => {
	const composition = await selectComposition({ serveUrl, id, inputProps: { lang }, browserExecutable, logLevel: 'error' });
	await renderStill({ composition, serveUrl, frame, output: out, inputProps: { lang }, browserExecutable, imageFormat: 'png', logLevel: 'error' });
	return out;
};

if (args.frames) {
	// QA strip: arbitrary frames to a scratch dir
	mkdirSync(args.out, { recursive: true });
	for (const c of comps.filter((c) => !args.comp || c.tag === args.comp))
		for (const fr of String(args.frames).split(',').map(Number))
			console.log(await still(c.id, args.lang ?? 'de', fr, path.join(args.out, `${c.tag}-${args.lang ?? 'de'}-${String(fr).padStart(3, '0')}.png`)));
	process.exit(0);
}

if (args.og) {
	// OG image (1200×630) from the film's final frame, rendered at 1920×1008 so nothing gets cropped.
	const base = await selectComposition({ serveUrl, id: 'EditFilm', inputProps: { lang: 'de' }, browserExecutable, logLevel: 'error' });
	const composition = { ...base, width: 1920, height: 1008 };
	const png = path.join(root, 'node_modules/.cache/og-film.png');
	mkdirSync(path.dirname(png), { recursive: true });
	await renderStill({ composition, serveUrl, frame: base.durationInFrames - 1, output: png, inputProps: { lang: 'de' }, browserExecutable, imageFormat: 'png', logLevel: 'error' });
	await sharp(png).resize(1200, 630).png({ compressionLevel: 9 }).toFile(path.join(root, 'public/og.png'));
	console.log('public/og.png');
	process.exit(0);
}

const media = path.join(root, 'public/media');
const posters = path.join(root, 'src/assets/film');
mkdirSync(media, { recursive: true });
mkdirSync(posters, { recursive: true });
const tmp = path.join(root, 'node_modules/.cache/film');
mkdirSync(tmp, { recursive: true });

for (const lang of ['de', 'en'])
	for (const c of comps) {
		const composition = await selectComposition({ serveUrl, id: c.id, inputProps: { lang }, browserExecutable, logLevel: 'error' });
		// Posters: first frame (autoplay start) and last frame (reduced motion). Astro turns these into AVIF/WebP.
		for (const [name, frame] of [
			['start', 0],
			['end', composition.durationInFrames - 1],
		]) {
			const png = await still(c.id, lang, frame, path.join(tmp, `${c.tag}-${lang}-${name}.png`));
			await sharp(png).webp({ quality: 88 }).toFile(path.join(posters, `${c.tag}-${lang}-${name}.webp`));
		}
		if (args['stills-only']) continue;
		const out = path.join(media, `edit-film-${c.tag}-${lang}.mp4`);
		await renderMedia({
			composition,
			serveUrl,
			codec: 'h264',
			crf: c.tag === 'wide' ? 24 : 23,
			imageFormat: 'png',
			logLevel: 'error',
			x264Preset: 'veryslow',
			pixelFormat: 'yuv420p',
			outputLocation: out,
			inputProps: { lang },
			browserExecutable,
			concurrency: 4,
		});
		console.log(out, (statSync(out).size / 1024 / 1024).toFixed(2) + ' MB');
	}
