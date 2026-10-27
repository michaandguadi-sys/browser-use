// Shared constants for the edit film (Remotion) and the page player.
export const FPS = 30;
export const DURATION = 450; // 15 s
export const WIDE = { width: 1920, height: 1080 };
export const TALL = { width: 1080, height: 1920 };

export const C = {
	ground: '#eef0f5',
	ink: '#1d1d1f',
	ink2: '#6e6e73',
	iris: '#5546ff',
	irisSoft: '#8b80ff',
	green: '#1fa84f',
	glass: 'rgba(255,255,255,0.62)',
	glassThick: 'rgba(255,255,255,0.8)',
	line: 'rgba(29,29,31,0.08)',
};

export const FONT = "'Inter Variable', 'Inter', system-ui, sans-serif";
export const MONO = "'Geist Mono Variable', ui-monospace, monospace";

export type FilmProps = { lang: 'de' | 'en' };
