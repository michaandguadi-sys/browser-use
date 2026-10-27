// App-shell cache so the mentor opens instantly (and offline shows the last UI). API calls always go to the network.
const CACHE = 'mentor-shell-v2';
const SHELL = ['/', '/static/style.css', '/static/app.js', '/static/manifest.webmanifest', '/static/icon.svg', '/static/icon-192.png'];

self.addEventListener('install', (event) => {
	event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys()
			.then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
			.then(() => self.clients.claim()),
	);
});

self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);
	if (event.request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/') || url.pathname === '/healthz') return;
	// Network first, cache fallback: always fresh when online, still opens when offline.
	event.respondWith(
		fetch(event.request)
			.then((response) => {
				const copy = response.clone();
				caches.open(CACHE).then((cache) => cache.put(event.request, copy));
				return response;
			})
			.catch(() => caches.match(event.request).then((hit) => hit || caches.match('/'))),
	);
});

// Web Push: check-ins arrive as a notification from the Mentor app itself.
self.addEventListener('push', (event) => {
	let data = {};
	try { data = event.data ? event.data.json() : {}; } catch (_) { data = { body: event.data ? event.data.text() : '' }; }
	event.waitUntil(self.registration.showNotification(data.title || 'Mentor', {
		body: data.body || '',
		tag: data.tag || 'mentor',
		data: { url: data.url || '/' },
		icon: '/static/icon-192.png',
		badge: '/static/icon-192.png',
	}));
});

self.addEventListener('notificationclick', (event) => {
	event.notification.close();
	const target = new URL(event.notification.data && event.notification.data.url || '/', self.location.origin).href;
	event.waitUntil((async () => {
		const open = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
		for (const client of open) {
			if (new URL(client.url).origin !== self.location.origin) continue;
			await client.focus();
			client.postMessage({ type: 'open', url: target });
			return;
		}
		await self.clients.openWindow(target);
	})());
});
