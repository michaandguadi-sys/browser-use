// Page motion, loaded lazily after first paint (never under prefers-reduced-motion): magnetic CTAs and
// glass tilt + specular on hover-capable devices. Content never depends on it — everything is visible without it.
import { gsap } from 'gsap';

export function init() {
	if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;

	// 1) Magnetic CTAs.
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

	// 2) Glass cards: pointer tilt + a specular highlight that follows the cursor.
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
