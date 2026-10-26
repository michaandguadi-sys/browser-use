# Life OS — Mentor MVP

A proactive AI mentor that runs 24/7 on your own VPS. It knows your north star, values, projects and commitments, checks in now and then with one Socratic question, runs an evening reflection and a weekly review, and learns from your conversations. You use it as an installable web app on phone and laptop, and check-ins arrive as push notifications through ntfy.

```
phone / laptop (installed web app) ──HTTPS──► Caddy ──► mentor  (FastAPI + SQLite + scheduler + Claude)
ntfy app (push)                    ◄──HTTPS── Caddy ◄── ntfy    (self-hosted push, auth required)
```

## How it behaves

- **It asks before it tells.** On creative and career questions it asks for your own take first, gives task-level feedback, doesn't flatter, and points you toward real people (labs, funds, commissioners).
- **Timing comes from fixed rules first.** Proactive messages are blocked during quiet hours (21:30–08:00 by default, in your *current* timezone, which follows your device), focus mode, or pause. They're also capped at 3 per day with at least 3 hours between them, and never sent while you're mid-conversation. Only after these rules pass does Claude decide whether a check-in is actually worth it, and staying silent is a valid answer.
- **Rituals:** an evening reflection (20:30) and a weekly review (Sunday 18:00), each sent at most once per day or week.
- **Every check-in tells you why now.** "Good timing" / "Not now" feedback tunes timing only. It never teaches the mentor to agree with you.
- **Memory** is visible and editable in the Memory tab. The first check-ins ask about your values (onboarding).

## Install on your VPS (about 10 minutes)

Requirements: Docker with Compose v2, python3, and two DNS A records pointing at the VPS. Example: `mentor.micharoessler.com` and `push.micharoessler.com`.

```bash
git clone -b claude/wonderful-hypatia-e20n76 https://github.com/michaandguadi-sys/browser-use.git lifeos-src
cd lifeos-src/lifeos
./install.sh
```

The installer asks for your name, both domains, a login passphrase, your Anthropic API key, and an optional healthchecks.io ping URL. It writes `.env` (chmod 600), starts the stack with automatic HTTPS (Caddy), creates the ntfy user, topic access and publish token, and prints:

1. the app URL. On your phone, open it and choose **Add to Home Screen** (iOS) or **Install app** (Android). On your laptop, click **Install** in the address bar.
2. the ntfy server, username, password (shown once) and topic. Enter these in the ntfy app (iOS/Android/desktop).

If ports 80/443 are already used on the VPS (another proxy, OpenClaw, n8n…), run `USE_OWN_PROXY=1 ./install.sh`. Then point your proxy at `127.0.0.1:8787` (mentor) and `127.0.0.1:8788` (ntfy).

## Operate

| Task | Command |
|---|---|
| Logs | `docker compose logs -f mentor` |
| Health | `curl -s https://mentor.yourdomain/healthz` (returns 503 if the scheduler stalls) |
| Update | `git pull && docker compose --profile caddy up -d --build` |
| Backup | `docker run --rm -v lifeos_mentor-data:/d -v $PWD:/b alpine cp /d/mentor.db /b/mentor-backup.db` |
| Change model | set `MENTOR_MODEL` in `.env`, then `docker compose up -d mentor` |

**Dead-man switch:** create a free check at healthchecks.io (period 5 min, grace 15 min), put its ping URL in `HEALTHCHECK_PING_URL`, and have it alert you by email or SMS. If the mentor dies, you hear about it through a channel the mentor doesn't control.

## Security notes

- The mentor only talks. It has no tools, sends no email, and spends no money, so a prompt injection has nothing to act on.
- Login uses one passphrase with an HTTP-only session cookie (90 days) and a rate limit of 10 failed attempts per 15 minutes. Use a long passphrase.
- ntfy denies anonymous access. Only the `lifeos` user can read or write the topic. iOS push goes through the ntfy.sh relay, which only sees a message ID, not the content.
- The SQLite database lives in the `mentor-data` Docker volume on your VPS. Conversations are sent to the Anthropic API to generate replies.

## Develop

```bash
cd lifeos/mentor
uv venv && uv pip install -r requirements-dev.txt
.venv/bin/python -m pytest -q
```

## Known limits (MVP)

- On iOS, tapping a push opens Safari rather than the installed app.
- Text only: no voice notes yet.
- Single user. Guada would need her own instance or a later multi-user version.
- No offline sending: the app opens offline, but messages need a connection.
