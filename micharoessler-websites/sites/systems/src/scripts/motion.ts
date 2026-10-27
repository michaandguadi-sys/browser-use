// Page motion, loaded lazily after first paint (never under prefers-reduced-motion).
// GSAP: split-word mask reveals for headings, counters, magnetic CTAs, glass tilt + specular, film scale-out.
// Native scroll stays native — no smooth-scroll library, no pinning of content.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

export function init() {
	gsap.registerPlugin(ScrollTrigger, SplitText);
	const lang = document.documentElement.lang.startsWith('de') ? 'de-DE' : 'en-GB';

	// 1) Kinetic headings: words slide up from behind a mask (same language as the film).
	document.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
		const inView = el.getBoundingClientRect().top < innerHeight;
		SplitText.create(el, {
			type: 'words',
			mask: 'words',
			autoSplit: true,
			onSplit(self) {
				self.masks.forEach((m) => Object.assign((m as HTMLElement).style, { paddingBottom: '0.14em', marginBottom: '-0.14em' }));
				if (inView) return; // already on screen at load: don't hide it again
				return gsap.from(self.words, {
					yPercent: 118,
					rotate: 4,
					duration: 0.9,
					ease: 'expo.out',
					stagger: 0.055,
					scrollTrigger: { trigger: el, start: 'top 90%', once: true },
				});
			},
		});
	});

	// 2) Counters for the benefit figures (real offer facts, not measurements).
	document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
		const to = Number(el.dataset.count);
		const nf = new Intl.NumberFormat(lang, { maximumFractionDigits: 0 });
		const o = { v: 0 };
		gsap.to(o, {
			v: to,
			duration: to > 10 ? 1.6 : 0.9,
			ease: 'power3.out',
			scrollTrigger: { trigger: el, start: 'top 92%', once: true },
			onStart: () => {
				o.v = 0;
				el.setAttribute('aria-hidden', 'true');
			},
			onUpdate: () => (el.textContent = nf.format(Math.round(o.v))),
			onComplete: () => el.removeAttribute('aria-hidden'),
		});
	});

	// 3) Film eases back as you scroll on (scroll-linked, transform only → no layout shift).
	const film = document.querySelector<HTMLElement>('[data-film]');
	if (film)
		gsap.to(film, {
			scale: 0.94,
			yPercent: -4,
			ease: 'none',
			scrollTrigger: { trigger: film, start: 'top top', end: 'bottom top', scrub: true },
		});

	if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;

	// 4) Magnetic CTAs.
	document.querySelectorAll<HTMLElement>('[data-magnetic], .btn--primary').forEach((el) => {
		const x = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
		const y = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
		el.addEventListener('pointermove', (e) => {
			const r = el.getBoundingClientRect();
			x((e.clientX - r.left - r.width / 2) * 0.28);
			y((e.clientY - r.top - r.height / 2) * 0.4);
		});
		el.addEventListener('pointerleave', () => {
			x(0);
			y(0);
		});
	});

	// 5) Glass cards: pointer tilt + a specular highlight that follows the cursor.
	document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((el) => {
		el.addEventListener('pointermove', (e) => {
			const r = el.getBoundingClientRect();
			const px = (e.clientX - r.left) / r.width;
			const py = (e.clientY - r.top) / r.height;
			el.classList.add('is-tilting');
			el.style.setProperty('--ry', `${(px - 0.5) * 7}deg`);
			el.style.setProperty('--rx', `${(0.5 - py) * 7}deg`);
			el.style.setProperty('--sx', `${px * 100}%`);
			el.style.setProperty('--sy', `${py * 100}%`);
			el.style.setProperty('--so', '1');
		});
		el.addEventListener('pointerleave', () => {
			el.classList.remove('is-tilting');
			el.style.setProperty('--rx', '0deg');
			el.style.setProperty('--ry', '0deg');
			el.style.setProperty('--so', '0');
		});
	});
}
