#!/usr/bin/env bash
# One-time setup of the Life OS mentor on a VPS. Safe to re-run: existing .env, memory and users are kept.
# If another web server owns ports 80/443 (Traefik, nginx-proxy, nginx), the mentor is connected to it automatically.
# Optional: WITH_NTFY=1 also sets up an ntfy push server; USE_OWN_PROXY=1 skips all proxy setup.
set -euo pipefail
cd "$(dirname "$0")"

say() { printf '\n\033[1m%s\033[0m\n' "$*"; }
die() { printf '\n\033[31mError: %s\033[0m\n' "$*" >&2; exit 1; }
ask() { local var=$1 prompt=$2 default=${3:-}; local value; read -r -e -p "$prompt${default:+ [$default]}: " value; printf -v "$var" '%s' "${value:-$default}"; }
ask_secret() { local var=$1 prompt=$2; local value; read -r -s -p "$prompt: " value; echo; printf -v "$var" '%s' "$value"; }
set_env() { # set_env KEY VALUE  (replace or append in .env)
	local key=$1 value=$2
	if grep -q "^${key}=" .env; then
		python3 - "$key" "$value" <<'PY'
import sys, pathlib
key, value = sys.argv[1], sys.argv[2]
p = pathlib.Path('.env')
lines = [f'{key}={value}' if line.startswith(f'{key}=') else line for line in p.read_text().splitlines()]
p.write_text('\n'.join(lines) + '\n')
PY
	else
		printf '%s=%s\n' "$key" "$value" >> .env
	fi
}
env_get() { grep -E "^$1=" .env | head -1 | cut -d= -f2-; }

command -v docker >/dev/null || die "Docker is not installed. See https://docs.docker.com/engine/install/"
docker compose version >/dev/null 2>&1 || die "Docker Compose v2 is missing (docker compose ...)."
command -v python3 >/dev/null || die "python3 is required for this installer."

if [[ ! -f .env ]]; then
	say "Life OS mentor setup"
	echo "You need one DNS A record pointing at this server's IP, e.g. mentor.yourdomain.com."
	ask OWNER "Your first name" "Micha"
	ask MENTOR_DOMAIN "Domain for the mentor app" "mentor.micharoessler.com"
	while :; do
		ask_secret PASS "Choose a login passphrase (min 8 chars)"
		ask_secret PASS2 "Repeat passphrase"
		[[ "$PASS" == "$PASS2" && ${#PASS} -ge 8 ]] && break
		echo "Passphrases differ or are too short, try again."
	done
	ask_secret API_KEY "Anthropic API key (sk-ant-...)"
	[[ -n "$API_KEY" ]] || die "An Anthropic API key is required."
	ask HC_URL "Optional healthchecks.io ping URL (Enter to skip)" ""

	cp .env.example .env
	chmod 600 .env
	set_env OWNER_NAME "$OWNER"
	set_env MENTOR_PASSPHRASE "$PASS"
	set_env SESSION_SECRET "$(python3 -c 'import secrets; print(secrets.token_hex(32))')"
	set_env ANTHROPIC_API_KEY "$API_KEY"
	set_env MENTOR_DOMAIN "$MENTOR_DOMAIN"
	set_env PUBLIC_URL "https://$MENTOR_DOMAIN"
	set_env HEALTHCHECK_PING_URL "$HC_URL"
else
	say "Using existing .env"
fi

if [[ ! -f seed_profile.json ]]; then
	say "Starter memory"
	echo "If you got a starter memory code (one long line starting with LOS1: or LL1:), paste it now. Enter skips."
	ask SEED_CODE "Starter memory code" ""
	if [[ -n "$SEED_CODE" ]]; then
		python3 - "$SEED_CODE" <<'PY' || die "That starter memory code is broken. Re-run ./install.sh and paste it again (Enter skips)."
import base64, gzip, json, sys, pathlib

def b64(code):
	code = ''.join(code.split())
	return base64.urlsafe_b64decode(code + '=' * (-len(code) % 4))

code = sys.argv[1].strip()
if code.startswith('LOS1:'):  # mentor starter memory: gzip'd list of {kind, text}
	items = json.loads(gzip.decompress(b64(code[5:])))
elif code.startswith('LL1:'):  # Life Ledger setup code: turn its profile into memory items
	p = json.loads(b64(code[4:])).get('profile') or {}
	lines = lambda v: [x.strip() for x in (v or '').splitlines() if x.strip() and not x.strip().startswith('(')]
	items = [{'kind': 'north_star', 'text': p['north']}] if p.get('north') else []
	items += [{'kind': 'value', 'text': v} for v in lines(p.get('values'))]
	items += [{'kind': 'project', 'text': p['season']}] if p.get('season') else []
	items += [{'kind': 'person', 'text': v} for v in lines(p.get('people'))]
	items += [{'kind': 'anti_goal', 'text': v} for v in lines(p.get('anti'))]
	items += [{'kind': 'coaching_pref', 'text': p['coach']}] if p.get('coach') else []
else:
	sys.exit('unknown code: it should start with LOS1: or LL1:')
assert isinstance(items, list) and items and all({'kind', 'text'} <= set(i) for i in items)
pathlib.Path('seed_profile.json').write_text(json.dumps(items, ensure_ascii=False, indent=2) + '\n')
print(f'Loaded {len(items)} memory items.')
PY
	else
		cp mentor/seed_profile.example.json seed_profile.json
		echo "Created seed_profile.json from the example. Edit it now if you like; the mentor will also interview you."
	fi
	chmod 644 seed_profile.json  # container user must read it; it never leaves this server
fi

PROFILES=()
PROXY_KIND=""
COMPOSE_FILES="docker-compose.yml"
if [[ "${USE_OWN_PROXY:-}" != "1" ]]; then
	if command -v ss >/dev/null && ss -ltnH '( sport = :80 or sport = :443 )' | grep -q . && ! docker compose ps --status running caddy 2>/dev/null | grep -q caddy; then
		say "Another web server already uses ports 80/443: connecting the mentor to it"
		PROXY_KIND=$(python3 proxy_setup.py prepare "$(env_get MENTOR_DOMAIN)" "$(env_get MENTOR_PORT)") || exit 1
		[[ -f docker-compose.proxy.yml ]] && COMPOSE_FILES="docker-compose.yml:docker-compose.proxy.yml"
	else
		PROFILES+=(caddy)
	fi
fi
set_env COMPOSE_FILE "$COMPOSE_FILES"

if [[ "${WITH_NTFY:-}" == "1" ]]; then
	if [[ -z "$(env_get PUSH_DOMAIN)" ]]; then
		ask PUSH_DOMAIN "Domain for ntfy push" "push.$(env_get MENTOR_DOMAIN | cut -d. -f2-)"
		set_env PUSH_DOMAIN "$PUSH_DOMAIN"
		set_env NTFY_PUBLIC_URL "https://$PUSH_DOMAIN"
		set_env NTFY_TOPIC "mentor-$(python3 -c 'import secrets; print(secrets.token_hex(6))')"
	fi
	printf '{$PUSH_DOMAIN} {\n\treverse_proxy ntfy:80\n}\n' > caddy-sites/ntfy.caddy
	PROFILES+=(ntfy)
fi
set_env COMPOSE_PROFILES "$(IFS=,; echo "${PROFILES[*]:-}")"

say "Building and starting containers"
docker compose up -d --build

if [[ "${WITH_NTFY:-}" == "1" ]]; then
	say "Configuring ntfy (user, topic access, publish token)"
	TOPIC=$(env_get NTFY_TOPIC)
	for _ in $(seq 1 30); do docker compose exec -T ntfy ntfy user list >/dev/null 2>&1 && break; sleep 1; done
	if ! docker compose exec -T ntfy ntfy user list 2>&1 | grep -q "user lifeos"; then
		NTFY_PASS=$(python3 -c 'import secrets; print(secrets.token_urlsafe(12))')
		docker compose exec -T -e NTFY_PASSWORD="$NTFY_PASS" ntfy ntfy user add --role=user lifeos >/dev/null
		NEW_NTFY_PASS=$NTFY_PASS
	fi
	docker compose exec -T ntfy ntfy access lifeos "$TOPIC" rw >/dev/null
	if [[ -z "$(env_get NTFY_TOKEN)" ]]; then
		TOKEN=$(docker compose exec -T ntfy ntfy token add lifeos 2>&1 | grep -oE 'tk_[A-Za-z0-9]+' | head -1)
		[[ -n "$TOKEN" ]] || die "Could not create ntfy token."
		set_env NTFY_TOKEN "$TOKEN"
		docker compose up -d mentor
	fi
fi

say "Waiting for the mentor to come up"
healthy() { python3 -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:$(env_get MENTOR_PORT)/healthz', timeout=5).status == 200 else 1)" 2>/dev/null; }
for _ in $(seq 1 60); do healthy && break; sleep 2; done
healthy || die "Mentor did not start. Check: docker compose logs mentor"
# web servers like Traefik only route to containers Docker reports as healthy
for _ in $(seq 1 30); do [[ "$(docker inspect -f '{{.State.Health.Status}}' "$(docker compose ps -q mentor)" 2>/dev/null)" == "healthy" ]] && break; sleep 2; done
[[ -n "$PROXY_KIND" ]] && python3 proxy_setup.py finish "$PROXY_KIND" "$(env_get MENTOR_DOMAIN)"

say "Done."
cat <<EOF

1. iPhone: open $(env_get PUBLIC_URL) in Safari, log in with your passphrase,
   then Share -> "Add to Home Screen". From now on open Mentor from the icon.
2. In the app: Settings -> Notifications -> "Turn on notifications" (you get a test push).
3. Siri: Settings -> "Talk to it with Siri" shows the 2-minute shortcut recipe.
4. Laptop: open the same URL in Chrome/Edge -> Install (address bar), turn on notifications there too.
EOF
if [[ "${WITH_NTFY:-}" == "1" ]]; then
	cat <<EOF
5. ntfy (optional extra): server $(env_get NTFY_PUBLIC_URL), user "lifeos"${NEW_NTFY_PASS:+, password: $NEW_NTFY_PASS (shown once)},
   topic: $(env_get NTFY_TOPIC)
EOF
fi
cat <<EOF

Health: curl -s $(env_get PUBLIC_URL)/healthz   Logs: docker compose logs -f mentor

EOF
