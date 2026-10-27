import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';

export const QUALITY = 78;

export type Crop = { ratio?: number; position?: string };

/**
 * Responsive options shared by <Photo> and the LCP preload in Base, so both resolve to identical files.
 * Never requests a width larger than the master; with a ratio, crops server-side (sharp "cover").
 */
export function imgOptions(img: ImageMetadata, widths: number[], crop: Crop = {}) {
	const max = Math.max(...widths);
	let w = Math.min(img.width, max);
	let h: number | undefined;
	if (crop.ratio) {
		w = Math.min(w, Math.floor(img.height * crop.ratio));
		h = Math.round(w / crop.ratio);
	}
	const usable = [...new Set([...widths.filter((x) => x < w), w])];
	return {
		widths: usable,
		...(h ? { width: w, height: h, fit: 'cover' as const, position: crop.position ?? 'center' } : {}),
	};
}

export type ArtVariant = { media?: string; ratio: number; widths: number[]; sizes: string; position?: string };
export type ArtSource = { media?: string; sizes: string; avif: string; webp: string };
export type Art = { sources: ArtSource[]; fallback: { src: string; width: number; height: number } };

/** Art-directed crops (e.g. 2:1 desktop, 4:5 phone) for the LCP image; also feeds the <link rel=preload>. */
export async function buildArt(img: ImageMetadata, variants: ArtVariant[]): Promise<Art> {
	const sources: ArtSource[] = [];
	for (const v of variants) {
		const o = imgOptions(img, v.widths, { ratio: v.ratio, position: v.position });
		const [a, w] = await Promise.all([
			getImage({ src: img, ...o, format: 'avif', quality: QUALITY }),
			getImage({ src: img, ...o, format: 'webp', quality: QUALITY }),
		]);
		sources.push({ media: v.media, sizes: v.sizes, avif: a.srcSet.attribute, webp: w.srcSet.attribute });
	}
	const last = variants[variants.length - 1];
	const fo = imgOptions(img, [1280], { ratio: last.ratio, position: last.position });
	const fb = await getImage({ src: img, ...fo, format: 'jpg', quality: QUALITY });
	return { sources, fallback: { src: fb.src, width: Number(fb.attributes.width), height: Number(fb.attributes.height) } };
}

/** AVIF preload entry matching <Photo> with the same arguments. */
export async function preloadFor(img: ImageMetadata, widths: number[], sizes: string, crop: Crop = {}) {
	const o = imgOptions(img, widths, crop);
	const a = await getImage({ src: img, ...o, format: 'avif', quality: QUALITY });
	return { srcset: a.srcSet.attribute, sizes };
}
