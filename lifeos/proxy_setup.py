#!/usr/bin/env python3
"""Hook the mentor into a web server that already owns ports 80/443 on this VPS.

Called by install.sh. Detects Traefik, nginx-proxy (jwilder/acme-companion) or nginx on the host and wires
mentor.<domain> to the mentor container with HTTPS. Anything else: prints what is running and exits 2.

  proxy_setup.py prepare DOMAIN PORT   -> prints the proxy kind; may write docker-compose.proxy.yml or an nginx site
  proxy_setup.py finish KIND DOMAIN    -> after the mentor is up: certificate (host nginx) and a routing check
"""

import json
import re
import shutil
import socket
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
OVERRIDE = HERE / 'docker-compose.proxy.yml'
NGINX_SITE = 'lifeos-mentor.conf'


def run(*cmd: str, check: bool = False) -> str:
	res = subprocess.run(cmd, capture_output=True, text=True)
	if check and res.returncode != 0:
		raise SystemExit(f'{" ".join(cmd)} failed:\n{res.stderr.strip()}')
	return res.stdout


def say(text: str) -> None:
	print(text, file=sys.stderr)


def listeners() -> str:
	return run('ss', '-ltnpH', '( sport = :80 or sport = :443 )') if shutil.which('ss') else ''


def containers() -> list[dict]:
	if not shutil.which('docker'):
		return []
	ids = run('docker', 'ps', '-q').split()
	return json.loads(run('docker', 'inspect', *ids)) if ids else []


def publishes_web(c: dict) -> bool:
	if c['HostConfig'].get('NetworkMode') == 'host':
		return True
	ports = c['NetworkSettings'].get('Ports') or {}
	return any(binding and any(b.get('HostPort') in ('80', '443') for b in binding) for binding in ports.values())


def pick_network(c: dict) -> str | None:
	if c['HostConfig'].get('NetworkMode') == 'host':
		return None  # Traefik on the host network reaches container IPs directly
	nets = list((c['NetworkSettings'].get('Networks') or {}).keys())
	named = [n for n in nets if n not in ('bridge', 'host', 'none')]
	return (named or nets or [None])[0]


def compose_override(network: str | None, labels: dict[str, str] | None = None, env: dict[str, str] | None = None) -> None:
	lines = [
		'# Written by install.sh (proxy_setup.py): connects the mentor to the web server already on this VPS.',
		'services:',
		'  mentor:',
	]
	if env:
		lines.append('    environment:')
		lines += [f'      {k}: "{v}"' for k, v in env.items()]
	if labels:
		lines.append('    labels:')
		lines += [f'      {k}: "{v}"' for k, v in labels.items()]
	if network == 'bridge':
		lines.append('    network_mode: bridge')
	elif network:
		lines += [
			'    networks:',
			'      - default',
			'      - webproxy',
			'networks:',
			'  webproxy:',
			'    external: true',
			f'    name: {network}',
		]
	OVERRIDE.write_text('\n'.join(lines) + '\n')


# --- Traefik -------------------------------------------------------------------


def traefik_static_config(c: dict) -> str:
	"""Args plus any mounted traefik.yml/toml, as one searchable text."""
	text = '\n'.join((c.get('Args') or []) + (c['Config'].get('Cmd') or []))
	for m in c.get('Mounts') or []:
		dest = m.get('Destination', '')
		if re.search(r'traefik\.(ya?ml|toml)$', dest):
			text += '\n' + run('docker', 'exec', c['Id'], 'cat', dest)
		elif dest.rstrip('/') in ('/etc/traefik', '/traefik'):
			for name in ('traefik.yml', 'traefik.yaml', 'traefik.toml'):
				text += '\n' + run('docker', 'exec', c['Id'], 'cat', f'{dest.rstrip("/")}/{name}')
	for e in c['Config'].get('Env') or []:  # TRAEFIK_ENTRYPOINTS_WEBSECURE_ADDRESS=:443 style
		text += '\n' + e
	return text


def traefik_settings(text: str) -> tuple[str | None, str | None, str | None, bool]:
	flags = re.findall(r'--entrypoints\.([\w-]+)\.address=\S*:(\d+)', text, re.I)
	flags += re.findall(r'TRAEFIK_ENTRYPOINTS_([A-Z0-9_]+)_ADDRESS=\S*:(\d+)', text)
	flags += re.findall(r'^\s*([\w-]+):\s*\n\s+address:\s*["\']?[^"\'\n]*:(\d+)', text, re.M)
	by_port = {port: name.lower() if name.isupper() else name for name, port in flags}
	resolver = re.search(r'--certificatesresolvers\.([\w-]+)\.', text, re.I) or re.search(
		r'TRAEFIK_CERTIFICATESRESOLVERS_([A-Z0-9_]+?)_', text
	)
	if not resolver:
		resolver = re.search(r'certificatesResolvers:\s*\n\s+([\w-]+):', text) or re.search(
			r'\[certificatesResolvers\.([\w-]+)', text
		)
	name = resolver.group(1) if resolver else None
	if name and name.isupper():
		name = name.lower()
	docker_provider = bool(
		re.search(
			r'--providers\.docker|TRAEFIK_PROVIDERS_DOCKER|providers:\s*\n(\s+.*\n)*?\s+docker:|\[providers\.docker\]', text, re.I
		)
	)
	return by_port.get('443'), by_port.get('80'), name, docker_provider


def setup_traefik(c: dict, domain: str) -> str:
	websecure, web, resolver, docker_provider = traefik_settings(traefik_static_config(c))
	if not docker_provider or not websecure:
		diagnose(f'Traefik ({c["Name"].lstrip("/")}) runs here, but I could not find its Docker provider or its :443 entrypoint.')
	if not resolver:
		diagnose(f'Traefik ({c["Name"].lstrip("/")}) has no Let’s Encrypt certificate resolver configured.')
	router = 'lifeos-' + re.sub(r'[^a-z0-9]+', '-', domain.lower()).strip('-')  # one router per domain: main and demo can coexist
	labels = {
		'traefik.enable': 'true',
		f'traefik.http.routers.{router}.rule': f'Host(`{domain}`)',
		f'traefik.http.routers.{router}.entrypoints': websecure,
		f'traefik.http.routers.{router}.tls': 'true',
		f'traefik.http.routers.{router}.tls.certresolver': resolver,
		f'traefik.http.services.{router}.loadbalancer.server.port': '8000',
	}
	if web:
		labels |= {
			f'traefik.http.routers.{router}-http.rule': f'Host(`{domain}`)',
			f'traefik.http.routers.{router}-http.entrypoints': web,
			f'traefik.http.routers.{router}-http.middlewares': f'{router}-https',
			f'traefik.http.middlewares.{router}-https.redirectscheme.scheme': 'https',
		}
	network = pick_network(c)
	if network and network != 'bridge':
		labels['traefik.docker.network'] = network
	compose_override(network, labels=labels)
	say(
		f'Found Traefik ({c["Name"].lstrip("/")}): routing {domain} → mentor (entrypoint {websecure}, certificates via {resolver}).'
	)
	return 'traefik'


# --- nginx-proxy (jwilder / nginxproxy + acme-companion) -------------------------


def setup_nginx_proxy(c: dict, domain: str) -> str:
	compose_override(pick_network(c), env={'VIRTUAL_HOST': domain, 'VIRTUAL_PORT': '8000', 'LETSENCRYPT_HOST': domain})
	say(f'Found nginx-proxy ({c["Name"].lstrip("/")}): routing {domain} → mentor.')
	return 'nginx-proxy'


# --- nginx on the host -------------------------------------------------------


def setup_host_nginx(domain: str, port: str) -> str:
	sites = Path('/etc/nginx/sites-available')
	target = sites / NGINX_SITE if sites.is_dir() else Path('/etc/nginx/conf.d') / NGINX_SITE
	if target.exists() and domain in target.read_text():
		say(f'nginx already has {target}; keeping it.')
		return 'nginx'
	target.write_text(f"""# Written by lifeos install.sh: {domain} -> mentor on 127.0.0.1:{port}
server {{
	listen 80;
	listen [::]:80;
	server_name {domain};
	client_max_body_size 20m;
	location / {{
		proxy_pass http://127.0.0.1:{port};
		proxy_http_version 1.1;
		proxy_set_header Host $host;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header X-Forwarded-Proto $scheme;
		proxy_read_timeout 180s;
	}}
}}
""")
	link = Path('/etc/nginx/sites-enabled') / NGINX_SITE
	if sites.is_dir() and not link.exists():
		link.symlink_to(target)
	test = subprocess.run(['nginx', '-t'], capture_output=True, text=True)
	if test.returncode != 0:
		link.unlink(missing_ok=True)
		target.unlink(missing_ok=True)
		raise SystemExit(f'nginx rejected the new site, so I removed it again:\n{test.stderr.strip()}')
	run('systemctl', 'reload', 'nginx', check=True)
	say(f'Found nginx on the host: added {target} for {domain}.')
	return 'nginx'


def nginx_certificate(domain: str) -> None:
	if not shutil.which('certbot'):
		say('Installing certbot for the HTTPS certificate…')
		run('apt-get', 'update', '-qq')
		run('apt-get', 'install', '-y', '-qq', 'certbot', 'python3-certbot-nginx', check=True)
	res = subprocess.run(
		[
			'certbot',
			'--nginx',
			'-d',
			domain,
			'--non-interactive',
			'--agree-tos',
			'--register-unsafely-without-email',
			'--redirect',
		],
		capture_output=True,
		text=True,
	)
	if res.returncode != 0:
		say(
			f'Could not get a certificate yet (usually DNS not pointing here yet). Re-run ./install.sh once DNS works.\n{res.stderr.strip()[-600:]}'
		)
	else:
		say(f'HTTPS certificate installed for {domain}.')


# --- detection ------------------------------------------------------------------


def diagnose(reason: str) -> None:
	say(f'\n{reason}\nI could not connect the mentor automatically. Send this to Claude:\n')
	say('--- ports 80/443 ---\n' + (listeners() or '(ss not available)'))
	if shutil.which('docker'):
		say('--- containers ---\n' + run('docker', 'ps', '--format', '{{.Names}}  {{.Image}}  {{.Ports}}'))
	raise SystemExit(2)


def prepare(domain: str, port: str) -> str:
	# keep any existing override until a new wiring succeeds: .env's COMPOSE_FILE may point at it
	web = [c for c in containers() if publishes_web(c)]
	for c in web:
		image = c['Config'].get('Image', '').lower()
		if 'traefik' in image:
			return setup_traefik(c, domain)
		if 'nginx-proxy' in image or 'jwilder' in image:
			return setup_nginx_proxy(c, domain)
	procs = listeners()
	if '"nginx"' in procs and shutil.which('nginx'):
		kind = setup_host_nginx(domain, port)
		OVERRIDE.unlink(missing_ok=True)  # host nginx talks to the published port; no compose override
		return kind
	owner = (
		', '.join(sorted({c['Name'].lstrip('/') + ' (' + c['Config'].get('Image', '') + ')' for c in web}))
		or 'a program on the host'
	)
	diagnose(f'Ports 80/443 belong to {owner}, which I can’t configure automatically.')
	return 'unknown'


def check_dns(domain: str) -> None:
	try:
		resolved = {a[4][0] for a in socket.getaddrinfo(domain, 443, proto=socket.IPPROTO_TCP)}
	except socket.gaierror:
		say(f'Warning: {domain} does not resolve yet. Add the DNS A record pointing at this server, then wait a few minutes.')
		return
	local = set(run('hostname', '-I').split())
	if local and not resolved & local:
		say(
			f'Note: {domain} points at {", ".join(sorted(resolved))}; this server has {", ".join(sorted(local))}. If those differ, fix the DNS A record.'
		)


def finish(kind: str, domain: str) -> None:
	if kind == 'nginx':
		nginx_certificate(domain)
	check_dns(domain)
	if not shutil.which('curl'):
		return
	curl = ['curl', '-sk', '--noproxy', '*', '-o', '/dev/null', '-w', '%{http_code}', '--max-time', '10']
	url = ['--resolve', f'{domain}:443:127.0.0.1', f'https://{domain}/healthz']
	status = ''
	for _ in range(10):  # the web server picks up a new container within a few seconds
		status = run(*curl, *url)
		if status == '200':
			break
		time.sleep(3)
	if status == '200':
		say(f'Routing check: https://{domain} reaches the mentor.')
	else:
		say(
			f'Routing check: https://{domain} answered {status or "nothing"} from this server. Run ./doctor.sh to see which link is broken.'
		)


if __name__ == '__main__':
	if len(sys.argv) == 4 and sys.argv[1] == 'prepare':
		print(prepare(sys.argv[2], sys.argv[3]))
	elif len(sys.argv) == 4 and sys.argv[1] == 'finish':
		finish(sys.argv[2], sys.argv[3])
	else:
		raise SystemExit(__doc__)
