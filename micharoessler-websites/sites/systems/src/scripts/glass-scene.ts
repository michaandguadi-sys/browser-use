// One real-time WebGL glass moment: stacked refractive glass panes ("your format as a system"),
// with footage-coloured clips sliding through behind them and an iris playhead crossing all layers.
// Reacts to pointer + scroll, renders only while visible, DPR capped at 1.5. Loaded lazily by GlassSystem.astro.
import {
	BoxGeometry,
	CanvasTexture,
	Color,
	Group,
	Mesh,
	MeshBasicMaterial,
	MeshPhysicalMaterial,
	NeutralToneMapping,
	PerspectiveCamera,
	PlaneGeometry,
	PMREMGenerator,
	Scene,
	SRGBColorSpace,
	WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const backdrop = () => {
	const c = document.createElement('canvas');
	c.width = c.height = 512;
	const g = c.getContext('2d')!;
	g.fillStyle = '#eef0f5';
	g.fillRect(0, 0, 512, 512);
	const blob = (x: number, y: number, r: number, col: string) => {
		const gr = g.createRadialGradient(x, y, 0, x, y, r);
		gr.addColorStop(0, col);
		gr.addColorStop(1, 'rgba(238,240,245,0)');
		g.fillStyle = gr;
		g.fillRect(0, 0, 512, 512);
	};
	blob(140, 150, 280, 'rgba(85,70,255,0.6)');
	blob(400, 180, 260, 'rgba(255,150,100,0.65)');
	blob(300, 430, 280, 'rgba(80,210,190,0.6)');
	const t = new CanvasTexture(c);
	t.colorSpace = SRGBColorSpace;
	return t;
};

export function mount(host: HTMLElement) {
	const canvas = host.querySelector('canvas')!;
	const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: true });
	renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
	renderer.toneMapping = NeutralToneMapping;
	renderer.outputColorSpace = SRGBColorSpace;
	renderer.setClearColor(new Color('#eef0f5'));

	const scene = new Scene();
	const pmrem = new PMREMGenerator(renderer);
	scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

	const camera = new PerspectiveCamera(30, 1, 0.1, 100);
	camera.position.set(0, 0.2, 10);

	const bg = new Mesh(new PlaneGeometry(22, 14), new MeshBasicMaterial({ map: backdrop() }));
	bg.position.z = -4;
	scene.add(bg);

	// footage clips behind the glass
	const clipCols = ['#ff8a7a', '#5546ff', '#2bb3a3', '#ff9f5c', '#8b80ff', '#d36bff'];
	const clips: Mesh[] = [];
	for (let i = 0; i < 12; i++) {
		const m = new Mesh(new RoundedBoxGeometry(1.1 + (i % 3) * 0.5, 0.36, 0.08, 3, 0.07), new MeshBasicMaterial({ color: clipCols[i % clipCols.length] }));
		m.position.set(-7 + i * 1.3, -1.1 + (i % 4) * 0.62, -1.6);
		m.userData.speed = 0.6 + (i % 4) * 0.18;
		clips.push(m);
		scene.add(m);
	}

	// the system: stacked glass panes + a playhead through all layers
	const sys = new Group();
	scene.add(sys);
	const glass = new MeshPhysicalMaterial({
		color: '#ffffff',
		transmission: 1,
		roughness: 0.06,
		thickness: 0.55,
		ior: 1.48,
		clearcoat: 1,
		clearcoatRoughness: 0.08,
		iridescence: 0.35,
		iridescenceIOR: 1.3,
		attenuationColor: new Color('#cfc8ff'),
		attenuationDistance: 2.4,
		specularIntensity: 1,
		envMapIntensity: 1.2,
	});
	const panes: Mesh[] = [];
	for (let i = 0; i < 4; i++) {
		const p = new Mesh(new RoundedBoxGeometry(3.4, 2.2, 0.14, 6, 0.16), glass);
		p.position.set(i * 0.16, i * 0.12, i * 0.5);
		panes.push(p);
		sys.add(p);
	}
	const playhead = new Mesh(new BoxGeometry(0.05, 2.9, 0.05), new MeshBasicMaterial({ color: '#5546ff' }));
	playhead.position.set(0.2, 0.2, 0.9);
	sys.add(playhead);
	sys.rotation.set(-0.12, -0.42, 0.04);

	// sizing
	const resize = () => {
		const w = host.clientWidth;
		const h = host.clientHeight;
		renderer.setSize(w, h, false);
		camera.aspect = w / h;
		camera.position.z = w / h < 1 ? 13 : 10;
		camera.updateProjectionMatrix();
	};
	const ro = new ResizeObserver(resize);
	ro.observe(host);
	resize();

	// input
	const target = { x: 0, y: 0 };
	host.addEventListener('pointermove', (e) => {
		const r = host.getBoundingClientRect();
		target.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
		target.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
	});
	host.addEventListener('pointerleave', () => {
		target.x = 0;
		target.y = 0;
	});

	// loop, only while visible
	let visible = false;
	let raf = 0;
	let last = performance.now();
	const tick = (now: number) => {
		raf = 0;
		const dt = Math.min(0.05, (now - last) / 1000);
		last = now;
		const r = host.getBoundingClientRect();
		const scroll = Math.min(1, Math.max(0, 1 - (r.top + r.height / 2) / (innerHeight + r.height / 2))); // 0 → 1 while passing
		const spread = 0.35 + scroll * 0.45;
		panes.forEach((p, i) => {
			p.position.z += (i * spread - p.position.z) * 0.08;
			p.position.y += (i * 0.12 + Math.sin(now / 1400 + i) * 0.04 - p.position.y) * 0.08;
		});
		playhead.position.x = Math.sin(now / 1800) * 1.4;
		sys.rotation.y += (-0.42 + target.x * 0.35 + scroll * 0.25 - sys.rotation.y) * 0.06;
		sys.rotation.x += (-0.12 + target.y * 0.2 - sys.rotation.x) * 0.06;
		clips.forEach((c) => {
			c.position.x += c.userData.speed * dt;
			if (c.position.x > 8) c.position.x = -8;
		});
		renderer.render(scene, camera);
		if (visible && !document.hidden) raf = requestAnimationFrame(tick);
	};
	const start = () => {
		if (!raf && visible && !document.hidden) {
			last = performance.now();
			raf = requestAnimationFrame(tick);
		}
	};
	new IntersectionObserver(([e]) => {
		visible = e.isIntersecting;
		start();
	}).observe(host);
	document.addEventListener('visibilitychange', start);
	host.classList.add('is-webgl');
}
