#!/usr/bin/env bash
# Deploy micharoessler.com (+ optionally formatschnitt.de) onto the VPS, behind the existing Traefik.
#
# Run from your Mac (same pattern as postiz-setup.sh):
#   ssh root@82.112.238.211 'bash -s' < vps-deploy.sh
# Re-run any time to update the sites to the latest commit.
#
# Optional overrides (prefix the bash call), e.g.
#   ssh root@82.112.238.211 'DOMAIN_B=formatschnitt.de bash -s' < vps-deploy.sh
#   AUTO_UPDATE=1   installs a cron job that redeploys within 10 min of every new commit
#   TRAEFIK_NETWORK=…  CERT_RESOLVER=…  ENTRYPOINT=…  BRANCH=…
# Settings are remembered in $BASE/deploy.env (edit it to remove one), so later runs need no prefixes.
#
# What it does – and does not do:
#   + builds both static sites from GitHub inside a throwaway node container
#   + runs ONE new container "websites-nginx" with Traefik labels
#   - never stops, edits or restarts any other container (Mapae, Postiz, Traefik stay untouched)
#   - never touches DNS (you switch the A records at Namecheap yourself)
set -euo pipefail

BASE="${BASE:-/opt/websites}"
# settings from the previous run; variables given on the command line win
if [ -f "$BASE/deploy.env" ]; then
	while IFS='=' read -r k v; do
		if [ -n "$k" ] && [ -z "${!k:-}" ]; then export "$k=$v"; fi
	done <"$BASE/deploy.env"
fi
REPO="${REPO:-https://github.com/michaandguadi-sys/browser-use.git}"
RAW="${RAW:-https://raw.githubusercontent.com/michaandguadi-sys/browser-use}"
BRANCH="${BRANCH:-claude/focused-cray-8uqvci}"
DOMAIN_A="${DOMAIN_A:-micharoessler.com}"
DOMAIN_B="${DOMAIN_B:-}" # set to formatschnitt.de once the domain is registered and points here
AUTO_UPDATE="${AUTO_UPDATE:-0}"
NGINX_IMAGE="nginx:1.27-alpine"
NODE_IMAGE="node:22-bookworm-slim"
NAME="websites-nginx"

# apex domains (example.com) also get www.; subdomains (preview.example.com) don't
hosts_for() { case "$1" in *.*.*) echo "$1" ;; *) echo "$1 www.$1" ;; esac; }
CANONICAL_B="formatschnitt.de" # site B's canonical URLs point here; any other host is a noindex preview

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
	local names="$1" root="$2" extra="${3:-}"
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
$extra

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
	server_block "$(hosts_for "$DOMAIN_A")" adventure
	if [ -n "$DOMAIN_B" ]; then
		noindex=""
		[ "$DOMAIN_B" = "$CANONICAL_B" ] || noindex='	add_header X-Robots-Tag "noindex" always;'
		server_block "$(hosts_for "$DOMAIN_B")" systems "$noindex"
	fi
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
[ "$(hosts_for "$DOMAIN_A")" = "$DOMAIN_A" ] || add_host site-a-www "www.$DOMAIN_A" websites-www
if [ -n "$DOMAIN_B" ]; then
	add_host site-b "$DOMAIN_B"
	[ "$(hosts_for "$DOMAIN_B")" = "$DOMAIN_B" ] || add_host site-b-www "www.$DOMAIN_B" websites-www
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

# ---------------------------------------------------------------- 7. remember settings, optional auto-update
printf '%s\n' "REPO=$REPO" "RAW=$RAW" "BRANCH=$BRANCH" "DOMAIN_A=$DOMAIN_A" "DOMAIN_B=$DOMAIN_B" "AUTO_UPDATE=$AUTO_UPDATE" >"$BASE/deploy.env"
if [ "$AUTO_UPDATE" = 1 ]; then
	log "Auto-update: checking GitHub every 10 minutes"
	cat >"$BASE/auto-update.sh" <<'EOS'
#!/usr/bin/env bash
# Redeploys the websites when the branch has a new commit (installed by vps-deploy.sh).
set -euo pipefail
. /opt/websites/deploy.env
remote="$(git ls-remote "$REPO" "refs/heads/$BRANCH" | cut -f1)"
current="$(git -C /opt/websites/src rev-parse HEAD 2>/dev/null || true)"
[ -n "$remote" ] && [ "$remote" != "$current" ] || exit 0
echo "$(date -u '+%F %T') deploying $remote"
curl -fsSL "$RAW/$remote/micharoessler-websites/deploy/vps-deploy.sh" | bash
EOS
	chmod +x "$BASE/auto-update.sh"
	echo "*/10 * * * * root flock -n /run/websites-deploy.lock $BASE/auto-update.sh >>/var/log/websites-deploy.log 2>&1" >/etc/cron.d/websites-deploy
	command -v cron >/dev/null || command -v crond >/dev/null || echo "  warning: no cron daemon found – auto-update will not run"
	echo "  log: tail -f /var/log/websites-deploy.log   ·   turn off: rm /etc/cron.d/websites-deploy"
fi

log "DNS status"
SERVER_IP="$(curl -fsS -4 https://ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')"
echo "  this server               -> $SERVER_IP"
dns_todo=""
for d in "$DOMAIN_A" ${DOMAIN_B:+"$DOMAIN_B"}; do
	for h in $(hosts_for "$d"); do
		ip="$(getent ahostsv4 "$h" | awk 'NR==1{print $1}' || true)"
		printf '  %-24s -> %s\n' "$h" "${ip:-<no record>}"
		[ "$ip" = "$SERVER_IP" ] || dns_todo="$dns_todo $d"
	done
done
if [ -z "$dns_todo" ]; then
	echo
	echo "Done – all domains point here. Traefik renews HTTPS certificates automatically."
	exit 0
fi
for d in $(printf '%s\n' $dns_todo | sort -u); do
	echo
	if [ "$(hosts_for "$d")" = "$d" ]; then
		cat <<EOF
DNS for $d does not point here yet. In the DNS of ${d#*.}:
  • add  A Record  ${d%%.*}  $SERVER_IP   (TTL 5 min)
EOF
	else
		cat <<EOF
DNS for $d does not point here yet. At the registrar → $d → DNS records:
  • delete old A / CNAME records for @ and www
  • add  A Record      @    $SERVER_IP   (TTL 5 min)
  • add  CNAME Record  www  $d.
  • leave all MX (mail) records exactly as they are
EOF
	fi
	echo "Then run this script once more: Traefik only requests the HTTPS certificate"
	echo "after DNS points here, and a failed attempt is not retried by itself."
done
