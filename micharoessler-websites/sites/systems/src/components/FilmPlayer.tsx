// Hero film island: Remotion Player + glass controls.
// Autoplays once on load (silent), draggable + keyboard scrubber, play/pause, replay.
// prefers-reduced-motion: no autoplay, starts on the final frame with a play button.
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
		const onFrame = (e: { detail: { frame: number } }) => {
			setFrame(e.detail.frame);
			setPlaying(p.isPlaying());
		};
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

	// Autoplay once, straight away: the film is the first thing on the page (Player `autoPlay`, silent).
	// Safety net: if the browser held it back, start it as soon as the player has mounted.
	useEffect(() => {
		if (reduce) return;
		const id = window.setTimeout(() => {
			const p = player.current;
			if (p && !p.isPlaying() && p.getCurrentFrame() === 0) p.play();
		}, 400);
		return () => window.clearTimeout(id);
	}, [reduce, tall]);

	const toggle = useCallback(() => {
		const p = player.current;
		if (!p) return;
		if (p.isPlaying()) p.pause();
		else {
			if (p.getCurrentFrame() >= LAST) p.seekTo(0);
			p.play();
		}
	}, []);
	const replay = useCallback(() => {
		player.current?.seekTo(0);
		player.current?.play();
	}, []);
	const onScrub = (v: number) => {
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
					autoPlay={!reduce}
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
