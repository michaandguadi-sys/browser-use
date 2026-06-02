// app.js — glue between the camera/detector, the conversation deck, and the dictionary.
// No framework on purpose: this has to load instantly off a static host or a phone.

const { BASE_LANG, LANGUAGES, VOCAB, CONVERSATIONS } = window.LL_DATA;

const state = {
	lang: localStorage.getItem('ll_lang') || 'es',
	mode: 'look',
	model: null,
	stream: null,
	running: false,
	predictions: [],   // last frame's detections, kept for click hit-testing
	seen: {},          // word-key -> times seen, for the vocab log
	scenario: Object.keys(CONVERSATIONS)[0],
	learned: new Set(JSON.parse(localStorage.getItem('ll_learned') || '[]')),
};

// ---------- small helpers ----------

// Speak a phrase in the target language. We drop "(romaji)" hints so the TTS engine
// doesn't read the pronunciation aid out loud.
function speak(text, langCode) {
	if (!('speechSynthesis' in window)) return;
	const clean = text.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
	const u = new SpeechSynthesisUtterance(clean);
	u.lang = LANGUAGES[langCode]?.tts || 'en-US';
	u.rate = 0.9;
	window.speechSynthesis.cancel();
	window.speechSynthesis.speak(u);
}

function word(key, langCode) {
	return VOCAB[key]?.[langCode] ?? key;
}

// ---------- language picker ----------

function buildLangSelect() {
	const sel = document.getElementById('langSelect');
	sel.innerHTML = '';
	for (const [code, meta] of Object.entries(LANGUAGES)) {
		const opt = document.createElement('option');
		opt.value = code;
		opt.textContent = `${meta.flag} ${meta.name}`;
		if (code === state.lang) opt.selected = true;
		sel.appendChild(opt);
	}
	sel.addEventListener('change', () => {
		state.lang = sel.value;
		localStorage.setItem('ll_lang', state.lang);
		renderVocabLog();
		if (state.mode === 'conversation') renderExchanges();
	});
}

// ---------- mode switching ----------

function setMode(mode) {
	state.mode = mode;
	document.querySelectorAll('#modeToggle button').forEach((b) => {
		b.classList.toggle('active', b.dataset.mode === mode);
	});
	document.getElementById('look').classList.toggle('active', mode === 'look');
	document.getElementById('conversation').classList.toggle('active', mode === 'conversation');
	if (mode === 'conversation') renderScenarios();
}

// ---------- Look & Learn: camera + detection ----------

const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const ctx = overlay.getContext('2d');

async function startCamera() {
	const startPane = document.getElementById('startPane');
	const status = document.getElementById('status');
	const statusText = document.getElementById('statusText');
	status.hidden = false;

	try {
		statusText.textContent = 'requesting camera…';
		state.stream = await navigator.mediaDevices.getUserMedia({
			video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
			audio: false,
		});
		video.srcObject = state.stream;
		await video.play();
	} catch (err) {
		statusText.textContent = 'camera blocked — check permissions';
		console.error(err);
		return;
	}

	startPane.style.display = 'none';
	document.getElementById('toggleLog').hidden = false;

	if (!state.model) {
		statusText.textContent = 'loading vision model…';
		state.model = await cocoSsd.load();
	}

	overlay.width = video.videoWidth;
	overlay.height = video.videoHeight;
	statusText.innerHTML = '<span class="dot">●</span> live — point at objects';
	state.running = true;
	detectLoop();
}

async function detectLoop() {
	if (!state.running || !state.model) return;
	try {
		state.predictions = await state.model.detect(video);
		draw();
		recordSeen(state.predictions);
	} catch (e) {
		console.error('detect failed', e);
	}
	requestAnimationFrame(detectLoop);
}

function draw() {
	ctx.clearRect(0, 0, overlay.width, overlay.height);
	for (const p of state.predictions) {
		if (p.score < 0.5) continue;
		const [x, y, w, h] = p.bbox;
		const target = word(p.class, state.lang);
		const base = word(p.class, BASE_LANG);

		// bounding box
		ctx.strokeStyle = 'rgba(10,242,194,0.9)';
		ctx.lineWidth = 2;
		ctx.strokeRect(x, y, w, h);

		// label chip (text is drawn un-mirrored by flipping locally, since the whole
		// canvas is CSS-mirrored to match the video)
		const padding = 8;
		ctx.font = 'bold 26px sans-serif';
		const tw = ctx.measureText(target).width;
		ctx.font = '15px sans-serif';
		const bw = ctx.measureText(base).width;
		const chipW = Math.max(tw, bw) + padding * 2;
		const chipH = 52;
		const chipX = x;
		const chipY = Math.max(0, y - chipH - 4);

		ctx.save();
		ctx.translate(chipX + chipW / 2, 0);
		ctx.scale(-1, 1); // un-mirror text so it reads correctly through the flipped canvas
		ctx.translate(-(chipX + chipW / 2), 0);

		ctx.fillStyle = 'rgba(6,12,20,0.82)';
		roundRect(ctx, chipX, chipY, chipW, chipH, 8);
		ctx.fill();
		ctx.fillStyle = '#0af2c2';
		ctx.font = 'bold 26px sans-serif';
		ctx.textBaseline = 'top';
		ctx.fillText(target, chipX + padding, chipY + 4);
		ctx.fillStyle = '#8aa0ab';
		ctx.font = '15px sans-serif';
		ctx.fillText(base, chipX + padding, chipY + 32);
		ctx.restore();
	}
}

function roundRect(c, x, y, w, h, r) {
	c.beginPath();
	c.moveTo(x + r, y);
	c.arcTo(x + w, y, x + w, y + h, r);
	c.arcTo(x + w, y + h, x, y + h, r);
	c.arcTo(x, y + h, x, y, r);
	c.arcTo(x, y, x + w, y, r);
	c.closePath();
}

function recordSeen(preds) {
	let changed = false;
	for (const p of preds) {
		if (p.score < 0.6) continue;
		if (!state.seen[p.class]) {
			state.seen[p.class] = 0;
			changed = true;
		}
		// throttle counting so a stationary object doesn't inflate the count every frame
		const now = Date.now();
		if (!recordSeen._last) recordSeen._last = {};
		if (now - (recordSeen._last[p.class] || 0) > 2000) {
			state.seen[p.class] += 1;
			recordSeen._last[p.class] = now;
			changed = true;
		}
	}
	if (changed) renderVocabLog();
}

function renderVocabLog() {
	const box = document.getElementById('vocabItems');
	box.innerHTML = '';
	const entries = Object.entries(state.seen).sort((a, b) => b[1] - a[1]);
	if (!entries.length) {
		box.innerHTML = '<p style="color:#8aa0ab;padding:12px;font-size:13px">Nothing yet — point the camera at things around you.</p>';
		return;
	}
	for (const [key, count] of entries) {
		const row = document.createElement('div');
		row.className = 'vocab-row';
		row.innerHTML =
			`<span><span class="target">${word(key, state.lang)}</span><br><span class="base">${word(key, BASE_LANG)}</span></span>` +
			`<span class="count">×${count}</span>`;
		row.addEventListener('click', () => speak(word(key, state.lang), state.lang));
		box.appendChild(row);
	}
}

// Tap a label on the video to hear its word. Clicks arrive in screen space; the canvas
// is CSS-mirrored, so flip x back into detection space before hit-testing boxes.
document.getElementById('look').addEventListener('click', (e) => {
	if (!state.predictions.length) return;
	const rect = overlay.getBoundingClientRect();
	const scaleX = overlay.width / rect.width;
	const scaleY = overlay.height / rect.height;
	let cx = (e.clientX - rect.left) * scaleX;
	const cy = (e.clientY - rect.top) * scaleY;
	cx = overlay.width - cx; // undo mirror
	for (const p of state.predictions) {
		const [x, y, w, h] = p.bbox;
		if (cx >= x && cx <= x + w && cy >= y - 56 && cy <= y + h) {
			speak(word(p.class, state.lang), state.lang);
			return;
		}
	}
});

document.getElementById('toggleLog').addEventListener('click', () => {
	document.getElementById('vocabLog').classList.toggle('open');
});

// ---------- Conversation deck ----------

function renderScenarios() {
	const grid = document.getElementById('scenarioGrid');
	grid.innerHTML = '';
	for (const [key, sc] of Object.entries(CONVERSATIONS)) {
		const card = document.createElement('div');
		card.className = 'scenario-card' + (key === state.scenario ? ' active' : '');
		card.innerHTML = `<div class="icon">${sc.icon}</div><div class="label">${sc.title}</div>`;
		card.addEventListener('click', () => {
			state.scenario = key;
			renderScenarios();
			renderExchanges();
		});
		grid.appendChild(card);
	}
	renderExchanges();
}

function renderExchanges() {
	const wrap = document.getElementById('exchanges');
	wrap.innerHTML = '';
	const sc = CONVERSATIONS[state.scenario];
	if (!sc) return;
	sc.exchanges.forEach((ex, ei) => {
		const block = document.createElement('div');
		block.className = 'exchange';

		const bubble = document.createElement('div');
		bubble.className = 'bubble';
		bubble.innerHTML =
			`<div class="target">${ex.prompt[state.lang]}</div>` +
			`<div class="base">${ex.prompt[BASE_LANG]}</div>` +
			`<span class="speak">🔊 hear it</span>`;
		bubble.querySelector('.speak').addEventListener('click', () => speak(ex.prompt[state.lang], state.lang));
		block.appendChild(bubble);

		const responses = document.createElement('div');
		responses.className = 'responses';
		ex.responses.forEach((r, ri) => {
			const id = `${state.scenario}:${ei}:${ri}`;
			const el = document.createElement('div');
			el.className = 'response' + (state.learned.has(id) ? ' learned' : '');
			el.innerHTML =
				`<div class="target">${r[state.lang]}</div>` +
				`<div class="base">${r[BASE_LANG]} <span class="tag">${state.learned.has(id) ? '· learned ✓' : '· tap to learn'}</span></div>`;
			el.addEventListener('click', () => {
				speak(r[state.lang], state.lang);
				state.learned.add(id);
				localStorage.setItem('ll_learned', JSON.stringify([...state.learned]));
				renderExchanges();
			});
			responses.appendChild(el);
		});
		block.appendChild(responses);
		wrap.appendChild(block);
	});
}

// ---------- wire up ----------

buildLangSelect();
document.querySelectorAll('#modeToggle button').forEach((b) => {
	b.addEventListener('click', () => setMode(b.dataset.mode));
});
document.getElementById('startCam').addEventListener('click', startCamera);
document.getElementById('goConv').addEventListener('click', () => setMode('conversation'));

// warm up speech voices (some browsers populate the list lazily)
if ('speechSynthesis' in window) window.speechSynthesis.getVoices();
