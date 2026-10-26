#!/usr/bin/env bash
# One-time setup of the Life OS mentor on a VPS. Safe to re-run: existing .env and users are kept.
set -euo pipefail
cd "$(dirname "$0")"

say() { printf '\n\033[1m%s\033[0m\n' "$*"; }
die() { printf '\n\033[31mError: %s\033[0m\n' "$*" >&2; exit 1; }
ask() { local var=$1 prompt=$2 default=${3:-}; local value; read -r -p "$prompt${default:+ [$default]}: " value; printf -v "$var" '%s' "${value:-$default}"; }
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
	echo "You need two DNS A records pointing at this server's IP, e.g. mentor.yourdomain.com and push.yourdomain.com."
	ask OWNER "Your first name" "Micha"
	ask MENTOR_DOMAIN "Domain for the mentor app" "mentor.micharoessler.com"
	ask PUSH_DOMAIN "Domain for push notifications (ntfy)" "push.${MENTOR_DOMAIN#*.}"
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
	set_env PUSH_DOMAIN "$PUSH_DOMAIN"
	set_env PUBLIC_URL "https://$MENTOR_DOMAIN"
	set_env NTFY_PUBLIC_URL "https://$PUSH_DOMAIN"
	set_env NTFY_TOPIC "mentor-$(python3 -c 'import secrets; print(secrets.token_hex(6))')"
	set_env HEALTHCHECK_PING_URL "$HC_URL"
else
	say "Using existing .env"
fi

if [[ ! -f seed_profile.json ]]; then
	cp mentor/seed_profile.example.json seed_profile.json
	chmod 644 seed_profile.json  # container user must read it; it never leaves this server
	echo "Created seed_profile.json (private starter memory). Edit it now or later; it is loaded once on first start."
fi

PROFILE_ARGS=()
if [[ "${USE_OWN_PROXY:-}" != "1" ]]; then
	if command -v ss >/dev/null && ss -ltnH '( sport = :80 or sport = :443 )' | grep -q .; then
		echo "Ports 80/443 are already in use on this server (another web server or proxy)."
		echo "Re-run with USE_OWN_PROXY=1 ./install.sh and point your proxy at 127.0.0.1:$(env_get MENTOR_PORT) (mentor) and 127.0.0.1:$(env_get NTFY_PORT) (ntfy)."
		exit 1
	fi
	PROFILE_ARGS=(--profile caddy)
fi

say "Building and starting containers"
docker compose "${PROFILE_ARGS[@]}" up -d --build

say "Configuring push (ntfy user, topic access, publish token)"
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
	docker compose "${PROFILE_ARGS[@]}" up -d mentor
fi

say "Done."
cat <<EOF

1. Open $(env_get PUBLIC_URL) on your phone and laptop, log in with your passphrase.
   Phone: Share -> "Add to Home Screen" (iOS) / menu -> "Install app" (Android).
   Laptop: Chrome/Edge address bar -> "Install".
2. Install the ntfy app (iOS/Android/desktop), add server $(env_get NTFY_PUBLIC_URL),
   log in as user "lifeos"${NEW_NTFY_PASS:+ with password: $NEW_NTFY_PASS (save it now, shown once)},
   and subscribe to topic: $TOPIC
3. Health: curl -s $(env_get PUBLIC_URL)/healthz   Logs: docker compose logs -f mentor

EOF
