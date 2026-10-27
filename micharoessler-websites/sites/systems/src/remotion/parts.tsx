import type { CSSProperties, ReactNode } from 'react';
import { Easing, interpolate } from 'remotion';
import { C, FONT, MONO } from './theme';

export const ease = Easing.bezier(0.65, 0, 0.35, 1);
export const easeOut = Easing.bezier(0.22, 1, 0.36, 1);

/** Clamped interpolation with optional easing. */
export const kf = (f: number, input: number[], output: number[], easing: (t: number) => number = ease) =>
	interpolate(f, input, output, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing });

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Light "liquid glass" material, faked without backdrop-filter so it renders fast in video and in the Player. */
export const glass = (alpha = 0.62, radius = 24): CSSProperties => ({
	background: `linear-gradient(180deg, rgba(255,255,255,${Math.min(1, alpha + 0.2)}) 0%, rgba(255,255,255,${alpha}) 100%)`,
	border: '1px solid rgba(255,255,255,0.8)',
	boxShadow: [
		'inset 0 1px 0 rgba(255,255,255,0.95)',
		'inset 0 -1px 0 rgba(29,29,31,0.05)',
		'0 1px 2px rgba(16,24,40,0.06)',
		'0 12px 32px -8px rgba(16,24,40,0.14)',
		'0 40px 80px -30px rgba(16,24,40,0.22)',
	].join(', '),
	borderRadius: radius,
});

export const Abs = ({ style, children }: { style: CSSProperties; children?: ReactNode }) => (
	<div style={{ position: 'absolute', ...style }}>{children}</div>
);

/** Soft colour fields behind the glass — something for the material to "refract". */
export const Ground = ({ f }: { f: number }) => {
	const d = Math.sin(f / 60) * 4;
	return (
		<Abs
			style={{
				inset: 0,
				background: [
					`radial-gradient(40% 50% at ${22 + d}% ${18 - d}%, rgba(85,70,255,0.20), transparent 70%)`,
					`radial-gradient(38% 46% at ${82 - d}% ${26 + d}%, rgba(255,166,120,0.26), transparent 70%)`,
					`radial-gradient(44% 50% at ${58 + d}% ${88 - d}%, rgba(110,220,200,0.22), transparent 70%)`,
					C.ground,
				].join(', '),
			}}
		/>
	);
};

/** Abstract footage: gradient frames with a filmstrip rhythm. No real footage, no trademarks. */
export const HUES: [string, string][] = [
	['#ffb38a', '#ff7aa2'],
	['#7fd8ff', '#5546ff'],
	['#9be8c8', '#2bb3a3'],
	['#ffd27a', '#ff8a5c'],
	['#c9b8ff', '#7a6bff'],
	['#ffc4d6', '#c26bff'],
];

export const footage = (hue: [string, string], offsetPx = 0): CSSProperties => ({
	backgroundImage: [
		'repeating-linear-gradient(90deg, rgba(255,255,255,0.0) 0 70px, rgba(255,255,255,0.55) 70px 71px)',
		'radial-gradient(60% 90% at 30% 110%, rgba(255,255,255,0.35), transparent 60%)',
		`linear-gradient(120deg, ${hue[0]}, ${hue[1]})`,
	].join(', '),
	backgroundPosition: `${-offsetPx}px 0, 0 0, 0 0`,
});

export const Mono = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
	<span style={{ fontFamily: MONO, letterSpacing: '0.02em', fontVariantNumeric: 'tabular-nums', ...style }}>{children}</span>
);

export const Check = ({ size = 24, color = '#fff' }: { size?: number; color?: string }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
		<path d="M5 12.5l4.2 4.2L19 7" stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

export const textStyle = (size: number, weight = 600, color = C.ink): CSSProperties => ({
	fontFamily: FONT,
	fontSize: size,
	fontWeight: weight,
	color,
	letterSpacing: size > 40 ? '-0.035em' : '-0.01em',
	lineHeight: 1,
	whiteSpace: 'nowrap',
});

/**
 * The finished episode frame (fictional): sky, hills, title card, data card, captions.
 * Rendered at any box size; layers switch on as they are added in the timeline.
 */
export const FinishedFrame = ({
	w,
	h,
	f,
	title = 1,
	data = 1,
	caps = 1,
	broll = 1,
	labels,
}: {
	w: number;
	h: number;
	f: number;
	title?: number;
	data?: number;
	caps?: number;
	broll?: number;
	labels: { title: string; subtitle: string; caption: string; data: string[] };
}) => {
	const u = Math.min(w, h) / 100; // 1 % of the short side
	const tall = h > w;
	const zoom = 1.06 - 0.06 * kf(f % 240, [0, 240], [0, 1], (x) => x);
	const hills = (
		<svg viewBox="0 0 160 90" preserveAspectRatio="xMidYMax slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
			<circle cx="104" cy="44" r="13" fill="#fff4e6" opacity="0.95" />
			<path d="M0 62 C 30 48, 52 58, 78 50 S 130 44, 160 54 V90 H0Z" fill="#8f7dff" opacity="0.75" />
			<path d="M0 72 C 26 62, 60 70, 92 62 S 140 62, 160 68 V90 H0Z" fill="#5546ff" opacity="0.85" />
			<path d="M0 82 C 40 74, 80 84, 120 76 S 150 78, 160 80 V90 H0Z" fill="#2c2489" />
		</svg>
	);
	return (
		<div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 'inherit', background: 'linear-gradient(180deg, #ffd9c4 0%, #f3c2d8 38%, #b9adff 72%, #8a7dff 100%)' }}>
			<div style={{ position: 'absolute', inset: 0, transform: `scale(${zoom})`, transformOrigin: '60% 70%' }}>{hills}</div>
			{/* b-roll inset */}
			<div
				style={{
					position: 'absolute',
					left: tall ? 6 * u : 4 * u,
					top: tall ? 8 * u : 6 * u,
					width: tall ? 34 * u : 26 * u,
					height: tall ? 22 * u : 15 * u,
					borderRadius: 2 * u,
					...footage(HUES[2]),
					backgroundSize: 'auto, auto, auto',
					boxShadow: '0 1px 0 rgba(255,255,255,0.7) inset, 0 6px 18px rgba(20,16,80,0.25)',
					opacity: broll,
					transform: `translateY(${(1 - broll) * 3 * u}px)`,
				}}
			/>
			{/* data card */}
			<div
				style={{
					position: 'absolute',
					right: 4 * u,
					top: tall ? 36 * u : 6 * u,
					width: tall ? 52 * u : 30 * u,
					padding: 2.4 * u,
					...glass(0.55, 2.4 * u),
					opacity: data,
					transform: `translateY(${(1 - data) * 4 * u}px)`,
				}}
			>
				{labels.data.map((l, i) => {
					const g = kf(f - i * 4, [0, 30], [0, 1], easeOut) * data;
					return (
						<div key={l} style={{ display: 'grid', gridTemplateColumns: '46% 1fr', alignItems: 'center', gap: 1.4 * u, marginTop: i ? 1.6 * u : 0 }}>
							<span style={{ ...textStyle(2.6 * u, 560, C.ink), letterSpacing: 0 }}>{l}</span>
							<span style={{ height: 1.6 * u, borderRadius: u, background: 'rgba(29,29,31,0.08)', overflow: 'hidden' }}>
								<span style={{ display: 'block', height: '100%', width: `${[86, 72, 94][i] * g}%`, background: i === 2 ? C.iris : '#8b80ff', borderRadius: u }} />
							</span>
						</div>
					);
				})}
			</div>
			{/* title */}
			<div
				style={{
					position: 'absolute',
					left: tall ? 6 * u : 4 * u,
					bottom: tall ? 30 * u : 20 * u,
					opacity: title,
					transform: `translateX(${(1 - title) * -6 * u}px)`,
				}}
			>
				<div style={{ ...textStyle(tall ? 11 * u : 9 * u, 700, '#fff'), textShadow: '0 2px 18px rgba(30,20,90,0.35)' }}>{labels.title}</div>
				<div style={{ ...textStyle(tall ? 4.6 * u : 3.4 * u, 500, 'rgba(255,255,255,0.92)'), marginTop: 1.4 * u }}>{labels.subtitle}</div>
			</div>
			{/* captions */}
			<div style={{ position: 'absolute', left: 0, right: 0, bottom: tall ? 14 * u : 6 * u, display: 'flex', justifyContent: 'center', opacity: caps }}>
				<span
					style={{
						...textStyle(tall ? 4.4 * u : 3.2 * u, 600, '#fff'),
						whiteSpace: tall ? 'normal' : 'nowrap',
						textAlign: 'center',
						maxWidth: tall ? '84%' : 'none',
						lineHeight: 1.2,
						padding: `${0.9 * u}px ${1.8 * u}px`,
						borderRadius: 1.2 * u,
						background: 'rgba(20,16,60,0.42)',
					}}
				>
					{labels.caption}
				</span>
			</div>
		</div>
	);
};
