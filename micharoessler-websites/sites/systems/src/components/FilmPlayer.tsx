// Hero film island: Remotion Player + glass controls.
// Autoplays once in view (silent), scroll-scrubs inside the sticky stage, draggable scrubber, replay.
// prefers-reduced-motion: no autoplay, no scroll-scrub, starts on the final frame with a play button.
import { Player, type PlayerRef } from '@remotion/player';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EditFilm } from '../remotion/EditFilm';
import { DURATION, FPS, TALL, WIDE } from '../remotion/theme';

type Labels = { play: string; pause: string; replay: string; position: string; of: string };
type Props = { lang: 'de' | 'en'; labels: Labels };

const LAST = DURATION - 1;
const mq = (q: string) => typeof window !== 'undefined' && window.matchMedia(q).matches;
const fmt = (f: number) => `0:${String(Math.floor(f / FPS)).padStart(2, '0')}`;

export default function FilmPlayer({ lang, labels }: Props) {
	const player = useRef<PlayerRef>(null);
	const root = useRef<HTMLDivElement>(null);
	const [tall, setTall] = useState(() => mq('(max-width: 719px)'));
	const reduce = useMemo(() => mq('(prefers-reduced-motion: reduce)'), []);
	const [frame, setFrame] = useState(reduce ? LAST : 0);
	const [playing, setPlaying] = useState(false);
	const scrub = useRef<{ on: boolean; f0: number; p0: number; lastP: number }>({ on: false, f0: 0, p0: 0, lastP: -1 });
	const autoplayed = useRef(false);

	useEffect(() => {
		const m = window.matchMedia('(max-width: 719px)');
		const on = () => setTall(m.matches);
		m.addEventListener('change', on);
		return () => m.removeEventListener('change', on);
	}, []);

	// Player events → React state
	useEffect(() => {
		const p = player.current;
		if (!p) return;
		const onFrame = (e: { detail: { frame: number } }) => setFrame(e.detail.frame);
		const onPlay = () => setPlaying(true);
		const onPause = () => setPlaying(false);
		p.addEventListener('frameupdate', onFrame);
		p.addEventListener('play', onPlay);
		p.addEventListener('pause', onPause);
		p.addEventListener('ended', onPause);
		root.current?.closest('[data-film]')?.classList.add('is-live');
		return () => {
			p.removeEventListener('frameupdate', onFrame);
			p.removeEventListener('play', onPlay);
			p.removeEventListener('pause', onPause);
			p.removeEventListener('ended', onPause);
		};
	}, [tall]);

	// Autoplay once, when at least half of the film is visible.
	useEffect(() => {
		if (reduce || !root.current) return;
		const io = new IntersectionObserver(
			([e]) => {
				if (e.isIntersecting && !autoplayed.current && !scrub.current.on) {
					autoplayed.current = true;
					player.current?.play();
				}
			},
			{ threshold: 0.5 },
		);
		io.observe(root.current);
		return () => io.disconnect();
	}, [reduce]);

	// Scroll-scrub inside the sticky stage. Anchored at the frame where scrolling starts, so it never jumps.
	useEffect(() => {
		if (reduce) return;
		const stage = root.current?.closest<HTMLElement>('[data-stage]');
		if (!stage) return;
		let raf = 0;
		const tick = () => {
			raf = 0;
			const r = stage.getBoundingClientRect();
			const span = stage.offsetHeight - window.innerHeight;
			if (span <= 0) return;
			const p = Math.min(1, Math.max(0, -r.top / span));
			const s = scrub.current;
			if (Math.abs(p - s.lastP) < 0.0005) return;
			const first = s.lastP < 0;
			s.lastP = p;
			if (first) return;
			if (!s.on) {
				if (p <= 0 || p >= 1) return;
				const cur = player.current?.getCurrentFrame() ?? 0;
				s.on = true;
				s.f0 = cur;
				s.p0 = p;
				player.current?.pause();
			}
			const target = p >= s.p0 ? s.f0 + ((p - s.p0) / Math.max(0.0001, 1 - s.p0)) * (LAST - s.f0) : s.f0 * (p / Math.max(0.0001, s.p0));
			player.current?.seekTo(Math.round(target));
			setFrame(Math.round(target));
		};
		const onScroll = () => {
			if (!raf) raf = requestAnimationFrame(tick);
		};
		window.addEventListener('scroll', onScroll, { passive: true });
		tick();
		return () => {
			window.removeEventListener('scroll', onScroll);
			cancelAnimationFrame(raf);
		};
	}, [reduce]);

	const release = () => {
		scrub.current.on = false;
	};
	const toggle = useCallback(() => {
		const p = player.current;
		if (!p) return;
		release();
		if (p.isPlaying()) p.pause();
		else {
			if (p.getCurrentFrame() >= LAST) p.seekTo(0);
			p.play();
		}
	}, []);
	const replay = useCallback(() => {
		release();
		player.current?.seekTo(0);
		player.current?.play();
	}, []);
	const onScrub = (v: number) => {
		release();
		player.current?.pause();
		player.current?.seekTo(v);
		setFrame(v);
	};

	const size = tall ? TALL : WIDE;
	return (
		<div ref={root} className="fp">
			<div className="fp-screen" aria-hidden="true" style={{ aspectRatio: `${size.width} / ${size.height}` }}>
				<Player
					key={tall ? 'tall' : 'wide'}
					ref={player}
					component={EditFilm}
					inputProps={{ lang }}
					durationInFrames={DURATION}
					fps={FPS}
					compositionWidth={size.width}
					compositionHeight={size.height}
					initialFrame={reduce ? LAST : 0}
					acknowledgeRemotionLicense
					clickToPlay={false}
					doubleClickToFullscreen={false}
					spaceKeyToPlayOrPause={false}
					style={{ width: '100%', height: '100%' }}
				/>
			</div>
			<div className="fp-bar" role="group" aria-label={labels.position}>
				<button type="button" className="fp-btn" onClick={toggle} aria-label={playing ? labels.pause : labels.play}>
					{playing ? (
						<svg viewBox="0 0 24 24" aria-hidden="true">
							<rect x="6" y="5" width="4" height="14" rx="1.2" />
							<rect x="14" y="5" width="4" height="14" rx="1.2" />
						</svg>
					) : (
						<svg viewBox="0 0 24 24" aria-hidden="true">
							<path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
						</svg>
					)}
				</button>
				<input
					className="fp-range"
					type="range"
					min={0}
					max={LAST}
					step={1}
					value={frame}
					aria-label={labels.position}
					aria-valuetext={`${fmt(frame)} ${labels.of} ${fmt(DURATION)}`}
					style={{ ['--p' as string]: `${(frame / LAST) * 100}%` }}
					onChange={(e) => onScrub(Number(e.currentTarget.value))}
				/>
				<span className="fp-time" aria-hidden="true">
					{fmt(frame)} / {fmt(DURATION)}
				</span>
				<button type="button" className="fp-btn" onClick={replay} aria-label={labels.replay}>
					<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
						<path d="M4 12a8 8 0 1 0 2.4-5.7" />
						<path d="M4 4v4h4" />
					</svg>
				</button>
			</div>
		</div>
	);
}
