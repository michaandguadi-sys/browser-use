// Service worker: cache the app shell so LingoLens opens offline and is installable.
// We deliberately cache only our own files. The TensorFlow.js library and the
// detection-model weights are large cross-origin downloads left to the network/HTTP
// cache; conversation mode needs none of them and works fully offline.

const CACHE = 'lingolens-v1';
const SHELL = [
	'./',
	'./index.html',
	'./styles.css',
	'./dictionary.js',
	'./app.js',
	'./manifest.webmanifest',
	'./icon.svg',
];

self.addEventListener('install', (event) => {
	event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
	);
});

self.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;
	const url = new URL(request.url);
	// Only serve our own origin from cache; everything else goes straight to network.
	if (url.origin !== self.location.origin) return;
	event.respondWith(
		caches.match(request).then((hit) => hit || fetch(request).then((res) => {
			const copy = res.clone();
			caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
			return res;
		}).catch(() => caches.match('./index.html'))),
	);
});
