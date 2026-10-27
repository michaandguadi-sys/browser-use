import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, FONT, type FilmProps } from './theme';
import { t } from './strings';
import { Check, Ground, HUES, ease, easeOut, footage, glass, kf, lerp } from './parts';

/*
 * The pitch film — 20 s (600 f @ 30 fps), kinetic type, DE + EN, 16:9 + 9:16.
 *   0– 70  "Keine Zeit fürs Editing?"           words snap in behind masks
 *  64–178  hours roll up: 6 h, + 6 h, + 6 h …   odometer gets heavier, glass chips pile up
 * 172–210  camera flies through the numbers     they shatter into glass shards
 * 190–335  a fast timeline, camera locked on the cursor, accelerating → speed lines → one light line
 * 330–410  the light line writes "Wir nehmen euch diese Zeit ab."
 * 410–532  three benefit beats
 * 532–600  end card + CTA click
 * Rhetorical illustration only: no measured numbers, no promises of turnaround.
 */

const sp = (f: number, fps: number, cfg = { damping: 16, stiffness: 190, mass: 0.7 }) => spring({ frame: f, fps, config: cfg });

// deterministic pseudo-random
const rnd = (i: number) => {
	const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
	return x - Math.floor(x);
};

const T = (size: number, weight = 700, color: string = C.ink): CSSProperties => ({
	fontFamily: FONT,
	fontSize: size,
	fontWeight: weight,
	color,
	letterSpacing: size > 60 ? '-0.045em' : '-0.015em',
	lineHeight: 1,
	whiteSpace: 'nowrap',
});

/** A word that slides up from behind a mask, and out again. */
const MaskWord = ({ f, at, out, children, style, fps }: { f: number; at: number; out?: number; children: ReactNode; style?: CSSProperties; fps: number }) => {
	const i = sp(f - at, fps);
	const o = out === undefined ? 0 : kf(f, [out, out + 9], [0, 1], (x) => x * x);
	return (
		<span style={{ display: 'inline-block', overflow: 'hidden', padding: '0.06em 0.04em 0.14em', margin: '-0.06em -0.04em -0.14em', verticalAlign: 'top' }}>
			<span style={{ display: 'inline-block', transform: `translateY(${(1 - i) * 112 - o * 112}%) rotate(${(1 - i) * 4}deg)`, ...style }}>{children}</span>
		</span>
	);
};

const accent: CSSProperties = {
	backgroundImage: `linear-gradient(170deg, ${C.irisSoft} 0%, ${C.iris} 50%, #2f22c9 100%)`,
	WebkitBackgroundClip: 'text',
	backgroundClip: 'text',
	color: 'transparent',
};

// ---------- hours ----------
const STEPS = [72, 94, 112, 126, 138, 148, 156, 163, 169, 174]; // 6 … 60
const hoursAt = (f: number) => {
	let v = 0;
	STEPS.forEach((st) => (v += 6 * kf(f, [st, st + 7], [0, 1], easeOut)));
	return v;
};

const Odometer = ({ v, size, weight }: { v: number; size: number; weight: number }) => {
	const lh = size * 1.0;
	const tens = Math.floor(v / 10) + Math.min(1, Math.max(0, (v % 10) - 9));
	const col = (pos: number, n: number, key: string) => (
		<span key={key} style={{ display: 'inline-block', height: lh, overflow: 'hidden', width: '0.62em' }}>
			<span style={{ display: 'block', transform: `translateY(${-pos * lh}px)` }}>
				{Array.from({ length: n }, (_, i) => (
					<span key={i} style={{ display: 'block', height: lh, lineHeight: `${lh}px`, textAlign: 'center' }}>
						{i % 10}
					</span>
				))}
			</span>
		</span>
	);
	return (
		<span style={{ ...T(size, weight), display: 'inline-flex', alignItems: 'flex-start', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
			<span style={{ display: 'inline-flex', width: v >= 9 ? undefined : 0, opacity: Math.min(1, Math.max(0, v - 8)), overflow: 'hidden' }}>{col(tens, 10, 't')}</span>
			{col(v, 70, 'u')}
			<span style={{ marginLeft: '0.12em', ...accent }}>h</span>
		</span>
	);
};

// ---------- timeline ----------
type Clip = { a: number; b: number; hue: number };
const TRACKS: Clip[][] = Array.from({ length: 6 }, (_, ti) => {
	const out: Clip[] = [];
	let x = ti === 2 ? 0 : 160 + rnd(ti * 7) * 400;
	let k = 0;
	while (x < 30000) {
		const len = ti === 2 ? 260 + rnd(ti * 100 + k) * 420 : ti === 3 ? 150 + rnd(ti * 100 + k) * 120 : ti === 5 ? 40 + rnd(k) * 40 : ti === 4 ? 1400 : 220 + rnd(ti * 100 + k) * 360;
		out.push({ a: x, b: x + len, hue: ti === 2 ? k % HUES.length : ti });
		x += len + (ti === 2 ? 6 : ti === 3 ? 18 : ti === 4 ? 10 : 120 + rnd(ti * 33 + k) * 520);
		k++;
	}
	return out;
});
const travel = (f: number) => {
	const d = Math.max(0, f - 188);
	return 34 * d + 0.0042 * d * d * d;
};
const speed = (f: number) => travel(f + 1) - travel(f);

const clipStyle = (ti: number, c: Clip): CSSProperties =>
	ti === 2
		? footage(HUES[c.hue], c.a)
		: ti === 0
			? { background: 'linear-gradient(180deg, #6d61ff, #5546ff)' }
			: ti === 1
				? { background: 'linear-gradient(180deg, #b3aaff, #8b80ff)' }
				: ti === 3
					? { background: 'rgba(29,29,31,0.72)' }
					: ti === 4
						? { background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.85) 0 2px, transparent 2px 7px), linear-gradient(180deg, #4fd1b5, #2bb3a3)' }
						: { background: 'linear-gradient(180deg, #ffb38a, #ff8a5c)' };

export const EditFilm = ({ lang }: FilmProps) => {
	const f = useCurrentFrame();
	const { width: W, height: H, fps } = useVideoConfig();
	const tall = H > W;
	const s = t(lang);
	const u = W / 100; // 1 % of width

	// ============ A: question ============
	const qSize = tall ? 17.5 * u : 10.4 * u;
	const qLines = tall ? s.q.flat().map((w) => [w]) : s.q;
	let wi = 0;
	const qOut = 62;

	// ============ B: hours ============
	const v = hoursAt(f);
	const heavy = v / 60;
	const shakeAmp = STEPS.reduce((a, st, i) => a + kf(f, [st, st + 3, st + 12], [0, 1, 0], (x) => x) * (2 + i * 1.6), 0);
	const shake = { x: Math.sin(f * 2.3) * shakeAmp, y: Math.cos(f * 3.1) * shakeAmp * 0.6 };
	const hoursIn = kf(f, [64, 76], [0, 1], easeOut);
	const fly = kf(f, [178, 206], [0, 1], (x) => x * x);
	const shatter = f >= 178;
	const numSize = tall ? 30 * u : 17 * u;

	// ============ D: timeline ============
	const X = travel(f);
	const vel = speed(f);
	const deckIn = kf(f, [186, 206], [0, 1], easeOut);
	const deckOut = kf(f, [306, 330], [1, 0]);
	const blur = Math.min(6, Math.max(0, (vel - 60) / 45));
	const th = tall ? 110 : 84;
	const tg = tall ? 16 : 12;
	const phx = tall ? W * 0.5 : W * 0.42; // cursor x on screen
	const deckH = 6 * (th + tg) + 70;
	const deckTop = H / 2 - deckH / 2;
	const lineGrow = kf(f, [296, 330], [0, 1], ease);

	// ============ E: write-on ============
	const pSize = tall ? 9.6 * u : 6.2 * u;
	const lines = tall ? s.promise : [s.promise.join(' ')];
	const writeA = 338;
	const writeB = 402;
	const perLine = (writeB - writeA) / lines.length;
	const promiseOut = kf(f, [408, 418], [0, 1], (x) => x * x);
	const lineH = pSize * 1.25;
	const blockTop = H / 2 - (lines.length * lineH) / 2;

	// ============ G: end ============
	const endIn = sp(f - 534, fps, { damping: 18, stiffness: 140, mass: 0.9 });
	const cursor = kf(f, [552, 572], [0, 1], easeOut);
	const press = kf(f, [574, 578, 586], [0, 1, 0], (x) => x);
	const ripple = kf(f, [576, 600], [0, 1], easeOut);

	return (
		<AbsoluteFill style={{ fontFamily: FONT, overflow: 'hidden' }}>
			<Ground f={f} />

			{/* A — question */}
			{f < 76 && (
				<AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: tall ? 0.6 * u : 0.4 * u }}>
					{qLines.map((line, li) => (
						<div key={li} style={{ display: 'flex', gap: '0.24em', ...T(qSize, 760) }}>
							{line.map((w) => {
								const k = wi++;
								const last = li === qLines.length - 1 && w === line[line.length - 1];
								return (
									<MaskWord key={w} f={f} at={k === 0 ? -14 : k * 7} out={qOut + k * 2} fps={fps} style={last ? accent : undefined}>
										{w}
									</MaskWord>
								);
							})}
						</div>
					))}
				</AbsoluteFill>
			)}

			{/* B + C — hours, then fly-through */}
			{f >= 64 && f < 212 && (
				<AbsoluteFill style={{ perspective: 1600, opacity: hoursIn }}>
					<AbsoluteFill
						style={{
							transform: `translate(${shake.x}px, ${shake.y}px) scale(${(1 + heavy * 0.12) * (1 + fly * fly * 5)})`,
							opacity: 1 - kf(f, [190, 208], [0, 1]),
							filter: fly > 0.05 ? `blur(${fly * 10}px)` : 'none',
						}}
					>
						{/* "+ 6 h" chips piling up in depth */}
						{STEPS.slice(1).map((st, i) => {
							const k = sp(f - st, fps, { damping: 13, stiffness: 200, mass: 0.6 });
							const ang = rnd(i + 3) * Math.PI * 2;
							const r = (tall ? 30 : 20) * u + rnd(i + 9) * (tall ? 10 : 9) * u;
							const x = W / 2 + Math.cos(ang) * r * (tall ? 0.85 : 1.35);
							const y = H / 2 + Math.sin(ang) * r * (tall ? 1.25 : 0.7);
							return (
								<div
									key={st}
									style={{
										position: 'absolute',
										left: x,
										top: y,
										transform: `translate(-50%, -50%) scale(${0.4 + 0.6 * k}) rotate(${(rnd(i) - 0.5) * 16}deg)`,
										opacity: k,
										padding: tall ? '22px 34px' : '16px 26px',
										...glass(0.72, 999),
										...T(tall ? 5.6 * u : 2.6 * u, 700, C.ink),
									}}
								>
									{s.plus}
								</div>
							);
						})}
						{/* odometer */}
						{!shatter && (
							<AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
								<Odometer v={v} size={numSize} weight={Math.round(520 + heavy * 380)} />
							</AbsoluteFill>
						)}
						<div style={{ position: 'absolute', left: 0, right: 0, top: H / 2 + numSize * 0.62, display: 'flex', justifyContent: 'center', opacity: kf(f, [84, 96], [0, 1]) }}>
							<span style={{ ...T(tall ? 4.6 * u : 2.3 * u, 560, C.ink2) }}>{s.hours}</span>
						</div>
					</AbsoluteFill>

					{/* shatter: the numerals break into glass shards as the camera passes through */}
					{shatter && (
						<AbsoluteFill style={{ transformStyle: 'preserve-3d' }}>
							{(() => {
								const bw = numSize * 2.6;
								const bh = numSize * 1.1;
								const cols = 7;
								const rows = 3;
								const cw = bw / cols;
								const ch = bh / rows;
								const ox = W / 2 - bw / 2;
								const oy = H / 2 - bh / 2;
								const p = kf(f, [178, 210], [0, 1], (x) => 1 - (1 - x) * (1 - x));
								return Array.from({ length: cols * rows * 2 }, (_, n) => {
									const c = Math.floor(n / 2) % cols;
									const r = Math.floor(n / 2 / cols);
									const tri = n % 2 ? 'polygon(100% 0, 100% 100%, 0 100%)' : 'polygon(0 0, 100% 0, 0 100%)';
									const cx = ox + c * cw;
									const cy = oy + r * ch;
									const dx = (c - cols / 2 + 0.5) / cols;
									const dy = (r - rows / 2 + 0.5) / rows;
									const z = 1 + p * (2.5 + rnd(n) * 4);
									return (
										<div
											key={n}
											style={{
												position: 'absolute',
												left: cx,
												top: cy,
												width: cw + 1,
												height: ch + 1,
												overflow: 'hidden',
												clipPath: tri,
												transform: `translate(${dx * p * W * 1.4 + (rnd(n + 5) - 0.5) * p * 200}px, ${dy * p * H * 1.4 + (rnd(n + 8) - 0.5) * p * 200}px) scale(${z}) rotate(${(rnd(n + 2) - 0.5) * p * 140}deg)`,
												opacity: 1 - kf(p, [0.55, 1], [0, 1], (x) => x),
												background: 'linear-gradient(135deg, rgba(255,255,255,0.55), rgba(255,255,255,0.12))',
												boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.7)',
											}}
										>
											<div style={{ position: 'absolute', left: -c * cw, top: -r * ch, width: bw, height: bh, display: 'grid', placeItems: 'center' }}>
												<Odometer v={60} size={numSize} weight={900} />
											</div>
										</div>
									);
								});
							})()}
						</AbsoluteFill>
					)}
				</AbsoluteFill>
			)}

			{/* D — timeline: camera locked on the racing cursor */}
			{f >= 184 && f < 336 && (
				<AbsoluteFill style={{ perspective: 1800, perspectiveOrigin: `${(phx / W) * 100}% 45%`, opacity: deckIn * deckOut }}>
					<div
						style={{
							position: 'absolute',
							left: -W * 0.3,
							top: deckTop,
							width: W * 1.6,
							height: deckH,
							transform: `rotateX(${tall ? 14 : 18}deg) rotateZ(-4deg) scale(${lerp(0.7, 1.08, deckIn) + (f - 200) * 0.0012})`,
							transformOrigin: `${phx + W * 0.3}px 50%`,
							...glass(0.58, 36),
							filter: blur > 0.2 ? `blur(${blur}px)` : 'none',
							overflow: 'hidden',
						}}
					>
						{/* ruler ticks scrolling */}
						<div style={{ position: 'absolute', left: 0, right: 0, top: 18, height: 26 }}>
							{Array.from({ length: 60 }, (_, i) => {
								const x = (((i * 80 - X) % 4800) + 4800) % 4800;
								return <span key={i} style={{ position: 'absolute', left: x, top: 0, width: 2, height: i % 5 ? 10 : 20, background: 'rgba(29,29,31,0.22)' }} />;
							})}
						</div>
						{TRACKS.map((clips, ti) => (
							<div key={ti} style={{ position: 'absolute', left: 0, right: 0, top: 60 + ti * (th + tg), height: th, background: 'rgba(29,29,31,0.035)', borderRadius: 16 }}>
								{clips
									.filter((c) => c.b - X + phx + W * 0.3 > -200 && c.a - X + phx + W * 0.3 < W * 1.8)
									.map((c, k) => {
										const sx = c.a - X + phx + W * 0.3;
										const ahead = c.a - X; // distance of clip start to the cursor
										const pop = ti === 2 || ti === 4 ? 1 : Math.min(1, Math.max(0, (900 - ahead) / 260));
										return (
											<div
												key={k}
												style={{
													position: 'absolute',
													left: sx,
													top: ti === 3 ? th * 0.22 : 0,
													width: c.b - c.a,
													height: ti === 3 ? th * 0.56 : th,
													borderRadius: ti === 3 ? 10 : 16,
													...clipStyle(ti, c),
													boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55)',
													opacity: pop,
													transform: `translateY(${(1 - pop) * -th * 0.8}px) scale(${0.85 + 0.15 * pop})`,
												}}
											>
												{ti === 2 && c.b - c.a > 300 && (
													<span style={{ position: 'absolute', left: 14, top: th / 2 - 12, ...T(tall ? 30 : 22, 650, 'rgba(255,255,255,0.95)') }}>{`${s.scene} ${(c.hue % 9) + 1}`}</span>
												)}
											</div>
										);
									})}
								{/* blade flashes where scene cuts pass the cursor */}
								{ti === 2 &&
									clips
										.filter((c) => Math.abs(c.a - X) < Math.max(40, vel * 1.5))
										.map((c, k) => (
											<span key={`b${k}`} style={{ position: 'absolute', left: c.a - X + phx + W * 0.3 - 3, top: -14, width: 6, height: th + 28, borderRadius: 3, background: '#fff', boxShadow: `0 0 24px 8px rgba(85,70,255,0.55)` }} />
										))}
							</div>
						))}
						{/* track labels, pinned */}
						{s.tracks.map((n, ti) => (
							<span key={n} style={{ position: 'absolute', left: W * 0.3 + (tall ? 30 : 40), top: 60 + ti * (th + tg) + th / 2 - 12, ...T(tall ? 26 : 19, 600, C.ink2), padding: '4px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.8)' }}>
								{n}
							</span>
						))}
						{/* cursor / playhead */}
						<div style={{ position: 'absolute', left: phx + W * 0.3 - 2, top: 8, width: 4, height: deckH - 16, background: C.iris, borderRadius: 2, boxShadow: '0 0 30px 6px rgba(85,70,255,0.45)' }}>
							<span style={{ position: 'absolute', left: -12, top: -2, width: 28, height: 28, borderRadius: 7, background: C.iris, transform: 'rotate(45deg)', boxShadow: '0 0 30px 10px rgba(85,70,255,0.5)' }} />
						</div>
					</div>
				</AbsoluteFill>
			)}

			{/* speed lines */}
			{f >= 230 && f < 336 && (
				<AbsoluteFill style={{ pointerEvents: 'none' }}>
					{Array.from({ length: 34 }, (_, i) => {
						const k = Math.min(1, Math.max(0, (vel - 40 - rnd(i) * 80) / 120));
						const len = (0.15 + rnd(i + 1) * 0.5) * W * (0.4 + k);
						const x = ((rnd(i + 2) * W * 2 - X * (0.6 + rnd(i + 3))) % (W + len) + (W + len)) % (W + len) - len;
						const y = (0.08 + rnd(i + 4) * 0.84) * H;
						return (
							<span
								key={i}
								style={{
									position: 'absolute',
									left: x,
									top: y,
									width: len,
									height: 2 + rnd(i + 6) * 3,
									borderRadius: 3,
									background: `linear-gradient(90deg, transparent, ${i % 3 ? 'rgba(255,255,255,0.95)' : 'rgba(85,70,255,0.8)'}, transparent)`,
									opacity: k * deckOut,
								}}
							/>
						);
					})}
				</AbsoluteFill>
			)}

			{/* the cursor turns into one light line … */}
			{f >= 296 && f < 346 && (
				<div
					style={{
						position: 'absolute',
						left: lerp(phx, 0, lineGrow),
						width: lerp(4, W, lineGrow) * (1 - kf(f, [332, 344], [0, 1], ease)),
						top: lerp(H * 0.45, blockTop + lineH * (lines.length - 1) + pSize * 1.12, kf(f, [318, 336], [0, 1], ease)) - 2,
						height: 4,
						borderRadius: 2,
						background: `linear-gradient(90deg, rgba(85,70,255,0), ${C.iris} 18%, #fff 50%, ${C.iris} 82%, rgba(85,70,255,0))`,
						boxShadow: '0 0 28px 6px rgba(85,70,255,0.5)',
						opacity: kf(f, [296, 304], [0, 1]),
					}}
				/>
			)}

			{/* E — … which writes the promise */}
			{f >= 334 && f < 420 && (
				<AbsoluteFill style={{ opacity: 1 - promiseOut, transform: `translateY(${-promiseOut * 40}px)` }}>
					{lines.map((line, li) => {
						const p = kf(f, [writeA + li * perLine, writeA + (li + 1) * perLine], [0, 1], (x) => x);
						const top = blockTop + li * lineH;
						return (
							<div key={li} style={{ position: 'absolute', left: 0, right: 0, top, height: lineH, display: 'flex', justifyContent: 'center' }}>
								<div style={{ position: 'relative' }}>
									{/* stroke outline drawing on */}
									<span style={{ ...T(pSize, 750, 'transparent'), WebkitTextStroke: `2px ${C.iris}`, clipPath: `inset(-20% ${(1 - p) * 100}% -20% -2%)`, display: 'block' }}>{line}</span>
									{/* fill follows the pen */}
									<span style={{ position: 'absolute', inset: 0, ...T(pSize, 750, C.ink), clipPath: `inset(-20% ${(1 - kf(p, [0.08, 1], [0, 1], (x) => x)) * 100}% -20% -2%)`, display: 'block' }}>{line}</span>
									{/* underline left behind by the pen */}
									<span style={{ position: 'absolute', left: 0, top: pSize * 1.1, height: 4, width: `${p * 100}%`, borderRadius: 2, background: `linear-gradient(90deg, ${C.irisSoft}, ${C.iris})`, opacity: li === lines.length - 1 ? 1 : 0.35 }} />
									{/* pen tip */}
									{p > 0 && p < 1 && (
										<span style={{ position: 'absolute', left: `calc(${p * 100}% - 9px)`, top: pSize * 1.1 - 7, width: 18, height: 18, borderRadius: 9, background: '#fff', boxShadow: `0 0 0 4px ${C.iris}, 0 0 34px 12px rgba(85,70,255,0.6)` }} />
									)}
								</div>
							</div>
						);
					})}
				</AbsoluteFill>
			)}

			{/* F — benefit beats */}
			{f >= 410 && f < 456 && (
				<AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: tall ? 3 * u : 1.6 * u }}>
					<div style={{ display: 'flex', flexDirection: tall ? 'column' : 'row', alignItems: 'center', gap: tall ? 0 : '0.26em', ...T(tall ? 11 * u : 6.6 * u, 760) }}>
						<MaskWord f={f} at={412} out={446} fps={fps}>
							{s.b1[0]}
						</MaskWord>
						<MaskWord f={f} at={417} out={447} fps={fps} style={accent}>
							{s.b1[1]}
						</MaskWord>
					</div>
					<div style={{ display: 'flex', gap: tall ? 1.6 * u : 1 * u, flexWrap: 'wrap', justifyContent: 'center' }}>
						{s.b1sub.map((w, i) => {
							const k = sp(f - 424 - i * 5, fps, { damping: 12, stiffness: 220, mass: 0.6 });
							const o = kf(f, [446 + i, 454 + i], [0, 1]);
							return (
								<span key={w} style={{ ...glass(0.8, 999), padding: tall ? '20px 36px' : '14px 28px', ...T(tall ? 5.4 * u : 2.6 * u, 650), transform: `scale(${0.5 + 0.5 * k}) translateY(${o * -30}px)`, opacity: k * (1 - o) }}>
									{w}
								</span>
							);
						})}
					</div>
				</AbsoluteFill>
			)}
			{f >= 452 && f < 496 && (
				<AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 0.6 * u }}>
					<div style={{ ...T(tall ? 10.4 * u : 6.6 * u, 760) }}>
						<MaskWord f={f} at={454} out={486} fps={fps}>
							{s.b2[0]}
						</MaskWord>
					</div>
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.3em', ...T(tall ? 10.4 * u : 6.6 * u, 760) }}>
						<MaskWord f={f} at={464} out={487} fps={fps} style={accent}>
							{s.b2[1]}
						</MaskWord>
						{(() => {
							const k = sp(f - 472, fps, { damping: 11, stiffness: 220, mass: 0.6 });
							const o = kf(f, [487, 494], [0, 1]);
							const d = tall ? 9 * u : 4.6 * u;
							return (
								<span style={{ width: d, height: d, borderRadius: d, background: C.green, display: 'grid', placeItems: 'center', transform: `scale(${k * (1 - o)})`, boxShadow: '0 14px 30px -8px rgba(31,168,79,0.6)' }}>
									<Check size={d * 0.56} />
								</span>
							);
						})()}
					</div>
				</AbsoluteFill>
			)}
			{f >= 492 && f < 540 && (
				<AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: tall ? 2.6 * u : 1.4 * u }}>
					{s.b3.map((w, i) => {
						const k = sp(f - 494 - i * 7, fps, { damping: 13, stiffness: 200, mass: 0.7 });
						const o = kf(f, [526 + i * 2, 536 + i * 2], [0, 1], (x) => x * x);
						const icons = ['M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z', 'M12 5v14M6 13l6 6 6-6', 'M12 3l2.6 5.6 6 .6-4.5 4 1.3 6L12 16.3 6.6 19.2l1.3-6-4.5-4 6-.6z'];
						const d = tall ? 8.6 * u : 4.4 * u;
						return (
							<div key={w} style={{ display: 'flex', alignItems: 'center', gap: tall ? 3 * u : 1.4 * u, ...glass(0.78, 999), padding: tall ? '22px 56px 22px 22px' : '14px 40px 14px 14px', transform: `translateX(${(1 - k) * (i % 2 ? 60 : -60)}px) scale(${0.85 + 0.15 * k}) translateY(${-o * 50}px)`, opacity: k * (1 - o) }}>
								<span style={{ width: d, height: d, borderRadius: d, display: 'grid', placeItems: 'center', background: `linear-gradient(180deg, #6d61ff, ${C.iris})` }}>
									<svg width={d * 0.55} height={d * 0.55} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
										<path d={icons[i]} />
									</svg>
								</span>
								<span style={{ ...T(tall ? 7.4 * u : 4.4 * u, 740) }}>{w}</span>
							</div>
						);
					})}
				</AbsoluteFill>
			)}

			{/* G — end card */}
			{f >= 532 && (
				<AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
					<div
						style={{
							position: 'relative',
							width: tall ? 88 * u : 64 * u,
							padding: tall ? `${8 * u}px ${6 * u}px` : `${4.4 * u}px ${4 * u}px`,
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							gap: tall ? 4 * u : 2.2 * u,
							textAlign: 'center',
							...glass(0.7, tall ? 64 : 48),
							opacity: endIn,
							transform: `translateY(${(1 - endIn) * 60}px) scale(${0.94 + 0.06 * endIn})`,
						}}
					>
						<span style={{ display: 'flex', alignItems: 'center', gap: 14, ...T(tall ? 4.4 * u : 1.9 * u, 650) }}>
							<svg width={tall ? 4.8 * u : 2.2 * u} height={tall ? 4.8 * u : 2.2 * u} viewBox="0 0 24 24">
								<rect x="2" y="5" width="12" height="6" rx="3" fill={C.iris} />
								<rect x="9" y="13" width="13" height="6" rx="3" fill={C.ink} />
								<rect x="15" y="2" width="2" height="20" rx="1" fill={C.iris} />
							</svg>
							Formatschnitt
						</span>
						<span style={{ ...T(tall ? 8.6 * u : 4 * u, 750), whiteSpace: 'normal', lineHeight: 1.05 }}>{s.end}</span>
						<div
							style={{
								position: 'relative',
								display: 'flex',
								alignItems: 'center',
								gap: 16,
								padding: tall ? '34px 60px' : '22px 42px',
								borderRadius: 999,
								background: `linear-gradient(180deg, #6d61ff, ${C.iris})`,
								boxShadow: `inset 0 1px 0 rgba(255,255,255,0.45), 0 18px 40px -12px rgba(85,70,255,${0.55 + 0.3 * press})`,
								transform: `scale(${1 - press * 0.05})`,
								...T(tall ? 5 * u : 2.1 * u, 620, '#fff'),
							}}
						>
							{s.cta} <span style={{ fontWeight: 400 }}>→</span>
							{ripple > 0 && (
								<span style={{ position: 'absolute', inset: 0, borderRadius: 999, boxShadow: `0 0 0 ${ripple * 40}px rgba(85,70,255,${0.3 * (1 - ripple)})` }} />
							)}
						</div>
					</div>
					<svg
						width={tall ? 70 : 44}
						height={tall ? 70 : 44}
						viewBox="0 0 24 24"
						style={{
							position: 'absolute',
							left: lerp(W * 0.8, W / 2 + (tall ? 16 * u : 7 * u), cursor),
							top: lerp(H * 0.95, H / 2 + (tall ? 16.5 * u : 5.6 * u), cursor),
							opacity: kf(f, [550, 556], [0, 1]),
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
