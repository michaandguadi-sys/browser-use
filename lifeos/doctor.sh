#!/usr/bin/env bash
# Checks every link between the internet and the mentor and says which one is broken. Prints no secrets.
cd "$(dirname "$0")"
env_get() { grep -E "^$1=" .env 2>/dev/null | head -1 | cut -d= -f2-; }
ok() { printf '\033[32m✔ %s\033[0m\n' "$*"; }
bad() { printf '\033[31m✘ %s\033[0m\n' "$*"; PROBLEMS=$((PROBLEMS + 1)); }
info() { printf '  %s\n' "$*"; }
PROBLEMS=0

[[ -f .env ]] || { bad "No .env here: run ./install.sh first (in $(pwd))"; exit 1; }
DOMAIN=$(env_get MENTOR_DOMAIN)
PORT=$(env_get MENTOR_PORT)
echo "Mentor doctor for $DOMAIN ($(date -u +%FT%TZ))"

echo; echo "1. DNS"
PUBLIC_IP=$(curl -s4 --max-time 5 https://api.ipify.org || true)
DNS_IP=$(getent ahostsv4 "$DOMAIN" | awk 'NR==1{print $1}')
info "this server: ${PUBLIC_IP:-unknown}   $DOMAIN -> ${DNS_IP:-nothing}"
if [[ -z "$DNS_IP" ]]; then
	bad "$DOMAIN has no A record yet. Add one: name 'mentor' -> ${PUBLIC_IP:-the IP of this server} where micharoessler.com's DNS is managed."
elif [[ -n "$PUBLIC_IP" && "$DNS_IP" != "$PUBLIC_IP" ]]; then
	bad "$DOMAIN points at $DNS_IP, but this server is $PUBLIC_IP. Change the A record to $PUBLIC_IP."
else
	ok "DNS points here"
fi

echo; echo "2. Mentor container"
for f in $(env_get COMPOSE_FILE | tr ':' ' '); do
	[[ -f "$f" ]] || bad "$f is missing (named in .env COMPOSE_FILE). Fix: ./install.sh"
done
docker compose ps --format '  {{.Service}}: {{.Status}}' 2>/dev/null
if python3 -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:$PORT/healthz', timeout=5).status == 200 else 1)" 2>/dev/null; then
	ok "mentor answers on 127.0.0.1:$PORT"
else
	bad "mentor does not answer on 127.0.0.1:$PORT"
	docker compose logs --tail 15 mentor 2>&1 | sed 's/^/  /'
fi

echo; echo "3. Web server on ports 80/443"
ss -ltnpH '( sport = :80 or sport = :443 )' 2>/dev/null | awk '{print "  " $4 "  " $6}'
docker ps --format '  {{.Names}}  {{.Image}}  {{.Ports}}' | grep -E ':(80|443)->' || true
if [[ -f docker-compose.proxy.yml ]]; then
	grep -q traefik docker-compose.proxy.yml && WIRING="Traefik labels (docker-compose.proxy.yml)" || WIRING="nginx-proxy env (docker-compose.proxy.yml)"
elif [[ -f /etc/nginx/sites-available/lifeos-mentor.conf || -f /etc/nginx/conf.d/lifeos-mentor.conf ]]; then
	WIRING="nginx site lifeos-mentor.conf"
else
	WIRING="bundled Caddy or none"
fi
info "proxy wiring: $WIRING"
info "COMPOSE_FILE=$(env_get COMPOSE_FILE)  COMPOSE_PROFILES=$(env_get COMPOSE_PROFILES)"
if [[ -f docker-compose.proxy.yml ]] && ! docker inspect "$(docker compose ps -q mentor)" -f '{{json .Config.Labels}}{{json .Config.Env}}' 2>/dev/null | grep -q "$DOMAIN"; then
	bad "the running mentor container lacks the proxy settings. Fix: docker compose up -d --force-recreate mentor"
fi

echo; echo "4. HTTPS through the web server (from this server)"
CODE=$(curl -sk --noproxy '*' -o /dev/null -w '%{http_code}' --max-time 10 --resolve "$DOMAIN:443:127.0.0.1" "https://$DOMAIN/healthz")
[[ "$CODE" == "200" ]] && ok "https://$DOMAIN/healthz -> 200 via the web server" || bad "https://$DOMAIN/healthz via the web server -> ${CODE:-no answer} (404 = the web server doesn't route this domain to the mentor)"
CERT=$(echo | timeout 10 openssl s_client -connect 127.0.0.1:443 -servername "$DOMAIN" 2>/dev/null | openssl x509 -noout -issuer -subject -enddate 2>/dev/null | tr '\n' ' ')
info "certificate: ${CERT:-none}"
if [[ "$CERT" == *"TRAEFIK DEFAULT"* || -z "$CERT" ]]; then
	bad "no real certificate yet (Let's Encrypt needs DNS pointing here first; then wait 1-2 minutes)"
fi

echo; echo "5. From the internet"
if [[ -n "$DNS_IP" ]]; then
	CODE=$(curl -s --noproxy '*' -o /dev/null -w '%{http_code}' --max-time 10 "https://$DOMAIN/healthz")
	if [[ "$CODE" == "200" ]]; then
		ok "https://$DOMAIN works from outside"
	elif [[ "$(curl -sk --noproxy '*' -o /dev/null -w '%{http_code}' --max-time 10 "https://$DOMAIN/healthz")" == "200" ]]; then
		bad "https://$DOMAIN is reachable, but browsers will refuse it until the certificate is issued (see 4)"
	else
		bad "https://$DOMAIN from outside -> ${CODE:-no answer}"
	fi
fi
if command -v ufw >/dev/null && ufw status 2>/dev/null | grep -q "Status: active"; then
	ufw status | grep -qE '(^| )(80|443)(/tcp)? +ALLOW|Nginx Full|WWW Full' && ok "firewall allows 80/443" || bad "firewall (ufw) may block 80/443. Fix: ufw allow 80,443/tcp"
fi
PROXY=$(docker ps --format '{{.Names}} {{.Image}}' | awk 'tolower($2) ~ /traefik/ {print $1; exit}')
if [[ -n "$PROXY" ]]; then
	echo; echo "Traefik log lines about $DOMAIN or errors:"
	docker logs --since 30m "$PROXY" 2>&1 | grep -iE "$DOMAIN|lifeos|error|level=error|ERR" | tail -8 | sed 's/^/  /'
fi

echo
[[ $PROBLEMS -eq 0 ]] && ok "All checks passed. Open https://$DOMAIN" || echo "$PROBLEMS problem(s) found. Fix the first ✘ above, or paste this whole output to Claude."
