import type { CSSProperties } from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, FONT, type FilmProps } from './theme';
import { t } from './strings';
import { Abs, Check, FinishedFrame, Ground, HUES, Mono, ease, easeOut, footage, glass, kf, lerp, textStyle } from './parts';

/*
 * "Video ready in 3 · 2 · 1" — an edit, start to finish, in 15 seconds (450 f @ 30 fps).
 *   0– 96  countdown, then the camera dives into the timeline
 *  96–132  raw clips slide in            (close-up, camera follows the playhead)
 * 132–250  blade cuts snap, gaps ripple-close; a feedback pin is resolved by a cut
 * 245–330  layers stack on top in 3D     (b-roll, titles + data card, captions, music, sfx)
 * 330–385  camera pulls back to the whole glass editor, export bar fills
 * 385–450  "Video ready." — finished frame in 16:9 + 9:16, CTA pressed
 * Everything is generic and fictional. The countdown is a metaphor, not a turnaround promise.
 */

// ---------- world (editor window) geometry, in world px ----------
const WIN = { w: 1600, h: 900 };
const LANE_X = 132;
const U = 24; // px per timeline unit
const TRACK_Y0 = 566;
const TRACK_H = 44;
const trackY = (i: number) => TRACK_Y0 + i * 50; // 0 titles, 1 b-roll, 2 video, 3 captions, 4 music, 5 sfx
const V1 = 2;

// V1 pieces in raw units; `cut` = frame at which the piece is bladed off and removed.
type Piece = { s: number; e: number; hue: number; cut?: number; group: number };
const PIECES: Piece[] = [
	{ s: 0, e: 10, hue: 0, group: 0 },
	{ s: 10, e: 14, hue: 0, cut: 140, group: 0 },
	{ s: 14, e: 19, hue: 1, cut: 172, group: 1 },
	{ s: 19, e: 32, hue: 1, group: 1 },
	{ s: 32, e: 40, hue: 2, group: 2 },
	{ s: 40, e: 44, hue: 2, cut: 206, group: 2 },
	{ s: 44, e: 60, hue: 3, group: 3 },
];
const CUTS = PIECES.filter((p) => p.cut).map((p) => p.cut!);
const ripple = (f: number, p: Piece) => kf(f, [p.cut! + 9, p.cut! + 19], [0, 1]);
const pieceX = (f: number, piece: Piece) =>
	piece.s - PIECES.filter((p) => p.cut && p.e <= piece.s).reduce((a, p) => a + (p.e - p.s) * ripple(f, p), 0);

// Playhead, in current (rippled) units.
const playU = (f: number) => kf(f, [96, 140, 172, 206, 250], [0, 10, 15, 31, 47], (x) => x);

// Layers added after the cut, in final units.
const LAYERS: { track: number; at: number; clips: [number, number, number][] }[] = [
	{ track: 1, at: 252, clips: [[6, 12, 4], [24, 30, 5], [38, 44, 2]] },
	{ track: 0, at: 260, clips: [[1, 7, -1], [20, 26, -2], [36, 41, -1]] },
	{ track: 3, at: 268, clips: Array.from({ length: 11 }, (_, i) => [0.5 + i * 4.2, 3.9 + i * 4.2, -3] as [number, number, number]) },
	{ track: 4, at: 276, clips: [[0, 47, -4]] },
	{ track: 5, at: 284, clips: [[10, 11, -5], [15, 16, -5], [31, 32, -5], [40, 41, -5]] },
];

const Wave = ({ w, h, f }: { w: number; h: number; f: number }) => {
	const n = Math.floor(w / 5);
	const d = Array.from({ length: n }, (_, i) => {
		const a = 0.25 + 0.75 * Math.abs(Math.sin(i * 0.37) * Math.cos(i * 0.11 + f * 0.02));
		const y = (h / 2) * a * 0.9;
		return `M${i * 5 + 2} ${h / 2 - y}V${h / 2 + y}`;
	}).join('');
	return (
		<svg width={w} height={h} style={{ position: 'absolute', inset: 0 }}>
			<path d={d} stroke="rgba(255,255,255,0.9)" strokeWidth={2.4} strokeLinecap="round" />
		</svg>
	);
};

const Editor = ({ f, lang, depth }: { f: number; lang: FilmProps['lang']; depth: number }) => {
	const s = t(lang);
	const u = playU(f);
	const phX = LANE_X + u * U;
	const cutting = CUTS.some((c) => f >= c - 2 && f < c + 8);
	const tc = (x: number) => {
		const sec = x * 2;
		return `00:${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(Math.floor(sec % 60)).padStart(2, '0')}:${String(Math.floor((sec % 1) * 25)).padStart(2, '0')}`;
	};
	const layerOn = (at: number) => kf(f, [at, at + 14], [0, 1], easeOut);
	const z = (i: number) => (5 - i) * 26 * depth; // tracks separate in depth while the camera tilts

	return (
		<div style={{ position: 'absolute', width: WIN.w, height: WIN.h, ...glass(0.6, 28), fontFamily: FONT, transformStyle: 'preserve-3d' }}>
			{/* title bar */}
			<Abs style={{ left: 22, top: 18, display: 'flex', gap: 8 }}>
				{[0, 1, 2].map((i) => (
					<span key={i} style={{ width: 12, height: 12, borderRadius: 6, background: 'rgba(29,29,31,0.14)' }} />
				))}
			</Abs>
			<Abs style={{ left: 0, right: 0, top: 14, textAlign: 'center', ...textStyle(15, 560, C.ink2) }}>{s.file}</Abs>
			<Abs style={{ left: 0, right: 0, top: 48, height: 1, background: C.line }} />

			{/* media bin */}
			<Abs style={{ left: 24, top: 72, width: 250, height: 360, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, alignContent: 'start' }}>
				{HUES.map((h, i) => (
					<span key={i} style={{ height: 62, borderRadius: 10, ...footage(h, i * 30), boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)' }} />
				))}
			</Abs>

			{/* program monitors: 16:9 + 9:16, showing the layers as they are added */}
			{[
				{ left: 296, w: 640 },
				{ left: 956, w: 203 },
			].map((m, i) => (
				<Abs key={i} style={{ left: m.left, top: 72, width: m.w, height: 360, borderRadius: 14, overflow: 'hidden', background: '#16141f', boxShadow: '0 0 0 1px rgba(29,29,31,0.08)' }}>
					<FinishedFrame
						w={m.w}
						h={360}
						f={f}
						title={layerOn(260)}
						data={layerOn(264)}
						caps={layerOn(268)}
						broll={layerOn(252)}
						labels={{ title: s.title, subtitle: s.subtitle, caption: s.caption, data: s.data }}
					/>
				</Abs>
			))}

			{/* inspector */}
			<Abs style={{ left: 1182, top: 72, width: 394, height: 360, display: 'grid', gap: 14, alignContent: 'start' }}>
				{[0.9, 0.6, 0.75, 0.45, 0.82, 0.55].map((w, i) => (
					<div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12, alignItems: 'center' }}>
						<span style={{ height: 10, width: 70 + (i % 3) * 18, borderRadius: 5, background: 'rgba(29,29,31,0.1)' }} />
						<span style={{ height: 6, borderRadius: 3, background: 'rgba(29,29,31,0.08)', position: 'relative' }}>
							<span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${w * 100}%`, borderRadius: 3, background: i === 2 ? C.iris : 'rgba(29,29,31,0.22)' }} />
						</span>
					</div>
				))}
			</Abs>

			{/* timeline toolbar */}
			<Abs style={{ left: 0, right: 0, top: 456, height: 1, background: C.line }} />
			<Abs style={{ left: 24, top: 470, display: 'flex', gap: 10, alignItems: 'center' }}>
				{['M5 5l14 7-6 1-2 6z', 'M7 4l10 16M17 4L7 20', 'M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4'].map((d, i) => (
					<span
						key={i}
						style={{
							width: 40,
							height: 32,
							borderRadius: 10,
							display: 'grid',
							placeItems: 'center',
							background: i === 1 && cutting ? C.iris : 'rgba(255,255,255,0.7)',
							boxShadow: 'inset 0 1px 0 #fff, 0 0 0 1px rgba(29,29,31,0.06)',
						}}
					>
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={i === 1 && cutting ? '#fff' : C.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<path d={d} />
						</svg>
					</span>
				))}
			</Abs>
			<Abs style={{ right: 24, top: 474 }}>
				<Mono style={{ fontSize: 20, color: C.ink, fontWeight: 500 }}>{tc(u)}</Mono>
			</Abs>

			{/* ruler */}
			<Abs style={{ left: LANE_X, top: 520, width: 47 * U + 280, height: 30 }}>
				{Array.from({ length: 60 }, (_, i) => (
					<span key={i} style={{ position: 'absolute', left: i * U, bottom: 0, width: 1, height: i % 5 ? 6 : 12, background: 'rgba(29,29,31,0.25)' }} />
				))}
				{Array.from({ length: 12 }, (_, i) => (
					<Mono key={i} style={{ position: 'absolute', left: i * 5 * U + 4, top: 0, fontSize: 11, color: C.ink2 }}>
						{`${Math.floor((i * 10) / 60)}:${String((i * 10) % 60).padStart(2, '0')}`}
					</Mono>
				))}
			</Abs>

			{/* tracks */}
			<div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d' }}>
				{s.tracks.map((name, i) => (
					<div key={name} style={{ position: 'absolute', left: 0, top: trackY(i), width: WIN.w, height: TRACK_H, transform: `translateZ(${z(i)}px)`, transformStyle: 'preserve-3d' }}>
						<Abs style={{ left: 24, top: 0, height: TRACK_H, display: 'flex', alignItems: 'center', ...textStyle(14, 560, C.ink2) }}>{name}</Abs>
						<Abs style={{ left: LANE_X, right: 24, top: 0, height: TRACK_H, borderRadius: 10, background: 'rgba(29,29,31,0.035)', boxShadow: depth > 0.05 ? `0 ${18 * depth}px ${40 * depth}px -16px rgba(16,24,40,${0.25 * depth})` : 'none' }} />
					</div>
				))}

				{/* V1: raw clips → blade → lift → ripple */}
				<div style={{ position: 'absolute', left: 0, top: trackY(V1), width: WIN.w, height: TRACK_H, transform: `translateZ(${z(V1)}px)` }}>
					{PIECES.map((p, k) => {
						const intro = spring({ frame: f - 98 - p.group * 6, fps: 30, config: { damping: 20, stiffness: 140, mass: 0.9 } });
						const x = LANE_X + pieceX(f, p) * U + (1 - intro) * 700;
						const split = (c?: number) => (c !== undefined && f >= c ? 1 : 0);
						const prev = PIECES[k - 1];
						const next = PIECES[k + 1];
						const leftOpen = prev && prev.group === p.group && !split(p.cut) && !split(prev.cut);
						const rightOpen = next && next.group === p.group && !split(next.cut) && !split(p.cut);
						const lift = p.cut ? kf(f, [p.cut + 3, p.cut + 13], [0, 1], easeOut) : 0;
						const gapL = leftOpen ? 0 : 2;
						const gapR = rightOpen ? 0 : 2;
						return (
							<div
								key={k}
								style={{
									position: 'absolute',
									left: x + gapL,
									top: 0,
									width: (p.e - p.s) * U - gapL - gapR,
									height: TRACK_H,
									borderRadius: `${leftOpen ? 0 : 10}px ${rightOpen ? 0 : 10}px ${rightOpen ? 0 : 10}px ${leftOpen ? 0 : 10}px`,
									...footage(HUES[p.hue], p.s * U),
									boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55), inset 0 0 0 1px rgba(255,255,255,0.25)',
									opacity: intro * (1 - lift),
									transform: `translateY(${-lift * 64}px) scale(${1 - lift * 0.12}) rotate(${-lift * 4}deg)`,
								}}
							>
								{!p.cut && p.e - p.s > 6 && (
									<span style={{ position: 'absolute', left: 10, top: 12, ...textStyle(12, 600, 'rgba(255,255,255,0.95)') }}>{`${s.scene} ${p.group + 1}`}</span>
								)}
							</div>
						);
					})}
				</div>

				{/* added layers */}
				{LAYERS.map((L) => (
					<div key={L.track} style={{ position: 'absolute', left: 0, top: trackY(L.track), width: WIN.w, height: TRACK_H, transform: `translateZ(${z(L.track)}px)` }}>
						{L.clips.map(([a, b, hue], i) => {
							const on = spring({ frame: f - L.at - i * 2, fps: 30, config: { damping: 18, stiffness: 170, mass: 0.8 } });
							const w = (b - a) * U - 4;
							const style: CSSProperties =
								hue >= 0
									? footage(HUES[hue], a * U)
									: hue === -1
										? { background: 'linear-gradient(180deg, #6d61ff, #5546ff)' }
										: hue === -2
											? { background: 'linear-gradient(180deg, #a69dff, #8b80ff)' }
											: hue === -3
												? { background: 'rgba(29,29,31,0.72)' }
												: hue === -4
													? { background: 'linear-gradient(180deg, #4fd1b5, #2bb3a3)' }
													: { background: 'linear-gradient(180deg, #ffb38a, #ff8a5c)' };
							return (
								<div
									key={i}
									style={{
										position: 'absolute',
										left: LANE_X + a * U + 2,
										top: hue === -3 ? 10 : 0,
										width: w,
										height: hue === -3 ? TRACK_H - 20 : TRACK_H,
										borderRadius: hue === -3 ? 6 : 10,
										overflow: 'hidden',
										...style,
										boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)',
										opacity: on,
										transform: `translateY(${(1 - on) * -46}px) scale(${0.92 + 0.08 * on})`,
									}}
								>
									{hue === -4 && <Wave w={w} h={TRACK_H} f={f} />}
									{(hue === -1 || hue === -2) && w > 90 && (
										<span style={{ position: 'absolute', left: 10, top: 13, ...textStyle(13, 600, '#fff') }}>{hue === -1 && i === 0 ? s.title : hue === -2 ? s.data[0] : s.subtitle}</span>
									)}
								</div>
							);
						})}
					</div>
				))}
			</div>

			{/* feedback pin: one note, solved once, in the system */}
			{(() => {
				const show = kf(f, [180, 190], [0, 1], easeOut) * kf(f, [236, 248], [1, 0]);
				const solved = kf(f, [210, 218], [0, 1], easeOut);
				const x = LANE_X + 33 * U;
				return (
					<div style={{ position: 'absolute', left: x, top: 452, opacity: show, transform: `translateY(${(1 - show) * 10}px) translateZ(${z(0) + 4}px)` }}>
						<div style={{ position: 'absolute', left: -6, top: 70, width: 12, height: 12, borderRadius: 6, background: solved > 0.5 ? C.green : C.iris, boxShadow: '0 0 0 4px rgba(255,255,255,0.9)' }} />
						<div
							style={{
								position: 'absolute',
								left: -20,
								top: 0,
								display: 'flex',
								alignItems: 'center',
								gap: 10,
								padding: '10px 16px 10px 10px',
								...glass(0.85, 999),
								transform: 'translateY(-4px)',
							}}
						>
							<span style={{ width: 28, height: 28, borderRadius: 14, display: 'grid', placeItems: 'center', background: lerpColor(solved) }}>
								{solved > 0.5 ? <Check size={18} /> : <span style={{ ...textStyle(14, 700, '#fff') }}>1</span>}
							</span>
							<span style={{ ...textStyle(16, 600, C.ink) }}>{solved > 0.5 ? s.done : s.pin}</span>
						</div>
					</div>
				);
			})()}

			{/* playhead */}
			<div style={{ position: 'absolute', left: phX - 1, top: 512, width: 2, height: 360, background: C.iris, transform: `translateZ(${z(0) + 8}px)`, opacity: kf(f, [94, 100], [0, 1]) * kf(f, [300, 330], [1, 0]) }}>
				<span style={{ position: 'absolute', left: -7, top: -6, width: 16, height: 16, borderRadius: 4, background: C.iris, transform: 'rotate(45deg)' }} />
				{CUTS.map((c) => {
					const fl = kf(f, [c - 2, c, c + 8], [0, 1, 0], (x) => x);
					return fl > 0 ? (
						<span key={c} style={{ position: 'absolute', left: -14, top: 140, width: 30, height: 70, borderRadius: 15, background: `rgba(85,70,255,${0.35 * fl})`, filter: 'blur(8px)' }} />
					) : null;
				})}
			</div>
		</div>
	);
};

const lerpColor = (k: number) => (k > 0.5 ? C.green : C.iris);

export const EditFilm = ({ lang }: FilmProps) => {
	const f = useCurrentFrame();
	const { width, height, fps } = useVideoConfig();
	const tall = height > width;
	const s = t(lang);

	// ---------- camera ----------
	const closeS = tall ? 3.0 : 2.8;
	const midS = tall ? 1.2 : 1.55;
	const endS = tall ? (width - 80) / WIN.w : (width - 240) / WIN.w;
	const follow = (fr: number) => LANE_X + playU(fr) * U + (tall ? 40 : 140);
	const t1 = kf(f, [236, 292], [0, 1]);
	const t2 = kf(f, [330, 364], [0, 1]);
	const camX = f < 236 ? follow(f) : lerp(lerp(follow(236), LANE_X + 47 * U * 0.5, t1), WIN.w / 2, t2);
	const camY = lerp(lerp(tall ? 690 : 640, 700, t1), tall ? WIN.h / 2 + 40 : WIN.h / 2 + 30, t2);
	const camS = f < 100 ? kf(f, [80, 100], [7, closeS], easeOut) : lerp(lerp(closeS, midS, t1), endS, t2);
	const rx = 30 * t1 * (1 - t2);
	const rz = -6 * t1 * (1 - t2);
	const depth = kf(f, [250, 292, 322, 352], [0, 1, 1, 0]);
	const worldIn = kf(f, [82, 98], [0, 1]);

	// ---------- countdown ----------
	const cd = [-14, 30, 60].map((st, i) => {
		const inn = spring({ frame: f - st, fps, config: { damping: 14, stiffness: 160, mass: 0.7 } });
		const out = i === 0 ? kf(f, [24, 32], [0, 1]) : i === 1 ? kf(f, [st + 24, st + 32], [0, 1]) : kf(f, [st + 18, st + 34], [0, 1], (x) => x * x);
		return { n: 3 - i, inn, out };
	});
	const cdShow = kf(f, [80, 96], [1, 0]);
	const disc = tall ? 760 : 560;

	// ---------- final ----------
	const fin = kf(f, [380, 396], [0, 1], easeOut);
	const cta = spring({ frame: f - 410, fps, config: { damping: 15, stiffness: 150 } });
	const press = kf(f, [430, 434, 440], [0, 1, 0], (x) => x);
	const cursor = kf(f, [414, 430], [0, 1], easeOut);
	const exp = kf(f, [340, 376], [0, 1], (x) => x);
	const expShow = kf(f, [334, 342], [0, 1], easeOut) * kf(f, [384, 394], [1, 0]);

	// ---------- step chip ----------
	const stepAt = [96, 132, 180, 250, 334];
	const step = stepAt.reduce((a, st, i) => (f >= st ? i : a), -1);
	const chipShow = kf(f, [96, 104], [0, 1]) * kf(f, [380, 390], [1, 0]);

	const labels = { title: s.title, subtitle: s.subtitle, caption: s.caption, data: s.data };
	const mon = tall
		? [
				{ x: 90, y: 330, w: 900, h: 506 },
				{ x: 324, y: 880, w: 432, h: 768 },
			]
		: [
				{ x: 270, y: 236, w: 1000, h: 562 },
				{ x: 1306, y: 236, w: 316, h: 562 },
			];

	return (
		<AbsoluteFill style={{ fontFamily: FONT, overflow: 'hidden' }}>
			<Ground f={f} />

			{/* world */}
			<AbsoluteFill style={{ perspective: 2200, perspectiveOrigin: '50% 40%', opacity: worldIn }}>
				<div
					style={{
						position: 'absolute',
						left: width / 2 - camX,
						top: height / 2 - camY,
						width: WIN.w,
						height: WIN.h,
						transformOrigin: `${camX}px ${camY}px`,
						transform: `scale(${camS}) rotateX(${rx}deg) rotateZ(${rz}deg)`,
						transformStyle: 'preserve-3d',
					}}
				>
					<Editor f={f} lang={lang} depth={depth} />
				</div>
			</AbsoluteFill>

			{/* countdown */}
			{cdShow > 0 && (
				<AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: cdShow, transform: `scale(${1 + (1 - cdShow) * 2.2})` }}>
					<div style={{ position: 'absolute', top: height / 2 - disc / 2 - (tall ? 170 : 110), ...glass(0.72, 999), padding: tall ? '22px 44px' : '16px 30px', ...textStyle(tall ? 58 : 34, 600, C.ink) }}>{s.readyIn}</div>
					<div style={{ width: disc, height: disc, borderRadius: disc / 2, position: 'relative', ...glass(0.42, disc / 2), boxShadow: `${glass(0.42).boxShadow}, inset 0 24px 60px rgba(255,255,255,0.55), inset 0 -30px 60px rgba(85,70,255,0.10)` }}>
						{/* specular rim: bright arc top-left, faint shade bottom-right */}
						<div style={{ position: 'absolute', inset: 6, borderRadius: '50%', boxShadow: 'inset 10px 14px 18px -10px rgba(255,255,255,0.95), inset -12px -16px 24px -14px rgba(29,29,31,0.14)' }} />
						{/* progress ring */}
						<svg width={disc} height={disc} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
							<circle cx={disc / 2} cy={disc / 2} r={disc / 2 - 14} fill="none" stroke="rgba(85,70,255,0.12)" strokeWidth={6} />
							<circle
								cx={disc / 2}
								cy={disc / 2}
								r={disc / 2 - 14}
								fill="none"
								stroke={C.iris}
								strokeWidth={6}
								strokeLinecap="round"
								strokeDasharray={Math.PI * (disc - 28)}
								strokeDashoffset={Math.PI * (disc - 28) * (1 - kf(f, [0, 84], [0, 1], (x) => x))}
							/>
						</svg>
						{cd.map(({ n, inn, out }) =>
							inn > 0.001 && out < 0.999 ? (
								<div
									key={n}
									style={{
										position: 'absolute',
										inset: 0,
										display: 'grid',
										placeItems: 'center',
										opacity: Math.min(1, inn * 1.4) * (1 - out),
										transform: `scale(${0.7 + 0.3 * inn + out * 0.35})`,
										filter: out > 0 ? `blur(${out * 12}px)` : 'none',
									}}
								>
									<span
										style={{
											...textStyle(disc * 0.62, 650, 'transparent'),
											letterSpacing: '-0.06em',
											backgroundImage: 'linear-gradient(170deg, #8b80ff 0%, #5546ff 45%, #2f22c9 100%)',
											WebkitBackgroundClip: 'text',
											backgroundClip: 'text',
											filter: 'drop-shadow(0 18px 30px rgba(85,70,255,0.35))',
											transform: `translateY(${-disc * 0.02}px)`,
										}}
									>
										{n}
									</span>
								</div>
							) : null,
						)}
					</div>
				</AbsoluteFill>
			)}

			{/* step chip */}
			{chipShow > 0 && (
				<div style={{ position: 'absolute', left: tall ? '50%' : 56, ...(tall ? { top: 120 } : { bottom: 48 }), transform: `translateX(${tall ? '-50%' : '0'}) translateY(${(1 - chipShow) * (tall ? -12 : 12)}px)`, opacity: chipShow, display: 'flex', alignItems: 'center', gap: 16, padding: '12px 22px 12px 14px', ...glass(0.82, 999) }}>
					<span style={{ display: 'flex', gap: 6 }}>
						{s.steps.map((_, i) => (
							<span key={i} style={{ width: i === step ? (tall ? 34 : 22) : tall ? 12 : 8, height: tall ? 12 : 8, borderRadius: 6, background: i <= step ? C.iris : 'rgba(29,29,31,0.15)' }} />
						))}
					</span>
					<span style={{ ...textStyle(tall ? 44 : 24, 600, C.ink) }}>{s.steps[Math.max(0, step)]}</span>
				</div>
			)}

			{/* export bar */}
			{expShow > 0 && (
				<div style={{ position: 'absolute', left: '50%', bottom: tall ? 260 : 96, width: tall ? 720 : 560, transform: `translateX(-50%) translateY(${(1 - expShow) * 20}px)`, opacity: expShow, padding: '18px 22px', ...glass(0.86, 22) }}>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
						<span style={{ ...textStyle(tall ? 28 : 22, 600) }}>{s.export}</span>
						<Mono style={{ fontSize: tall ? 26 : 20, color: exp >= 1 ? C.green : C.ink }}>{`${Math.round(exp * 100)} %`}</Mono>
					</div>
					<div style={{ height: 10, borderRadius: 5, background: 'rgba(29,29,31,0.08)', overflow: 'hidden' }}>
						<div style={{ height: '100%', width: `${exp * 100}%`, borderRadius: 5, background: exp >= 1 ? C.green : `linear-gradient(90deg, ${C.irisSoft}, ${C.iris})` }} />
					</div>
				</div>
			)}

			{/* finished */}
			{fin > 0 && (
				<AbsoluteFill>
					<AbsoluteFill style={{ background: `rgba(238,240,245,${0.78 * fin})` }} />
					<div style={{ position: 'absolute', left: 0, right: 0, top: tall ? 170 : 92, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 22, opacity: fin, transform: `translateY(${(1 - fin) * 24}px)` }}>
						<span style={{ width: tall ? 72 : 64, height: tall ? 72 : 64, borderRadius: 40, background: C.green, display: 'grid', placeItems: 'center', boxShadow: '0 10px 30px -8px rgba(31,168,79,0.6)' }}>
							<Check size={tall ? 40 : 36} />
						</span>
						<span style={{ ...textStyle(tall ? 96 : 92, 650) }}>{s.ready}</span>
					</div>
					{mon.map((m, i) => {
						const k = kf(f, [384 + i * 5, 404 + i * 5], [0, 1], easeOut);
						return (
							<div
								key={i}
								style={{
									position: 'absolute',
									left: m.x,
									top: m.y,
									width: m.w,
									height: m.h,
									padding: 10,
									...glass(0.7, 30),
									opacity: k,
									transform: `translateY(${(1 - k) * 60}px) scale(${0.94 + 0.06 * k})`,
								}}
							>
								<div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 21, overflow: 'hidden' }}>
									<FinishedFrame w={m.w - 20} h={m.h - 20} f={f - 384} labels={labels} />
								</div>
								<Mono style={{ position: 'absolute', right: 22, top: 20, fontSize: tall ? 22 : 18, color: '#fff', padding: '4px 10px', borderRadius: 999, background: 'rgba(20,16,60,0.35)' }}>{s.formats[i]}</Mono>
							</div>
						);
					})}
					{/* CTA */}
					<div style={{ position: 'absolute', left: 0, right: 0, bottom: tall ? 120 : 64, display: 'flex', justifyContent: 'center', opacity: cta, transform: `translateY(${(1 - cta) * 30}px)` }}>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 14,
								padding: tall ? '30px 52px' : '22px 40px',
								borderRadius: 999,
								background: `linear-gradient(180deg, #6d61ff, ${C.iris})`,
								boxShadow: `inset 0 1px 0 rgba(255,255,255,0.45), 0 18px 40px -12px rgba(85,70,255,${0.55 + 0.3 * press}), 0 0 0 ${press * 10}px rgba(85,70,255,${0.18 * press})`,
								transform: `scale(${1 - press * 0.05})`,
								...textStyle(tall ? 38 : 30, 600, '#fff'),
							}}
						>
							{s.cta}
							<span style={{ fontWeight: 400 }}>→</span>
						</div>
					</div>
					{/* pointer */}
					<svg
						width={tall ? 44 : 36}
						height={tall ? 44 : 36}
						viewBox="0 0 24 24"
						style={{
							position: 'absolute',
							left: lerp(width * 0.78, width / 2 + (tall ? 120 : 110), cursor),
							top: lerp(height * 0.98, height - (tall ? 160 : 92), cursor),
							opacity: kf(f, [412, 418], [0, 1]),
							transform: `scale(${1 - press * 0.15})`,
							filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.25))',
						}}
					>
						<path d="M4 2l16 10-7 1.4L9.6 21z" fill="#fff" stroke={C.ink} strokeWidth="1.4" strokeLinejoin="round" />
					</svg>
				</AbsoluteFill>
			)}
		</AbsoluteFill>
	);
};
