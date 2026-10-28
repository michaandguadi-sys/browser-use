// Cinematic post for the desktop story scene (never loaded in lite/phone mode):
// render → bloom (half resolution, highlights only) → output (tone mapping + sRGB) → "cine" pass:
// velocity-scaled motion blur (6 taps: directional + radial zoom), chromatic aberration that grows with scroll
// speed, a soft vignette and animated film grain. One composer; the canvas keeps the renderer's DPR cap.
import { type PerspectiveCamera, type Scene, Vector2, type WebGLRenderer } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const CineShader = {
	uniforms: {
		tDiffuse: { value: null },
		uTime: { value: 0 },
		uGrain: { value: 0.035 },
		uVig: { value: 0.12 },
		uCA: { value: 0.004 },
		uDir: { value: new Vector2() },
		uZoom: { value: 0 },
		uRes: { value: new Vector2(1, 1) },
	},
	vertexShader: /* glsl */ `
		varying vec2 vUv;
		void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
	fragmentShader: /* glsl */ `
		uniform sampler2D tDiffuse;
		uniform float uTime, uGrain, uVig, uCA, uZoom;
		uniform vec2 uDir, uRes;
		varying vec2 vUv;
		float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
		vec3 tap(vec2 uv) {
			vec2 d = uv - 0.5;
			vec2 off = d * dot(d, d) * uCA;
			return vec3(texture2D(tDiffuse, uv + off).r, texture2D(tDiffuse, uv).g, texture2D(tDiffuse, uv - off).b);
		}
		void main() {
			vec3 c;
			if (abs(uDir.x) + abs(uDir.y) + abs(uZoom) < 0.0004) {
				c = tap(vUv);
			} else {
				c = vec3(0.0);
				for (int i = 0; i < 6; i++) {
					float t = float(i) / 5.0 - 0.5;
					c += tap(vUv + uDir * t - (vUv - 0.5) * uZoom * (t + 0.5));
				}
				c /= 6.0;
			}
			vec2 d = (vUv - 0.5) * vec2(1.0, 0.85);
			c *= 1.0 - uVig * smoothstep(0.3, 0.8, length(d) * 1.35);
			float g = hash(floor(vUv * uRes) + fract(uTime * 0.731) * vec2(97.3, 41.9)) - 0.5;
			c += g * uGrain;
			gl_FragColor = vec4(c, 1.0);
		}`,
};

export function createPost(renderer: WebGLRenderer, scene: Scene, camera: PerspectiveCamera) {
	const size = renderer.getDrawingBufferSize(new Vector2());
	const composer = new EffectComposer(renderer);
	composer.addPass(new RenderPass(scene, camera));
	// only real highlights bloom (specular, the playhead glow) — the light page background stays clean
	const bloom = new UnrealBloomPass(new Vector2(size.x / 2, size.y / 2), 0.32, 0.45, 0.93);
	const setBloom = bloom.setSize.bind(bloom);
	bloom.setSize = (w: number, h: number) => setBloom(Math.max(1, Math.round(w / 2)), Math.max(1, Math.round(h / 2)));
	composer.addPass(bloom);
	composer.addPass(new OutputPass());
	const cine = new ShaderPass(CineShader);
	composer.addPass(cine);
	const u = cine.uniforms as typeof CineShader.uniforms;

	return {
		bloom,
		setSize(w: number, h: number, dpr: number) {
			composer.setPixelRatio(dpr);
			composer.setSize(w, h);
			u.uRes.value.set(w * dpr, h * dpr);
		},
		/** blur: uv-space direction (x, y) and radial zoom; ca: extra chromatic aberration (0…1) */
		render(dt: number, t: number, blurX: number, blurY: number, zoom: number, ca: number) {
			u.uTime.value = t;
			u.uDir.value.set(blurX, blurY);
			u.uZoom.value = zoom;
			u.uCA.value = 0.004 + ca * 0.03;
			composer.render(dt);
		},
	};
}
export type Post = ReturnType<typeof createPost>;
