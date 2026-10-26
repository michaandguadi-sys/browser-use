'use strict';

const KIND_LABELS = {
	north_star: 'North star',
	value: 'Values',
	goal: 'Goals',
	project: 'Projects',
	commitment: 'Commitments',
	idea: 'Ideas',
	lesson: 'Lessons',
	person: 'People',
	context: 'Context',
};
const LENS_LABELS = {
	socrates: 'Socrates',
	story_editor: 'Story editor',
	producer: 'Producer',
	career_strategist: 'Career strategist',
	red_team: 'Red team',
	craft_coach: 'Craft coach',
	wellbeing: 'Wellbeing',
};
const KIND_TITLES = { checkin: 'Check-in', evening: 'Evening reflection', weekly: 'Weekly review', ondemand: 'You asked' };
const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

const $ = (sel) => document.querySelector(sel);
const state = { messages: [], memory: [], settings: {}, push: {}, owner: '' };
let sending = false;

async function api(path, options = {}) {
	const res = await fetch(path, {
		...options,
		credentials: 'same-origin',
		headers: { 'Content-Type': 'application/json', 'X-Timezone': TZ, ...(options.headers || {}) },
	});
	if (res.status === 401 && path !== '/api/login') {
		showLogin();
		throw new Error('login required');
	}
	if (!res.ok) {
		let detail = res.statusText;
		try { detail = (await res.json()).detail || detail; } catch (_) { /* not json */ }
		throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
	}
	return res.json();
}

function el(tag, attrs = {}, ...children) {
	const node = document.createElement(tag);
	for (const [key, value] of Object.entries(attrs)) {
		if (key === 'class') node.className = value;
		else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
		else node.setAttribute(key, value);
	}
	for (const child of children) {
		if (child == null || child === false) continue;
		node.append(child instanceof Node ? child : document.createTextNode(String(child)));
	}
	return node;
}

function fmtTime(iso) {
	const d = new Date(iso);
	const sameDay = d.toDateString() === new Date().toDateString();
	return sameDay
		? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
		: d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' }) + ' ' +
			d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// --- screens ---------------------------------------------------------------

function showLogin() {
	$('#app').classList.add('hidden');
	$('#login').classList.remove('hidden');
	$('#passphrase').focus();
}

function showApp() {
	$('#login').classList.add('hidden');
	$('#app').classList.remove('hidden');
}

function switchTab(name) {
	for (const btn of document.querySelectorAll('.tabs button')) btn.classList.toggle('active', btn.dataset.tab === name);
	for (const tab of ['talk', 'memory', 'settings']) $(`#tab-${tab}`).classList.toggle('hidden', tab !== name);
	if (name === 'talk') scrollToBottom();
}

// --- talk ------------------------------------------------------------------

function renderMessage(m) {
	const proactive = m.role === 'mentor' && m.kind !== 'chat';
	const bubble = el('div', { class: `msg ${m.role}${proactive ? ' proactive' : ''}`, id: `m-${m.id}` });
	if (proactive) {
		bubble.append(el('div', { class: 'meta' },
			el('span', { class: 'chip' }, KIND_TITLES[m.kind] || m.kind),
			m.lens ? el('span', { class: 'chip' }, LENS_LABELS[m.lens] || m.lens) : null,
			el('span', {}, fmtTime(m.created_at)),
		));
	}
	bubble.append(document.createTextNode(m.content));
	if (proactive && m.reason) bubble.append(el('div', { class: 'meta', style: 'margin:6px 0 0' }, `Why now: ${m.reason}`));
	if (proactive && m.kind !== 'ondemand') {
		const fb = el('div', { class: 'feedback' });
		const mk = (value, label) => el('button', {
			class: `ghost${m.feedback === value ? ' on' : ''}`,
			type: 'button',
			title: 'Tunes timing only, not what the mentor thinks of your work',
			onclick: async () => {
				const updated = await api(`/api/messages/${m.id}/feedback`, { method: 'POST', body: JSON.stringify({ value: m.feedback === value ? 0 : value }) });
				Object.assign(m, updated);
				bubble.replaceWith(renderMessage(m));
			},
		}, label);
		fb.append(mk(1, 'Good timing'), mk(-1, 'Not now'));
		bubble.append(fb);
	}
	return bubble;
}

function renderMessages() {
	const box = $('#messages');
	box.replaceChildren();
	if (!state.messages.length) {
		box.append(el('div', { class: 'msg mentor' },
			`Hi ${state.owner}. I'm your mentor. I'll check in now and then, ask questions, and remember what matters to you. ` +
			'Start anywhere: what are you working toward right now, and why does it matter to you?'));
	}
	for (const m of state.messages) box.append(renderMessage(m));
	scrollToBottom();
}

function scrollToBottom() {
	const box = $('#messages');
	requestAnimationFrame(() => { box.scrollTop = box.scrollHeight; });
}

function highlightFromHash() {
	const match = location.hash.match(/m=([a-f0-9]+)/);
	if (!match) return;
	const node = document.getElementById(`m-${match[1]}`);
	if (!node) return;
	switchTab('talk');
	node.classList.add('highlight');
	node.scrollIntoView({ block: 'center' });
	setTimeout(() => node.classList.remove('highlight'), 2500);
	history.replaceState(null, '', location.pathname);
}

async function send(text) {
	if (sending || !text.trim()) return;
	sending = true;
	$('#send').disabled = true;
	const box = $('#messages');
	box.append(el('div', { class: 'msg user' }, text));
	const typing = el('div', { class: 'typing' }, 'Mentor is thinking…');
	box.append(typing);
	scrollToBottom();
	try {
		const res = await api('/api/message', { method: 'POST', body: JSON.stringify({ text }) });
		state.messages.push(res.user, res.mentor);
		for (const item of res.memory_added) state.memory.push(item);
		renderMessages();
		if (res.memory_added.length) {
			$('#messages').append(el('div', { class: 'remembered' },
				'Remembered: ' + res.memory_added.map((i) => `${KIND_LABELS[i.kind] || i.kind}: ${i.text}`).join(' · ')));
			scrollToBottom();
		}
		renderMemory();
	} catch (e) {
		typing.textContent = `Not sent: ${e.message}`;
		$('#input').value = text;
	} finally {
		sending = false;
		$('#send').disabled = false;
	}
}

// --- memory ----------------------------------------------------------------

function renderMemory() {
	const list = $('#memory-list');
	list.replaceChildren();
	for (const [kind, label] of Object.entries(KIND_LABELS)) {
		const items = state.memory.filter((m) => m.kind === kind && m.status !== 'dropped');
		if (!items.length) continue;
		const group = el('div', { class: 'memory-group' }, el('h3', {}, label));
		for (const item of items) group.append(renderMemoryItem(item));
		list.append(group);
	}
	if (!list.children.length) list.append(el('p', { class: 'muted pad' }, 'Nothing yet. Talk to your mentor, or add things above.'));
}

function renderMemoryItem(item) {
	const actions = el('div', { class: 'actions' });
	if (item.kind === 'commitment' && item.status === 'active') {
		actions.append(el('button', { class: 'ghost', type: 'button', onclick: () => patchMemory(item, { status: 'done' }) }, 'Done'));
	}
	actions.append(
		el('button', {
			class: 'ghost', type: 'button', onclick: () => {
				const text = prompt('Edit', item.text);
				if (text && text.trim() && text !== item.text) patchMemory(item, { text: text.trim() });
			},
		}, 'Edit'),
		el('button', {
			class: 'ghost', type: 'button', onclick: async () => {
				if (!confirm('Forget this?')) return;
				await api(`/api/memory/${item.id}`, { method: 'DELETE' });
				state.memory = state.memory.filter((m) => m.id !== item.id);
				renderMemory();
			},
		}, '✕'),
	);
	const due = item.due_at ? el('span', { class: 'muted small' }, ` · due ${item.due_at}`) : null;
	return el('div', { class: `memory-item${item.status === 'done' ? ' done' : ''}` },
		el('div', { class: 'text' }, item.text, due), actions);
}

async function patchMemory(item, changes) {
	const updated = await api(`/api/memory/${item.id}`, { method: 'PATCH', body: JSON.stringify(changes) });
	Object.assign(item, updated);
	renderMemory();
}

// --- settings --------------------------------------------------------------

function renderSettings() {
	const form = $('#settings-form');
	for (const [key, value] of Object.entries(state.settings)) {
		const input = form.elements.namedItem(key);
		if (!input) continue;
		if (input.type === 'checkbox') input.checked = Boolean(value);
		else input.value = value;
	}
	const until = state.settings.focus_until ? new Date(state.settings.focus_until) : null;
	$('#focus-state').textContent = until && until > new Date() ? `Focused until ${fmtTime(until.toISOString())}` : 'Not in focus mode.';
	$('#status').textContent = state.settings.paused ? 'paused' : (until && until > new Date() ? 'focus' : '');
	const push = state.push || {};
	const info = $('#push-info');
	info.replaceChildren();
	if (push.enabled && push.server) {
		info.append(
			el('p', {}, 'Install the free ntfy app (iOS / Android / desktop), add this server, log in with the ntfy user from setup, and subscribe to this topic:'),
			el('p', {}, 'Server: ', el('code', {}, push.server)),
			el('p', {}, 'Topic: ', el('code', {}, push.topic)),
		);
	} else {
		info.append(el('p', { class: 'muted' }, 'Push is not configured on the server yet (see lifeos/README.md).'));
	}
}

// --- boot ------------------------------------------------------------------

async function loadState({ full = true } = {}) {
	const data = await api('/api/state');
	const lastId = (list) => (list.length ? list[list.length - 1].id : null);
	const newMessages = data.messages.length !== state.messages.length || lastId(data.messages) !== lastId(state.messages);
	Object.assign(state, data);
	showApp();
	if (full || newMessages) renderMessages();
	renderMemory();
	if (full) renderSettings();
	highlightFromHash();
}

function wire() {
	$('#login-form').addEventListener('submit', async (e) => {
		e.preventDefault();
		$('#login-error').textContent = '';
		try {
			await api('/api/login', { method: 'POST', body: JSON.stringify({ passphrase: $('#passphrase').value }) });
			$('#passphrase').value = '';
			await loadState();
		} catch (err) {
			$('#login-error').textContent = err.message;
		}
	});

	for (const btn of document.querySelectorAll('.tabs button')) btn.addEventListener('click', () => switchTab(btn.dataset.tab));

	const input = $('#input');
	input.addEventListener('input', () => {
		input.style.height = 'auto';
		input.style.height = `${Math.min(input.scrollHeight, 160)}px`;
	});
	input.addEventListener('keydown', (e) => {
		if (e.key === 'Enter' && !e.shiftKey && !('ontouchstart' in window)) {
			e.preventDefault();
			$('#composer').requestSubmit();
		}
	});
	$('#composer').addEventListener('submit', (e) => {
		e.preventDefault();
		const text = input.value;
		input.value = '';
		input.style.height = 'auto';
		send(text);
	});

	$('#ask-now').addEventListener('click', async () => {
		const btn = $('#ask-now');
		btn.disabled = true;
		try {
			const msg = await api('/api/checkin-now', { method: 'POST' });
			state.messages.push(msg);
			renderMessages();
		} catch (e) {
			alert(e.message);
		} finally {
			btn.disabled = false;
		}
	});

	const kindSelect = $('#memory-kind');
	for (const [kind, label] of Object.entries(KIND_LABELS)) kindSelect.append(el('option', { value: kind }, label));
	kindSelect.addEventListener('change', () => $('#memory-due').classList.toggle('hidden', kindSelect.value !== 'commitment'));
	$('#memory-form').addEventListener('submit', async (e) => {
		e.preventDefault();
		const body = { kind: kindSelect.value, text: $('#memory-text').value.trim() };
		if (body.kind === 'commitment' && $('#memory-due').value) body.due_at = $('#memory-due').value;
		const item = await api('/api/memory', { method: 'POST', body: JSON.stringify(body) });
		if (!state.memory.some((m) => m.id === item.id)) state.memory.push(item);
		$('#memory-text').value = '';
		renderMemory();
	});

	$('#settings-form').addEventListener('submit', async (e) => {
		e.preventDefault();
		const form = e.target;
		const changes = {
			quiet_start: form.quiet_start.value,
			quiet_end: form.quiet_end.value,
			max_checkins_per_day: Number(form.max_checkins_per_day.value),
			min_gap_hours: Number(form.min_gap_hours.value),
			evening_reflection: form.evening_reflection.value,
			weekly_review_day: Number(form.weekly_review_day.value),
			weekly_review_time: form.weekly_review_time.value,
			paused: form.paused.checked,
		};
		try {
			state.settings = await api('/api/settings', { method: 'PATCH', body: JSON.stringify(changes) });
			$('#settings-saved').textContent = 'Saved.';
		} catch (err) {
			$('#settings-saved').textContent = `Not saved: ${err.message}`;
		}
		renderSettings();
		setTimeout(() => { $('#settings-saved').textContent = ''; }, 2500);
	});

	for (const btn of document.querySelectorAll('[data-focus]')) {
		btn.addEventListener('click', async () => {
			state.settings = await api('/api/focus', { method: 'POST', body: JSON.stringify({ minutes: Number(btn.dataset.focus) }) });
			renderSettings();
		});
	}

	$('#logout').addEventListener('click', async () => {
		await api('/api/logout', { method: 'POST' });
		showLogin();
	});

	window.addEventListener('hashchange', highlightFromHash);
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'visible' && !sending) loadState({ full: false }).catch(() => {});
	});
	setInterval(() => {
		if (document.visibilityState === 'visible' && !sending && !$('#app').classList.contains('hidden')) loadState({ full: false }).catch(() => {});
	}, 60000);
}

wire();
loadState().catch(() => showLogin());
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
