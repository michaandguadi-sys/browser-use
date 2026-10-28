// Chapter map for the scroll story (scroll progress 0 → 1 across the pinned section).
// Shared by the DOM timeline (story.ts) and the WebGL scene (story-scene.ts).
export const CH = {
	qOut: 0.05, // a: question leaves
	hoursIn: 0.1, // b: hours odometer + chips
	count: [0.13, 0.34],
	hoursOut: 0.37, // c: numerals → glass shards, camera flies through (0.37 → 0.52)
	tl: [0.52, 0.76], // d: 3D timeline, playhead accelerates
	line: 0.74, // d → e: one light line
	write: [0.8, 0.9], // e: the promise writes itself
	settle: 0.91, // f: promise settles into the H1 + CTA
	home: 0.86, // scene jumps back to the ambient pose (hidden by the veil)
} as const;

export type StoryState = { p: number; px: number; py: number; lite: boolean; odo: () => DOMRect | null };
