// Scroll story — DOM chapters scrubbed by native scroll (GSAP ScrollTrigger on a CSS-sticky stage: no pin-spacer,
// no scroll hijacking), kinetic type via SplitText, plus the live three.js background loaded right after first paint.
// Only runs when <html data-story="live"> (set inline in Story.astro).
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { CH, type StoryState } from './story-ch';

export function initStory() {
	const root = document.querySelector<HTMLElement>('[data-story-root]');
	if (!root) return;
	gsap.registerPlugin(ScrollTrigger, SplitText);
	const $ = <T extends Element = HTMLElement>(s: string) => root.querySelector<T>(s)!;
	const $$ = <T extends Element = HTMLElement>(s: string) => [...root.querySelectorAll<T>(s)];

	const state: StoryState = { p: 0, px: 0, py: 0, lite: false, odo: () => $('[data-odo]').getBoundingClientRect() };

	// odometer: two digit strips, positioned in em so it scales with the type
	const tens = $('[data-tens]');
	const tensStrip = tens.firstElementChild as HTMLElement;
	const unitStrip = $('[data-units]').firstElementChild as HTMLElement;
	const counter = { v: 6 };
	// digits rest on whole numbers and roll over in the last 35 % of each step (no half-digits when scrolling stops)
	const roll = (v: number) => {
		const i = Math.floor(v);
		const f = Math.min(1, Math.max(0, (v - i - 0.65) / 0.35));
		return i + f * f * (3 - 2 * f);
	};
	const renderOdo = () => {
		const v = roll(counter.v);
		unitStrip.style.transform = `translateY(${-v}em)`;
		const t = Math.floor(v / 10) + Math.min(1, Math.max(0, (v % 10) - 9));
		tensStrip.style.transform = `translateY(${-t}em)`;
		tens.classList.toggle('on', v >= 9.5);
	};
	renderOdo();

	const lite = document.documentElement.hasAttribute('data-story-lite');
	state.lite = lite;
	const frags = $$('[data-frag]');
	const spl = $$('[data-spl]');
	const odoParts = [...$('[data-odo]').children].filter((c) => !c.hasAttribute('data-frags'));
	const amb = $<HTMLVideoElement>('[data-amb]');
	const tun = $<HTMLVideoElement>('[data-tunnel]');
	const tall = matchMedia('(max-width: 719px)').matches;
	const TUN = [CH.hoursOut, CH.tl[0] + 0.01] as const; // tunnel chapter (scroll progress)
	let tunRaf = 0;
	let lastSeek = 0;
	let stageVisible = true;
	let ambReady = false;
	gsap.set(amb, { opacity: lite ? 0 : 0.5 });

	const end = $('[data-end]');
	const h1 = $('[data-h1]');
	const endRest = [...end.children].filter((c) => c !== h1) as HTMLElement[];
	const h1Label = h1.innerText.replace(/\s+/g, ' ').trim();
	const split = SplitText.create(h1, { type: 'words', mask: 'words' });
	h1.setAttribute('aria-label', h1Label); // keep the space at the line break for screen readers
	split.masks.forEach((m) => Object.assign((m as HTMLElement).style, { paddingBottom: '0.12em', marginBottom: '-0.12em' }));
	// the end card is driven by one progress value (k), so scrubbing back and forth always lands on the same frame
	const words = split.words as HTMLElement[];
	const endK = { k: 0 };
	const out3 = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
	const renderEnd = () => {
		const k = endK.k;
		const st = 0.1;
		words.forEach((w, i) => {
			const e = out3((k - i * st) / (0.62 - st));
			w.style.transform = `translate3d(0, ${(1 - e) * 115}%, 0) rotate(${(1 - e) * 3}deg)`;
			if (!lite) w.style.filter = e > 0.995 ? '' : `blur(${((1 - e) * 8).toFixed(2)}px)`; // filmic, not slide-deck
		});
		endRest.forEach((el, j) => {
			const e = out3((k - 0.42 - j * 0.07) / 0.3);
			el.style.opacity = String(e);
			el.style.transform = `translate3d(0, ${(1 - e) * 26}px, 0)`;
		});
	};
	renderEnd();

	const mm = gsap.matchMedia();
	mm.add({ wide: '(min-width: 720px)', tall: '(max-width: 719px)' }, (ctx) => {
		const wide = !!ctx.conditions?.wide;
		const svg = $<SVGSVGElement>(wide ? '[data-write="wide"]' : '[data-write="tall"]');
		const strokes = [...svg.querySelectorAll('[data-stroke]')];
		const fills = [...svg.querySelectorAll<SVGTextElement>('.sw-fill')];
		const reveal = svg.querySelector('[data-reveal]')!;
		const under = svg.querySelector('[data-under]')!;
		const pen = $('[data-pen]');
		const write = $('.s-write');

		// text extents in viewBox units (re-measured once the web font is in)
		const box = () => {
			const bs = fills.map((t) => t.getBBox());
			return { x0: Math.min(...bs.map((b) => b.x)), x1: Math.max(...bs.map((b) => b.x + b.width)) };
		};
		let ext = box();
		gsap.set(reveal, { attr: { x: ext.x0, width: 0 } });
		gsap.set(under, { attr: { x: ext.x0, width: 0 } });
		const vb = svg.viewBox.baseVal;
		const placePen = (k: number) => {
			const r = svg.getBoundingClientRect();
			const w = write.getBoundingClientRect();
			const x = (ext.x0 + (ext.x1 - ext.x0) * k) * (r.width / vb.width) + (r.left - w.left);
			const y = Number(under.getAttribute('y')) * (r.height / vb.height) + (r.top - w.top);
			gsap.set(pen, { x, y });
		};
		const pw = { k: 0 };
		const W = CH.write[1] - CH.write[0];
		// where the H1 sits relative to the stage centre → the promise travels there as it hands over
		const toH1 = () => {
			const a = h1.getBoundingClientRect();
			const s = root.firstElementChild!.getBoundingClientRect();
			return a.top + a.height / 2 - (s.top + s.height / 2);
		};

		const tl = gsap.timeline({
			defaults: { ease: 'none' },
			scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: 0.8, invalidateOnRefresh: true },
			onUpdate: () => {
				state.p = tl.progress();
				footage();
			},
		});
		tl.to('[data-hint]', { autoAlpha: 0, duration: 0.03 }, 0)
			// a → b: the question leaves, the hours arrive and roll up
			.to($$('[data-q] .wo'), { yPercent: -118, rotate: -3, ...(lite ? {} : { filter: 'blur(6px)' }), duration: 0.05, stagger: 0.008, ease: 'power2.in' }, CH.qOut)
			// footage: the glass macro fades with the question …
			.to(amb, { opacity: 0, duration: 0.05 }, CH.qOut)
			// … the tunnel carries the fly-through (c) and zooms out into the 3D timeline
			.to(tun, { opacity: lite ? 0.9 : 0.85, duration: 0.025 }, CH.hoursOut - 0.01)
			.fromTo(tun, { scale: 1.05 }, { scale: 1.25, duration: TUN[1] - CH.hoursOut, ease: 'none' }, CH.hoursOut)
			.to(tun, { opacity: 0, scale: 1.45, duration: 0.035, ease: 'power1.in' }, TUN[1] - 0.025)
			// … and the glass comes back softly behind the H1 (f)
			.to(amb, { opacity: 0.42, duration: 0.05 }, CH.settle - 0.02)
			.to('[data-hours]', { opacity: 1, duration: 0.03 }, CH.hoursIn)
			.fromTo('[data-odo]', { scale: 0.82 }, { scale: 1, duration: 0.06, ease: 'power2.out' }, CH.hoursIn)
			.to(counter, { v: 60, duration: CH.count[1] - CH.count[0], ease: 'power1.in', onUpdate: renderOdo }, CH.count[0])
			.fromTo('[data-odo]', { fontWeight: 520 }, { fontWeight: 900, duration: CH.count[1] - CH.count[0] }, CH.count[0]);
		$$('[data-chip]').forEach((c, i) => tl.to(c, { scale: 1, duration: 0.018, ease: 'back.out(2.2)' }, CH.count[0] + 0.02 + i * 0.021));
		if (lite) {
			// c (phones): the counter itself breaks — pre-cut DOM fragments, transform/opacity only, no WebGL hand-over
			const S = CH.hoursOut;
			const D = CH.tl[0] - 0.03 - S; // burst length in scroll progress
			tl.to(['.s-chips', '.s-cap'], { opacity: 0, duration: 0.012 }, S)
				.set(odoParts, { visibility: 'hidden' }, S)
				.set([...frags, ...spl], { visibility: 'visible', opacity: 1 }, S);
			frags.forEach((f) => {
				const cx = Number(f.dataset.cx) - 50;
				const cy = Number(f.dataset.cy) - 50;
				const k = Number(f.dataset.d);
				tl.to(f, { xPercent: cx * 1.6 * k, yPercent: cy * 2.6 * k, rotation: Number(f.dataset.r), scale: Number(f.dataset.s), duration: D, ease: 'power2.out' }, S).to(f, { opacity: 0, duration: D * 0.45, ease: 'power1.in' }, S + D * 0.5);
			});
			spl.forEach((x) => {
				const a = (Number(x.dataset.a) * Math.PI) / 180;
				const k = Number(x.dataset.d);
				tl.to(x, { x: () => Math.cos(a) * innerWidth * 0.55 * k, y: () => Math.sin(a) * innerHeight * 0.4 * k, rotation: Number(x.dataset.r), scale: 1.8, duration: D, ease: 'power2.out' }, S).to(x, { opacity: 0, duration: D * 0.4 }, S + D * 0.6);
			});
			tl.to('[data-hours]', { opacity: 0, duration: 0.01 }, S + D);
		} else {
			// c (desktop): the DOM numerals hand over to their WebGL twin, which shatters
			tl.to('[data-hours]', { opacity: 0, duration: 0.012 }, CH.hoursOut);
		}
		tl
			// d → e: the playhead becomes one light line, the line becomes a pen
			.to('.story-veil', { opacity: 0.94, duration: 0.05 }, CH.line + 0.01)
			.fromTo('[data-line]', { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 0.05, ease: 'power2.out' }, CH.line)
			.to('[data-line]', { scaleX: 0, transformOrigin: '8% 50%', duration: 0.025, ease: 'power2.in' }, CH.write[0] - 0.012)
			.to(write, { opacity: 1, duration: 0.005 }, CH.write[0])
			.to(pen, { opacity: 1, duration: 0.005 }, CH.write[0])
			.to(strokes, { strokeDashoffset: 0, duration: W }, CH.write[0])
			.to(reveal, { attr: { width: () => ext.x1 - ext.x0 + 6 }, duration: W }, CH.write[0] + 0.006)
			.to(under, { attr: { width: () => ext.x1 - ext.x0 }, duration: W }, CH.write[0])
			.to(pw, { k: 1, duration: W, onUpdate: () => placePen(pw.k) }, CH.write[0])
			.to(pen, { opacity: 0, duration: 0.01 }, CH.write[1])
			// f: the promise settles into the H1, the CTA arrives, the glass comes back behind
			.to('.story-veil', { opacity: 0.58, duration: 0.045 }, CH.settle - 0.025)
			// the promise rises towards the H1 and dissolves just before the H1 words come up through their masks
			.to(write, { y: toH1, scale: wide ? 0.62 : 0.72, duration: 0.035, ease: 'power2.in' }, CH.settle)
			.to(write, { opacity: 0, filter: 'blur(8px)', duration: 0.018, ease: 'power1.in' }, CH.settle + 0.004)
			.set(end, { opacity: 1 }, CH.settle + 0.02)
			.to(endK, { k: 1, duration: 0.05, onUpdate: renderEnd }, CH.settle + 0.02)
			.to({}, { duration: 0.01 }, 0.99);

		document.fonts?.ready.then(() => {
			ext = box();
			gsap.set(reveal, { attr: { x: ext.x0 } });
			gsap.set(under, { attr: { x: ext.x0 } });
			ScrollTrigger.refresh();
		});
		return () => tl.kill();
	});

	// keyboard: tabbing into the hero CTA jumps to the end of the story, where it is visible
	end.addEventListener('focusin', () => {
		if (state.p > 0.97) return;
		scrollTo({ top: root.offsetTop + root.offsetHeight - innerHeight, behavior: 'instant' });
	});

	// cursor: a little parallax on the words (not on [data-q] itself, whose centring uses the CSS translate property);
	// the 3D scene follows the cursor too
	const qx = gsap.quickTo($$('[data-q] .wm'), 'x', { duration: 0.8, ease: 'power3.out' });
	const qy = gsap.quickTo($$('[data-q] .wm'), 'y', { duration: 0.8, ease: 'power3.out' });
	addEventListener(
		'pointermove',
		(e) => {
			if (e.pointerType !== 'mouse') return;
			state.px = (e.clientX / innerWidth - 0.5) * 2;
			state.py = (e.clientY / innerHeight - 0.5) * 2;
			qx(state.px * -10);
			qy(state.py * -6);
		},
		{ passive: true },
	);

	// ---------- generated footage ----------
	// tunnel: scrubbed by scroll in chapter c. Sources are attached on the first scroll (poster-free until then),
	// phones get the 9:16 cut. Seeks are rAF-throttled and only issued when the target moved by more than a frame.
	function footage() {
		const p = state.p;
		const inTun = p > CH.hoursOut - 0.04 && p < TUN[1] + 0.03;
		if (inTun && !tunRaf) tunRaf = requestAnimationFrame(scrub);
		const wantAmb = !lite && stageVisible && (p < CH.qOut + 0.06 || p > CH.settle - 0.03);
		if (wantAmb && amb.paused && ambReady) amb.play().catch(() => {});
		else if (!wantAmb && !amb.paused) amb.pause();
	}
	function scrub() {
		tunRaf = 0;
		const p = state.p;
		if (!(p > CH.hoursOut - 0.04 && p < TUN[1] + 0.03)) return;
		const now = performance.now();
		// phones: at most ~12 seeks/s and only for ≥ 2 frames of change (the footage is motion-blurred anyway)
		if (tun.readyState >= 2 && !tun.seeking && tun.duration && now - lastSeek >= (lite ? 80 : 0)) {
			const k = Math.min(1, Math.max(0, (p - (CH.hoursOut - 0.01)) / (TUN[1] - CH.hoursOut + 0.01)));
			const target = 0.05 + k * (tun.duration - 0.15);
			if (Math.abs(tun.currentTime - target) > (lite ? 2 : 1) / 24) {
				tun.currentTime = target;
				lastSeek = now;
			}
		}
		tunRaf = requestAnimationFrame(scrub);
	}
	let tunLoaded = false;
	const tunnelOn = !(lite && root.dataset.tunnelPhones === 'false');
	if (!tunnelOn) tun.remove();
	const loadTunnel = () => {
		if (tunLoaded || !tunnelOn) return;
		tunLoaded = true;
		const src = tall
			? [['/media/bg/tunnel-tall.mp4', 'video/mp4']]
			: [
					['/media/bg/tunnel-wide.webm', 'video/webm'],
					['/media/bg/tunnel-wide.mp4', 'video/mp4'],
				];
		tun.poster = tall ? '/media/bg/tunnel-tall.jpg' : '/media/bg/tunnel-wide.jpg';
		for (const [u, t] of src) tun.append(Object.assign(document.createElement('source'), { src: u, type: t }));
		tun.preload = 'auto';
		tun.load();
		// iOS paints seeked frames only after the element has played once; elsewhere a first seek is enough to have
		// the decoder warm and the first frame on its layer before chapter c needs it
		const iOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
		tun.addEventListener(
			'loadeddata',
			() => {
				if (iOS) tun.play().then(() => tun.pause()).catch(() => {});
				else tun.currentTime = 0.05;
			},
			{ once: true },
		);
	};
	addEventListener('scroll', loadTunnel, { once: true, passive: true });
	if (scrollY > 0) loadTunnel();
	// ambient glass (desktop): attached after the page has loaded, plays only in chapters a and f while on screen
	const loadAmbient = () => {
		if (lite || root.dataset.ambient === 'false') return;
		amb.append(Object.assign(document.createElement('source'), { src: '/media/bg/glass-ambient.mp4', type: 'video/mp4' }));
		amb.preload = 'auto';
		amb.load();
		amb.addEventListener('canplay', () => ((ambReady = true), footage()), { once: true });
	};
	new IntersectionObserver(([e]) => {
		stageVisible = e.isIntersecting;
		footage();
	}).observe(root);

	// the living background: three.js right after first paint (never blocks the headline)
	const canvas = $<HTMLCanvasElement>('.story-canvas');
	const go = () =>
		import('./story-scene')
			.then((m) => m.mount(canvas, state))
			.catch(() => {});
	const afterPaint = () =>
		requestAnimationFrame(() =>
			setTimeout(() => {
				go();
				setTimeout(loadAmbient, 400);
			}, 0),
		);
	if (document.readyState === 'complete') afterPaint();
	else addEventListener('load', afterPaint, { once: true });
}
