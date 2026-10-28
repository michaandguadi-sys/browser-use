# Life OS — Mentor MVP

A proactive AI mentor that runs 24/7 on your own VPS. It knows your north star, values, projects and commitments, checks in now and then with one Socratic question, runs an evening reflection and a weekly review, and learns from your conversations. You use it as an installable web app on phone and laptop. Check-ins arrive as notifications from the Mentor app itself (Web Push), and you can talk to it through Siri.

```
phone / laptop (installed web app) ──HTTPS──► Caddy ──► mentor  (FastAPI + SQLite + scheduler + Claude)
            ▲  Web Push (VAPID, end-to-end encrypted payload) ◄─┘
Siri ("Hey Siri, Mentor") ── iOS Shortcut ──POST /api/voice──►  (spoken reply)
```

## How it behaves

- **It asks before it tells.** On creative and career questions it asks for your own take first, gives task-level feedback, doesn't flatter, and points you toward real people (labs, funds, commissioners).
- **Timing comes from fixed rules first.** Proactive messages are blocked during quiet hours (21:30–08:00 by default, in your *current* timezone, which follows your device), focus mode, or pause. They're also capped at 3 per day with at least 3 hours between them, and never sent while you're mid-conversation. Only after these rules pass does Claude decide whether a check-in is actually worth it, and staying silent is a valid answer.
- **Rituals:** an evening reflection (20:30) and a weekly review (Sunday 18:00), each sent at most once per day or week.
- **Every check-in tells you why now.** "Good timing" / "Not now" feedback tunes timing only. It never teaches the mentor to agree with you.
- **Memory** is visible and editable in the Memory tab.
- **Profile interview** (Memory tab): about 15 minutes, one question at a time. It covers 7 topics (north star, values, anti-goals, 90-day goals, strengths, blind spots, how you want to be coached) and shows how many are known.
- **Coaching with evidence** (Progress tab): you set leading indicators with weekly targets. The defaults are 5 h/week on your own documentary project and 1 doc-industry contact per week. Log progress with one tap, or just say it in chat ("spent 2 hours on the film") and it's logged automatically. A deterministic weekly scorecard tracks indicators vs pace, commitments kept, energy and check-in usefulness. The mentor sees it, names gaps with the numbers, and the Sunday review is built on it.
- **Today strip:** a one-tap energy rating (1–5), plus commitments that are due, with Done / Not yet buttons. Low energy shifts the mentor toward care, or toward staying quiet.
- **Notifications from the app itself:** Settings → Notifications → "Turn on notifications". On iPhone this needs iOS 16.4+ and the app opened from the home screen icon. Tapping a notification opens the app on that message. The VAPID key is created on first start and kept in the data volume.
- **Siri:** Settings → "Talk to it with Siri" shows a 2-minute Shortcuts recipe (Dictate Text → Get Contents of URL → Speak Text) with your URL and token. Say "Hey Siri, Mentor", talk, and Siri reads a short answer. The exchange lands in Talk, and memory and indicators update in the background.
- **Voice input in the app:** the mic button uses the browser's speech recognition where available. Keyboard dictation works everywhere.

## How it gets better over time

The raw history (every message, check-in, reply, log, energy rating, correction) is the source of truth and is never thrown away. Everything the mentor "knows" about how you tick is **derived** from it, versioned, and can be rebuilt at any time, so both more data and a better model make it sharper (Sutton's "bitter lesson" applied to one person).

- **Person model (You tab):** every night (04:00–07:00 local) the mentor rebuilds a picture of you from the full history: Big Five estimates with confidence and evidence, ranked Schwartz values, the state of your three self-determination needs (autonomy, competence, relatedness), recurring patterns with what it will do about them, coaching style, what backfires, and what it still doesn't know. It goes into every conversation as a hypothesis, never a label. "Not me" on any claim stores a correction that every later rebuild must respect. Each build records the model and the amount of data it used, so you can see the picture sharpen.
- **Timing learner:** each proactive message is a small experiment, as in micro-randomized trials. Replies within 90 minutes (or "good timing") update a Beta posterior per weekday/weekend × 2-hour slot, bucketed by the local time where you were at that moment (travel doesn't scramble it). Thompson sampling keeps exploring under-tested slots and skips slots where you rarely answer.
- **Coaching moves:** every check-in uses one of ten evidence-based moves (if-then plans, wish-obstacle-plan, number checks, Socratic questions, values reconnect, reflection, wellbeing check, who-could-help, devil's advocate, celebrating progress). Per-person reply rates choose the suggested move by Thompson sampling. Moves are judged on real replies only, never on ratings, because optimizing for approval breeds flattery.
- **Re-entry:** after 3+ silent days (expeditions, rough patches) the mentor makes coming back easy instead of listing what you missed.

## Demo mentor (fictional person)

`DEMO=1 ./install.sh` in a **separate clone** sets up a second mentor with its own port (8789), data volume and domain, loaded with Noa: a fictional nomadic documentary photographer with 90 days of history. The history is simulated against a hidden "truth" (she answers mornings, ignores midday, responds to if-then plans, not to praise), and the mentor's real learning code runs over it day by day, so the You tab shows the algorithm actually converging. Your real mentor's memory is untouched.

```bash
git clone -b claude/wonderful-hypatia-e20n76 https://github.com/michaandguadi-sys/browser-use.git ~/lifeos-demo-src
cd ~/lifeos-demo-src/lifeos && DEMO=1 ./install.sh && ./doctor.sh
```

## Install on your VPS (about 10 minutes)

Requirements: Docker with Compose v2, python3, and one DNS A record pointing at the VPS, e.g. `mentor.micharoessler.com`.

```bash
git clone -b claude/wonderful-hypatia-e20n76 https://github.com/michaandguadi-sys/browser-use.git lifeos-src
cd lifeos-src/lifeos
./install.sh
```

The installer asks for your name, the domain, a login passphrase, your Anthropic API key, an optional healthchecks.io ping URL and an optional starter memory code (`LOS1:…`, one line). It writes `.env` and a private `seed_profile.json` (never committed), starts the stack with automatic HTTPS (Caddy), waits until the mentor is healthy, and prints the next steps:

1. iPhone: open the URL in Safari, log in, Share → **Add to Home Screen**, then always open Mentor from the icon.
2. In the app: Settings → Notifications → **Turn on notifications** (a test push arrives).
3. Settings → **Talk to it with Siri** for the shortcut recipe.

Optional extra push channel: `WITH_NTFY=1 ./install.sh` also runs a self-hosted ntfy server on a second domain.

If another web server already owns ports 80/443, the installer connects the mentor to it: Traefik (e.g. Hostinger's n8n/OpenClaw templates) through Docker labels, nginx-proxy through `VIRTUAL_HOST`, or nginx on the host through a new site plus a certbot certificate. For anything else it prints what is running and stops. `USE_OWN_PROXY=1 ./install.sh` skips all of this; then point your own proxy at `127.0.0.1:8787` (and `127.0.0.1:8788` for ntfy if you enabled it).

## Operate

| Task | Command |
|---|---|
| Logs | `docker compose logs -f mentor` |
| Health | `curl -s https://mentor.yourdomain/healthz` (returns 503 if the scheduler stalls) |
| Update | `git pull && docker compose up -d --build` (profiles come from `COMPOSE_PROFILES` in `.env`) |
| Backup | `docker run --rm -v lifeos_mentor-data:/d -v $PWD:/b alpine cp /d/mentor.db /b/mentor-backup.db` |
| Change model | set `MENTOR_MODEL` in `.env`, then `docker compose up -d mentor` |

**Dead-man switch:** create a free check at healthchecks.io (period 5 min, grace 15 min), put its ping URL in `HEALTHCHECK_PING_URL`, and have it alert you by email or SMS. If the mentor dies, you hear about it through a channel the mentor doesn't control.

## Security notes

- The mentor only talks. It has no tools, sends no email, and spends no money, so a prompt injection has nothing to act on.
- Login uses one passphrase with an HTTP-only session cookie (90 days) and a rate limit of 10 failed attempts per 15 minutes. Use a long passphrase.
- Web Push payloads are encrypted end to end (RFC 8291) for each device. Apple/Google push services only relay ciphertext.
- The Siri token is a 43-character random secret, checked in constant time, with the same failure rate limit as login. Rotate it in Settings if it leaks.
- Optional ntfy denies anonymous access. Only the `lifeos` user can read or write the topic.
- The SQLite database lives in the `mentor-data` Docker volume on your VPS. Conversations are sent to the Anthropic API to generate replies.

## Develop

```bash
cd lifeos/mentor
uv venv && uv pip install -r requirements-dev.txt
.venv/bin/python -m pytest -q
```

## Known limits (MVP)

- Voice goes through Siri dictation (or keyboard dictation). Audio files are not stored or transcribed on the server.
- Single user. Guada would need her own instance or a later multi-user version.
- No offline sending: the app opens offline, but messages need a connection.
