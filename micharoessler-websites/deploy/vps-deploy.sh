#!/usr/bin/env bash
# Deploy micharoessler.com (+ optionally formatschnitt.de) onto the VPS, behind the existing Traefik.
#
# Run from your Mac (same pattern as postiz-setup.sh):
#   ssh root@82.112.238.211 'bash -s' < vps-deploy.sh
# Re-run any time to update the sites to the latest commit.
#
# Optional overrides (prefix the bash call), e.g.
#   ssh root@82.112.238.211 'DOMAIN_B=formatschnitt.de bash -s' < vps-deploy.sh
#   TRAEFIK_NETWORK=…  CERT_RESOLVER=…  ENTRYPOINT=…  BRANCH=…
#
# What it does – and does not do:
#   + builds both static sites from GitHub inside a throwaway node container
#   + runs ONE new container "websites-nginx" with Traefik labels
#   - never stops, edits or restarts any other container (Mapae, Postiz, Traefik stay untouched)
#   - never touches DNS (you switch the A records at Namecheap yourself)
set -euo pipefail

REPO="${REPO:-https://github.com/michaandguadi-sys/browser-use.git}"
BRANCH="${BRANCH:-claude/focused-cray-8uqvci}"
BASE="${BASE:-/opt/websites}"
DOMAIN_A="${DOMAIN_A:-micharoessler.com}"
DOMAIN_B="${DOMAIN_B:-}" # set to formatschnitt.de once the domain is registered and points here
NGINX_IMAGE="nginx:1.27-alpine"
NODE_IMAGE="node:22-bookworm-slim"
NAME="websites-nginx"

log() { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }

command -v docker >/dev/null || die "docker not found"
command -v git >/dev/null || { log "Installing git"; apt-get update -qq && apt-get install -y -qq git >/dev/null; }

# ---------------------------------------------------------------- 1. detect Traefik settings
log "Detecting Traefik setup"
TRAEFIK_CT="$(docker ps --format '{{.Names}} {{.Image}}' | awk 'tolower($2) ~ /traefik/ {print $1; exit}')"
[ -n "$TRAEFIK_CT" ] || die "no running Traefik container found"

# All labels of all running containers (Mapae/Postiz already use Traefik – copy their conventions).
LABELS="$(docker ps -q | xargs -r docker inspect -f '{{range $k, $v := .Config.Labels}}{{$k}}={{$v}}{{"\n"}}{{end}}')"

nets_of() { docker inspect -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{"\n"}}{{end}}' "$1" 2>/dev/null; }
TRAEFIK_MODE="$(docker inspect -f '{{.HostConfig.NetworkMode}}' "$TRAEFIK_CT")"
if [ -z "${TRAEFIK_NETWORK:-}" ]; then
	# 1. a network other containers already route through (traefik.docker.network=…)
	TRAEFIK_NETWORK="$(printf '%s\n' "$LABELS" | sed -n 's/^traefik\.docker\.network=\(.*\)$/\1/p' | sort | uniq -c | sort -rn | awk 'NR==1{print $2}')"
fi
if [ -z "$TRAEFIK_NETWORK" ]; then
	# 2. a user-defined network Traefik is attached to
	TRAEFIK_NETWORK="$(nets_of "$TRAEFIK_CT" | grep -vE '^(bridge|host|none)?$' | head -n1 || true)"
fi
if [ -z "$TRAEFIK_NETWORK" ]; then
	# 3. Traefik runs with network_mode host or on the default bridge: it reaches containers on "bridge" by IP
	case "$TRAEFIK_MODE" in host | bridge | default) TRAEFIK_NETWORK=bridge ;; esac
	nets_of "$TRAEFIK_CT" | grep -qx bridge && TRAEFIK_NETWORK=bridge
fi
if [ -z "$TRAEFIK_NETWORK" ]; then
	echo "Traefik container: $TRAEFIK_CT  network mode: $TRAEFIK_MODE" >&2
	docker ps --format '{{.Names}}\t{{.Networks}}' >&2
	die "could not detect Traefik's docker network (re-run with TRAEFIK_NETWORK=<name from the list above>)"
fi
if [ -z "${CERT_RESOLVER:-}" ]; then
	CERT_RESOLVER="$(printf '%s\n' "$LABELS" | sed -n 's/.*tls\.certresolver=\([^[:space:]]*\).*/\1/p' | sort | uniq -c | sort -rn | awk 'NR==1{print $2}')"
fi
if [ -z "$CERT_RESOLVER" ]; then
	CERT_RESOLVER="$(docker inspect -f '{{join .Args " "}} {{join .Config.Cmd " "}}' "$TRAEFIK_CT" 2>/dev/null | grep -o 'certificatesresolvers\.[^.]*' | head -n1 | cut -d. -f2 || true)"
fi
[ -n "$CERT_RESOLVER" ] || die "could not detect the Let's Encrypt cert resolver (set CERT_RESOLVER=…)"

EPS="$(printf '%s\n' "$LABELS" | sed -n 's/.*\.entrypoints=\([^[:space:]]*\).*/\1/p' | tr ',' '\n' | sort -u)"
if [ -z "${ENTRYPOINT:-}" ]; then
	ENTRYPOINT="$(printf '%s\n' "$EPS" | grep -xE 'websecure|https|web-secure|secure' | head -n1 || true)"
	ENTRYPOINT="${ENTRYPOINT:-websecure}"
fi
WEB_EP="$(printf '%s\n' "$EPS" | grep -xE 'web|http' | head -n1 || true)"

echo "Traefik container : $TRAEFIK_CT"
echo "Docker network    : $TRAEFIK_NETWORK (Traefik mode: $TRAEFIK_MODE)"
echo "Cert resolver     : $CERT_RESOLVER"
echo "HTTPS entrypoint  : $ENTRYPOINT"
echo "HTTP entrypoint   : ${WEB_EP:-<none found – assuming Traefik redirects globally>}"

# ---------------------------------------------------------------- 2. fetch source
log "Fetching source ($BRANCH)"
mkdir -p "$BASE"
if [ -d "$BASE/src/.git" ]; then
	git -C "$BASE/src" fetch -q --depth 1 origin "$BRANCH"
	git -C "$BASE/src" reset -q --hard FETCH_HEAD
else
	git clone -q --depth 1 --branch "$BRANCH" --filter=blob:none --sparse "$REPO" "$BASE/src"
	git -C "$BASE/src" sparse-checkout set micharoessler-websites
fi
echo "Commit: $(git -C "$BASE/src" log -1 --format='%h %s')"

# ---------------------------------------------------------------- 3. build in a throwaway container
build() {
	local site="$1"
	log "Building $site"
	docker run --rm -v "$BASE/src/micharoessler-websites/sites/$site:/app" -w /app "$NODE_IMAGE" \
		sh -c 'npm ci --no-audit --no-fund --loglevel=error && npx astro build --silent' >/dev/null
	[ -f "$BASE/src/micharoessler-websites/sites/$site/dist/index.html" ] || die "$site build produced no index.html"
	# atomic swap so visitors never see a half-copied site
	rm -rf "$BASE/www/$site.new" && mkdir -p "$BASE/www"
	cp -a "$BASE/src/micharoessler-websites/sites/$site/dist" "$BASE/www/$site.new"
	rm -rf "$BASE/www/$site.old"
	[ -d "$BASE/www/$site" ] && mv "$BASE/www/$site" "$BASE/www/$site.old"
	mv "$BASE/www/$site.new" "$BASE/www/$site"
	rm -rf "$BASE/www/$site.old"
	echo "$site: $(find "$BASE/www/$site" -name '*.html' | wc -l) pages"
}
build adventure
build systems

# ---------------------------------------------------------------- 4. nginx config
log "Writing nginx config"
server_block() {
	local names="$1" root="$2"
	cat <<EOF
server {
	listen 80;
	server_name $names;
	root /srv/$root;
	index index.html;
	charset utf-8;

	add_header X-Content-Type-Options nosniff always;
	add_header Referrer-Policy strict-origin-when-cross-origin always;
	add_header X-Frame-Options SAMEORIGIN always;
	add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

	location /_astro/ {
		expires 1y;
		add_header Cache-Control "public, max-age=31536000, immutable";
		try_files \$uri =404;
	}
	location / {
		try_files \$uri \$uri/ \$uri.html =404;
	}
	error_page 404 /404.html;
}
EOF
}
{
	echo "gzip on; gzip_comp_level 6; gzip_min_length 512;"
	echo "gzip_types text/css application/javascript image/svg+xml application/json application/xml text/xml;"
	echo "server_tokens off;"
	server_block "$DOMAIN_A www.$DOMAIN_A" adventure
	[ -n "$DOMAIN_B" ] && server_block "$DOMAIN_B www.$DOMAIN_B" systems
	# anything else (IP access, unknown hosts) -> 404 instead of leaking a site
	printf 'server {\n\tlisten 80 default_server;\n\treturn 404;\n}\n'
} >"$BASE/nginx.conf"

# ---------------------------------------------------------------- 5. (re)create the web container
log "Starting $NAME"
# One router per host, so every host gets its own certificate: a missing www record
# can never break HTTPS on the main domain.
LABEL_ARGS=(
	--label "traefik.enable=true"
	--label "traefik.docker.network=$TRAEFIK_NETWORK"
	--label "traefik.http.services.websites.loadbalancer.server.port=80"
	--label "traefik.http.middlewares.websites-www.redirectregex.regex=^https?://www\\.(.+)"
	--label "traefik.http.middlewares.websites-www.redirectregex.replacement=https://\${1}"
	--label "traefik.http.middlewares.websites-www.redirectregex.permanent=true"
	--label "traefik.http.middlewares.websites-https.redirectscheme.scheme=https"
	--label "traefik.http.middlewares.websites-https.redirectscheme.permanent=true"
)
add_host() {
	local id="$1" host="$2" mw="${3:-}"
	LABEL_ARGS+=(
		--label "traefik.http.routers.$id.rule=Host(\`$host\`)"
		--label "traefik.http.routers.$id.entrypoints=$ENTRYPOINT"
		--label "traefik.http.routers.$id.tls=true"
		--label "traefik.http.routers.$id.tls.certresolver=$CERT_RESOLVER"
		--label "traefik.http.routers.$id.service=websites"
	)
	[ -n "$mw" ] && LABEL_ARGS+=(--label "traefik.http.routers.$id.middlewares=$mw")
	if [ -n "$WEB_EP" ]; then
		LABEL_ARGS+=(
			--label "traefik.http.routers.$id-http.rule=Host(\`$host\`)"
			--label "traefik.http.routers.$id-http.entrypoints=$WEB_EP"
			--label "traefik.http.routers.$id-http.middlewares=websites-https"
			--label "traefik.http.routers.$id-http.service=websites"
		)
	fi
	return 0
}
add_host site-a "$DOMAIN_A"
add_host site-a-www "www.$DOMAIN_A" websites-www
if [ -n "$DOMAIN_B" ]; then
	add_host site-b "$DOMAIN_B"
	add_host site-b-www "www.$DOMAIN_B" websites-www
fi

docker rm -f "$NAME" >/dev/null 2>&1 || true
docker run -d --name "$NAME" --restart unless-stopped \
	--network "$TRAEFIK_NETWORK" \
	--memory 128m \
	-v "$BASE/www:/srv:ro" \
	-v "$BASE/nginx.conf:/etc/nginx/conf.d/default.conf:ro" \
	"${LABEL_ARGS[@]}" \
	"$NGINX_IMAGE" >/dev/null

# ---------------------------------------------------------------- 6. self-test
log "Self-test (inside the container, before DNS)"
sleep 2
check() {
	local host="$1" path="$2"
	local code
	code="$(docker exec "$NAME" wget -q -S -O /dev/null --header "Host: $host" "http://127.0.0.1$path" 2>&1 | grep -o 'HTTP/[0-9.]* [0-9]*' | tail -n1 | awk '{print $2}' || true)"
	printf '  %-28s %-22s %s\n' "$host" "$path" "${code:-ERR}"
}
check "$DOMAIN_A" /
check "$DOMAIN_A" /de/
check "$DOMAIN_A" /work/bolivia-andes/
check "$DOMAIN_A" /does-not-exist/   # expect 404
[ -n "$DOMAIN_B" ] && check "$DOMAIN_B" /

log "DNS status"
SERVER_IP="$(curl -fsS -4 https://ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')"
for h in "$DOMAIN_A" "www.$DOMAIN_A"; do
	printf '  %-24s -> %s\n' "$h" "$(getent ahostsv4 "$h" | awk 'NR==1{print $1}')"
done
echo "  this server               -> $SERVER_IP"
cat <<EOF

Done. Next (only once): at Namecheap → Domain List → $DOMAIN_A → Advanced DNS:
  • delete the old A / CNAME records for @ and www (Adobe Portfolio, 151.101.x.119)
  • add  A Record      @    $SERVER_IP   (TTL 5 min)
  • add  CNAME Record  www  $DOMAIN_A.
  • leave all MX records (Google Workspace) exactly as they are
Traefik fetches the HTTPS certificate automatically once DNS points here (usually 5–30 min).
Watch it with:  docker logs -f $TRAEFIK_CT 2>&1 | grep -i $DOMAIN_A
Update the sites later: just run this script again.
EOF
