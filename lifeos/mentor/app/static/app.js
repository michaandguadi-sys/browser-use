'use strict';

const KIND_LABELS = {
	north_star: 'North star',
	value: 'Values',
	anti_goal: 'Anti-goals',
	goal: 'Goals',
	strength: 'Strengths',
	blind_spot: 'Blind spots',
	coaching_pref: 'How to coach me',
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
const KIND_TITLES = { checkin: 'Check-in', evening: 'Evening reflection', weekly: 'Weekly review', ondemand: 'You asked', interview: 'Profile interview' };
const TABS = ['talk', 'you', 'progress', 'memory', 'settings'];
const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

const $ = (sel) => document.querySelector(sel);
const state = { messages: [], memory: [], settings: {}, push: {}, owner: '', indicators: [], scorecard: null, last_week: null, today: {}, interview: {} };
const dismissedToday = new Set();
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
	for (const tab of TABS) $(`#tab-${tab}`).classList.toggle('hidden', tab !== name);
	if (name === 'talk') scrollToBottom();
	if (name === 'you') loadYou();
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
	if (proactive && m.kind !== 'ondemand' && m.kind !== 'interview') {
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
		const notes = [
			...res.memory_added.map((i) => `Remembered ${KIND_LABELS[i.kind] || i.kind}: ${i.text}`),
			...res.logged.map((l) => `Logged +${l.value} ${l.unit}: ${l.name}`),
		];
		if (notes.length) {
			$('#messages').append(el('div', { class: 'remembered' }, notes.join(' · ')));
			scrollToBottom();
		}
		renderMemory();
		refreshProgress();
	} catch (e) {
		typing.textContent = `Not sent: ${e.message}`;
		$('#input').value = text;
	} finally {
		sending = false;
		$('#send').disabled = false;
	}
}

// --- today strip (energy + due commitments) ----------------------------------

function renderToday() {
	const strip = $('#today');
	strip.replaceChildren();
	if (state.today && !state.today.energy && !dismissedToday.has('energy')) {
		const row = el('div', { class: 'today-row' }, el('span', { class: 'muted small' }, 'Energy today?'));
		for (let n = 1; n <= 5; n += 1) {
			row.append(el('button', { class: 'ghost pill', type: 'button', onclick: () => setEnergy(n) }, String(n)));
		}
		strip.append(row);
	}
	const today = state.today?.day;
	const due = state.memory.filter((m) => m.kind === 'commitment' && m.status === 'active' && m.due_at && today && m.due_at.slice(0, 10) <= today && !dismissedToday.has(m.id));
	for (const item of due.slice(0, 2)) {
		strip.append(el('div', { class: 'today-row' },
			el('span', { class: 'small grow' }, `Due: ${item.text}`),
			el('button', { class: 'ghost pill', type: 'button', onclick: async () => { await patchMemory(item, { status: 'done' }); refreshProgress(); } }, 'Done'),
			el('button', { class: 'ghost pill', type: 'button', onclick: () => { dismissedToday.add(item.id); renderToday(); } }, 'Not yet'),
		));
	}
	strip.classList.toggle('hidden', !strip.children.length);
}

async function setEnergy(n) {
	applyProgress(await api('/api/today', { method: 'POST', body: JSON.stringify({ energy: n }) }));
}

// --- progress ----------------------------------------------------------------

function applyProgress(data) {
	for (const key of ['indicators', 'scorecard', 'last_week', 'today', 'interview']) if (key in data) state[key] = data[key];
	renderProgress();
	renderToday();
	renderInterview();
}

async function refreshProgress() {
	try { applyProgress(await api('/api/state')); } catch (_) { /* offline: keep last view */ }
}

function stepFor(unit) {
	return ['h', 'hours', 'hrs'].includes(unit.toLowerCase()) ? 0.5 : 1;
}

function renderProgress() {
	const card = state.scorecard;
	const box = $('#progress-week');
	box.replaceChildren();
	if (!card) return;
	box.append(el('h2', {}, `This week · day ${card.days_elapsed} of 7`));
	for (const ind of card.indicators) {
		const pct = ind.target ? Math.min(100, (ind.actual / ind.target) * 100) : 0;
		const pace = ind.target ? Math.min(100, (card.days_elapsed / 7) * 100) : 0;
		const behind = ind.actual < (ind.target * card.days_elapsed) / 7;
		const step = stepFor(ind.unit);
		box.append(el('div', { class: 'indicator' },
			el('div', { class: 'indicator-head' },
				el('span', { class: 'grow' }, ind.name),
				el('strong', { class: behind ? 'behind' : 'ok' }, `${ind.actual} / ${ind.target} ${ind.unit}`),
			),
			el('div', { class: 'bar', title: 'Marker = where you would be on an even pace' },
				el('div', { class: 'fill', style: `width:${pct}%` }),
				el('div', { class: 'pace', style: `left:${pace}%` }),
			),
			el('div', { class: 'row' },
				el('button', { class: 'ghost pill', type: 'button', onclick: () => logIndicator(ind.id, -step) }, `−${step}`),
				el('button', { class: 'pill', type: 'button', onclick: () => logIndicator(ind.id, step) }, `+${step} ${ind.unit}`),
			),
		));
	}
	const facts = [];
	if (card.commitments_due) facts.push(`Commitments kept: ${card.commitments_done} of ${card.commitments_due}`);
	if (card.commitments_overdue.length) facts.push(`Overdue: ${card.commitments_overdue.join('; ')}`);
	if (card.energy_avg != null) facts.push(`Energy: ${card.energy_avg}/5 avg (${card.energy_days} days)`);
	if (card.checkins_rated) facts.push(`Check-ins with good timing: ${card.checkins_useful} of ${card.checkins_rated}`);
	for (const f of facts) box.append(el('p', { class: 'small' }, f));

	const last = state.last_week;
	const lastBox = $('#progress-last');
	lastBox.replaceChildren(el('h2', {}, 'Last week'));
	if (last) {
		for (const ind of last.indicators) lastBox.append(el('p', { class: 'small' }, `${ind.name}: ${ind.actual} / ${ind.target} ${ind.unit}`));
		if (last.commitments_due) lastBox.append(el('p', { class: 'small' }, `Commitments kept: ${last.commitments_done} of ${last.commitments_due}`));
	}

	const list = $('#indicator-list');
	list.replaceChildren();
	for (const ind of state.indicators) {
		list.append(el('div', { class: 'memory-item' },
			el('div', { class: 'text' }, ind.name, el('span', { class: 'muted small' }, ` · ${ind.weekly_target} ${ind.unit}/week`)),
			el('div', { class: 'actions' },
				el('button', { class: 'ghost', type: 'button', onclick: async () => {
					const v = prompt(`Weekly target (${ind.unit})`, ind.weekly_target);
					if (v !== null && v !== '' && !Number.isNaN(Number(v))) {
						applyProgress(await api(`/api/indicators/${ind.id}`, { method: 'PATCH', body: JSON.stringify({ weekly_target: Number(v) }) }));
					}
				} }, 'Target'),
				el('button', { class: 'ghost', type: 'button', onclick: async () => {
					if (!confirm('Stop tracking this indicator? History is kept.')) return;
					applyProgress(await api(`/api/indicators/${ind.id}`, { method: 'PATCH', body: JSON.stringify({ active: false }) }));
				} }, '✕'),
			),
		));
	}
}

async function logIndicator(id, value) {
	applyProgress(await api(`/api/indicators/${id}/log`, { method: 'POST', body: JSON.stringify({ value }) }));
}

// --- profile interview -------------------------------------------------------

function renderInterview() {
	const box = $('#interview-card');
	const info = state.interview || {};
	if (!info.total) return box.classList.add('hidden');
	box.classList.remove('hidden');
	const known = info.total - info.missing.length;
	box.replaceChildren(
		el('h2', {}, `Profile · ${known} of ${info.total} topics known`),
		el('p', { class: 'muted small' }, info.missing.length
			? `Still unknown: ${info.missing.map((k) => KIND_LABELS[k] || k).join(', ')}. A real coach needs these. About 15 minutes, one question at a time.`
			: 'Complete. Review it below and correct anything that is off; re-run it whenever your direction changes.'),
		el('div', { class: 'row wrap' },
			el('button', { type: 'button', onclick: startInterview }, info.missing.length ? (info.active ? 'Continue interview' : 'Start interview') : 'Review profile with mentor'),
			info.active ? el('button', { class: 'ghost', type: 'button', onclick: async () => applyProgress(await api('/api/interview/pause', { method: 'POST' })) }, 'Pause') : null,
		),
	);
}

async function startInterview() {
	try {
		const msg = await api('/api/interview', { method: 'POST' });
		state.messages.push(msg);
		renderMessages();
		switchTab('talk');
		refreshProgress();
	} catch (e) {
		alert(e.message);
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
	renderPush();
	renderSiri();
}

// --- You: what the mentor has learned about this person ----------------------

const TRAIT_NAMES = { openness: 'Openness', conscientiousness: 'Conscientiousness', extraversion: 'Extraversion', agreeableness: 'Agreeableness', neuroticism: 'Emotional sensitivity' };
const MOVE_NAMES = {
	implementation_intention: 'If-then plans', mental_contrasting: 'Wish → obstacle → plan', progress_check: 'Number checks', socratic_question: 'Socratic questions',
	values_reconnect: 'Back to values', celebrate_progress: 'Celebrating progress', reflection_prompt: 'Reflection', wellbeing_check: 'Wellbeing checks', human_routing: 'Who could help', red_team: 'Devil\'s advocate',
};
const label = (s) => s.replace(/_/g, ' ');

function bar(fraction, { mid = false, opacity = 1 } = {}) {
	const b = el('div', { class: `bar${mid ? ' mid' : ''}` });
	const fill = el('i');
	fill.style.width = `${Math.round(Math.max(0, Math.min(1, fraction)) * 100)}%`;
	fill.style.opacity = String(opacity);
	b.append(fill);
	return b;
}

function notMe(claim) {
	return el('button', { type: 'button', class: 'notme', onclick: async () => {
		const note = prompt(`What is wrong about this?\n\n"${claim}"`);
		if (note === null) return;
		renderYou(await api('/api/you/correct', { method: 'POST', body: JSON.stringify({ claim, note }) }));
	} }, 'Not me');
}

async function loadYou() {
	try { renderYou(await api('/api/you')); } catch (err) { $('#you').replaceChildren(el('p', { class: 'error pad' }, err.message)); }
}

function renderYou(you) {
	const box = $('#you');
	const m = you.model;
	const parts = [];
	const d = you.data;
	parts.push(el('div', { class: 'card stack' },
		el('h2', {}, 'What I have learned about you'),
		el('p', { class: 'lede' }, m ? m.summary : 'Not enough history yet. Talk to me for a few days, then I will build a first picture of how you tick.'),
		el('div', { class: 'stats' },
			el('span', { class: 'stat' }, `${d.days} days`),
			el('span', { class: 'stat' }, `${d.messages} messages`),
			el('span', { class: 'stat' }, `${you.learning.experiments} check-ins learned from`),
			m ? el('span', { class: 'stat' }, `model v${m.version} · ${m.built_with}`) : null),
		el('p', { class: 'why' }, 'Everything here is a hypothesis with a confidence level, rebuilt every night from all your data. Tap “Not me” to correct it; corrections always win.')));
	if (m && m.traits.length) {
		parts.push(el('div', { class: 'card' }, el('h2', {}, 'Personality (Big Five)'),
			...m.traits.map((t) => el('div', { class: 'trait' },
				el('div', { class: 'trait-head' }, el('b', {}, TRAIT_NAMES[t.trait] || t.trait), el('span', { class: 'muted' }, `${t.score}/100 · confidence ${Math.round(t.confidence * 100)}%`)),
				bar(t.score / 100, { mid: true, opacity: 0.35 + 0.65 * t.confidence }),
				el('div', { class: 'why' }, `Seen: ${t.evidence}`),
				el('div', { class: 'why' }, `So I: ${t.coaching_implication}`),
				notMe(`${t.trait} ${t.score}/100: ${t.evidence}`)))));
	}
	if (m && (m.values.length || m.needs.length)) {
		parts.push(el('div', { class: 'card stack' }, el('h2', {}, 'What drives you'),
			el('div', { class: 'values' }, ...[...m.values].sort((a, b) => a.rank - b.rank).map((v) => el('span', { class: 'value', title: v.evidence }, el('b', {}, v.rank), label(v.value)))),
			el('div', { class: 'needs' }, ...m.needs.map((n) => el('div', { class: `need ${n.state}`, title: n.evidence }, el('b', {}, n.need), n.state))),
			el('p', { class: 'why' }, 'Values: Schwartz’s ten basic values. Needs: autonomy, competence and relatedness from self-determination theory; a strained need is where I pay most attention.')));
	}
	if (m && m.patterns.length) {
		parts.push(el('div', { class: 'card' }, el('h2', {}, 'Patterns I see'),
			...m.patterns.map((p) => el('div', { class: 'trait' },
				el('div', { class: 'trait-head' }, el('b', {}, p.pattern), el('span', { class: 'muted' }, `${Math.round(p.confidence * 100)}%`)),
				el('div', { class: 'why' }, `Evidence: ${p.evidence}`),
				el('div', { class: 'why' }, `So I: ${p.implication}`),
				notMe(p.pattern)))));
	}
	const moves = you.learning.moves.filter((x) => x.tries);
	if (moves.length) {
		parts.push(el('div', { class: 'card' }, el('h2', {}, 'What works with you'),
			el('p', { class: 'why' }, 'Share of my check-ins of each kind that you answered within 90 minutes or rated as good timing. I try the winners more often and still test the rest now and then.'),
			...moves.map((x) => el('div', { class: 'move', title: x.what }, el('span', {}, MOVE_NAMES[x.move] || label(x.move)), bar(x.rate), el('span', { class: 'muted' }, `${Math.round(x.rate * 100)}% · ${x.tries}`)))));
	}
	const slots = you.learning.slots;
	if (slots.some((x) => x.tries)) {
		const blocks = [...new Set(slots.map((x) => x.slot.split(':')[1]))];
		const grid = el('div', { class: 'heat' }, el('span'), ...blocks.map((b) => el('span', {}, `${Number(b)}h`)));
		for (const dayType of ['weekday', 'weekend']) {
			grid.append(el('span', {}, dayType === 'weekday' ? 'Mon–Fri' : 'Sat–Sun'));
			for (const b of blocks) {
				const s = slots.find((x) => x.slot === `${dayType}:${b}`);
				const cell = el('i', { class: s && s.tries ? '' : 'empty', title: s && s.tries ? `${Math.round(s.rate * 100)}% of ${s.tries}` : 'not tested yet' });
				if (s && s.tries) cell.style.opacity = String(0.12 + 0.88 * s.rate);
				grid.append(cell);
			}
		}
		parts.push(el('div', { class: 'card stack' }, el('h2', {}, 'When you are open to a message'),
			grid, el('p', { class: 'why' }, 'Darker = you usually answer. I check in when you tend to be open, and stay quiet in your dead zones.')));
	}
	if (you.history.length) {
		parts.push(el('div', { class: 'card stack' }, el('h2', {}, 'How the picture sharpened'),
			el('div', { class: 'timeline' }, ...you.history.map((h) => el('div', { class: 'version' }, el('b', {}, `v${h.version}`),
				el('div', { class: 'stack' }, el('span', { class: 'muted' }, `${fmtTime(h.built_at)} · ${h.data_days} days · ${h.data_messages} messages · ${h.built_with}`), bar(h.confidence))))),
			el('p', { class: 'why' }, 'Each night I rebuild this from the full raw history. More data and better AI models both make it sharper, without losing anything you told me.')));
	}
	if (you.corrections.length) {
		parts.push(el('div', { class: 'card stack' }, el('h2', {}, 'Your corrections'),
			...you.corrections.map((c) => el('p', { class: 'why' }, `“${c.claim}” → ${c.note || 'not me'}`))));
	}
	parts.push(el('div', { class: 'row pad' }, pushButton(m ? 'Rebuild now' : 'Build my first picture', async () => renderYou(await api('/api/you/rebuild', { method: 'POST' })), 'ghost')));
	box.replaceChildren(...parts);
}

// --- notifications (Web Push from the installed app) -----------------------

const IS_IOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const STANDALONE = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const PUSH_SUPPORTED = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

function keyBytes(b64) {
	const s = atob(b64.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (b64.length % 4)) % 4));
	return Uint8Array.from(s, (c) => c.charCodeAt(0));
}

async function currentSubscription() {
	if (!PUSH_SUPPORTED) return null;
	const reg = await navigator.serviceWorker.ready;
	return reg.pushManager.getSubscription();
}

async function enablePush() {
	// requestPermission must be the first await inside the tap, or iOS ignores it
	const permission = await Notification.requestPermission();
	if (permission !== 'granted') { await renderPush(); return; }
	const reg = await navigator.serviceWorker.ready;
	const { publicKey } = await api('/api/push/key');
	let sub = await reg.pushManager.getSubscription();
	if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) });
	const res = await api('/api/push/subscribe', { method: 'POST', body: JSON.stringify(sub.toJSON()) });
	state.push.devices = res.devices;
	await api('/api/push/test', { method: 'POST' });
	await renderPush();
}

async function disablePush() {
	const sub = await currentSubscription();
	if (sub) {
		await api('/api/push/unsubscribe', { method: 'POST', body: JSON.stringify({ endpoint: sub.endpoint }) });
		await sub.unsubscribe();
	}
	await renderPush();
}

function pushButton(label, fn, cls = '') {
	return el('button', { type: 'button', class: cls, onclick: async (e) => {
		e.target.disabled = true;
		try { await fn(); } catch (err) { alert(err.message); } finally { e.target.disabled = false; }
	} }, label);
}

async function renderPush() {
	const info = $('#push-info');
	const nudge = $('#push-nudge');
	const push = state.push || {};
	const parts = [];
	let showNudge = false;
	if (IS_IOS && !STANDALONE) {
		parts.push(el('p', {}, 'On iPhone, notifications only work in the home screen app. In Safari tap Share → Add to Home Screen, then open Mentor from the icon and turn them on here.'));
	} else if (!PUSH_SUPPORTED) {
		parts.push(el('p', { class: 'muted' }, 'This browser can’t receive notifications.'));
	} else if (Notification.permission === 'denied') {
		parts.push(el('p', {}, IS_IOS ? 'Notifications are blocked. iPhone Settings → Notifications → Mentor → Allow Notifications.' : 'Notifications are blocked for this site in the browser settings.'));
	} else {
		const sub = await currentSubscription().catch(() => null);
		if (sub && Notification.permission === 'granted') {
			parts.push(
				el('p', {}, 'On for this device. Check-ins, the evening reflection and the weekly review arrive as notifications from Mentor. Tap one to answer.'),
				el('div', { class: 'row wrap' }, pushButton('Send a test', () => api('/api/push/test', { method: 'POST' })), pushButton('Turn off here', disablePush, 'ghost')),
			);
		} else {
			showNudge = true;
			parts.push(
				el('p', {}, 'Let the mentor reach you: it checks in a few times a day at most, never in quiet hours.'),
				el('div', { class: 'row' }, pushButton('Turn on notifications', enablePush)),
			);
		}
	}
	if (push.devices) parts.push(el('p', { class: 'muted' }, `${push.devices} device${push.devices === 1 ? '' : 's'} receive check-ins.`));
	if (push.enabled && push.server) parts.push(el('p', { class: 'muted' }, 'Also sent to ntfy: ', el('code', {}, `${push.server}/${push.topic}`)));
	info.replaceChildren(...parts);
	nudge.replaceChildren(el('span', {}, 'Turn on notifications so I can check in with you.'), pushButton('Turn on', enablePush));
	nudge.classList.toggle('hidden', !showNudge);
}

// --- Siri shortcut ----------------------------------------------------------

function copyField(value) {
	return el('div', { class: 'copy' }, el('code', {}, value), el('button', { type: 'button', class: 'ghost small-btn', onclick: async (e) => {
		await navigator.clipboard.writeText(value);
		e.target.textContent = 'Copied';
		setTimeout(() => { e.target.textContent = 'Copy'; }, 1500);
	} }, 'Copy'));
}

async function renderSiri(rotate = false) {
	const box = $('#siri-info');
	let setup;
	try {
		setup = await api(rotate ? '/api/voice/rotate' : '/api/voice/setup', rotate ? { method: 'POST' } : {});
	} catch (err) {
		box.replaceChildren(el('p', { class: 'error' }, err.message));
		return;
	}
	box.replaceChildren(
		el('p', {}, 'Say “Hey Siri, Mentor”, talk, and Siri reads the answer. It lands in Talk too, and updates go into memory and your indicators. Build the shortcut once (2 minutes):'),
		el('ol', {},
			el('li', {}, 'Open the Shortcuts app → + → name it ', el('b', {}, 'Mentor'), '.'),
			el('li', {}, 'Add the action ', el('b', {}, 'Dictate Text'), '.'),
			el('li', {}, 'Add ', el('b', {}, 'Get Contents of URL'), ' with this URL:', copyField(setup.url)),
			el('li', {}, 'Tap the arrow on that action: Method ', el('b', {}, 'POST'), '. Headers → Add: key ', el('code', {}, 'Authorization'), ', value:', copyField(`Bearer ${setup.token}`)),
			el('li', {}, 'Request Body ', el('b', {}, 'JSON'), ' → Add field: type Text, key ', el('code', {}, 'text'), ', value: the ', el('b', {}, 'Dictated Text'), ' variable.'),
			el('li', {}, 'Add ', el('b', {}, 'Speak Text'), ' and give it ', el('b', {}, 'Contents of URL'), '.'),
		),
		el('p', { class: 'muted' }, 'The token is a password for your mentor. If it leaks, make a new one (the old shortcut then stops working).'),
		el('div', { class: 'row' }, pushButton('New token', () => renderSiri(true), 'ghost')),
	);
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
	renderProgress();
	renderToday();
	renderInterview();
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

	const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
	const mic = $('#mic');
	if (Recognition) {
		let rec = null;
		mic.addEventListener('click', () => {
			if (rec) { rec.stop(); return; }
			rec = new Recognition();
			rec.lang = navigator.language || 'en-US';
			rec.interimResults = false;
			rec.onresult = (ev) => {
				const said = Array.from(ev.results).map((r) => r[0].transcript).join(' ');
				input.value = (input.value ? `${input.value} ` : '') + said;
				input.dispatchEvent(new Event('input'));
			};
			rec.onend = () => { rec = null; mic.classList.remove('on'); };
			mic.classList.add('on');
			rec.start();
		});
	} else {
		mic.classList.add('hidden');  // keyboards' own dictation still works
	}

	$('#indicator-form').addEventListener('submit', async (e) => {
		e.preventDefault();
		const f = e.target;
		applyProgress(await api('/api/indicators', { method: 'POST', body: JSON.stringify({ name: f.ind_name.value.trim(), unit: f.ind_unit.value.trim(), weekly_target: Number(f.ind_target.value) }) }));
		f.reset();
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
	if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', (e) => {
		if (!e.data || e.data.type !== 'open') return;
		const url = new URL(e.data.url);
		history.replaceState(null, '', url.pathname + url.hash);
		loadState({ full: false }).catch(() => {});
	});
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
