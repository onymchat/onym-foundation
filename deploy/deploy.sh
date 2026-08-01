#!/usr/bin/env bash
# Deploys onym.foundation to the SAME DigitalOcean droplet that serves
# onym.app (droplet "onym-web"). Idempotent:
#
#   1. resolves the droplet IP via doctl (never creates one — the whole
#      point is to share the existing box);
#   2. ensures Cloudflare DNS A records for onym.foundation + www
#      point at it (DNS-only / grey cloud, so Caddy's ACME works);
#   3. rsyncs the committed site/ output to /var/www/onym-foundation/;
#   4. installs infra/onym-foundation.caddy into /etc/caddy/sites.d/,
#      makes sure the main Caddyfile imports that directory, validates,
#      and reloads Caddy only when config actually changed.
#
# Required environment:
#   DO_API_KEY or DO_TOKEN   DigitalOcean API token (doctl)
#   CF_API_TOKEN             Cloudflare token with DNS:Edit on onym.foundation
#   SSH_KEY_PATH             key trusted by the droplet (default ~/.ssh/id_ed25519)
#
# Local use: ENV_FILE=~/Developer/onym-infra/.env ./deploy/deploy.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Source credentials FIRST, then fix the script's own constants — an env
# file may define DOMAIN etc. for a different site (onym-infra's does),
# and it must never be able to redirect this deploy.
if [ -n "${ENV_FILE:-}" ]; then
  # shellcheck disable=SC1090
  set -a; source "$ENV_FILE"; set +a
fi

DROPLET_NAME="onym-web"
DOMAIN="onym.foundation"
WEB_ROOT="/var/www/onym-foundation"
VHOST_SRC="$REPO_ROOT/infra/onym-foundation.caddy"
VHOST_DST="/etc/caddy/sites.d/onym-foundation.caddy"
IMPORT_LINE='import /etc/caddy/sites.d/*.caddy'
export DIGITALOCEAN_ACCESS_TOKEN="${DO_API_KEY:-${DO_TOKEN:?set DO_API_KEY or DO_TOKEN}}"
: "${CF_API_TOKEN:?set CF_API_TOKEN}"
SSH_KEY_PATH="${SSH_KEY_PATH:-$HOME/.ssh/id_ed25519}"
SSH_OPTS=(-i "$SSH_KEY_PATH" -o StrictHostKeyChecking=accept-new -o BatchMode=yes -o ConnectTimeout=10)

say() { printf '\n\033[1m== %s\033[0m\n' "$*"; }

# ---- 1. droplet ------------------------------------------------------------
say "Resolving droplet '$DROPLET_NAME'"
IP=$(doctl compute droplet list --format Name,PublicIPv4 --no-header |
  awk -v n="$DROPLET_NAME" '$1==n{print $2; exit}')
if [ -z "$IP" ]; then
  echo "error: droplet '$DROPLET_NAME' not found — this script never creates one." >&2
  echo "It must be the droplet already serving onym.app." >&2
  exit 1
fi
# DNS points at the droplet's reserved IP when one is assigned (same
# architecture as onym.app: the reserved IP survives droplet rebuilds).
RESERVED_IP=$(doctl compute reserved-ip list --format IP,DropletName --no-header 2>/dev/null |
  awk -v n="$DROPLET_NAME" '$2==n{print $1; exit}') || true
DNS_IP="${RESERVED_IP:-$IP}"
echo "droplet IP: $IP  (DNS target: $DNS_IP${RESERVED_IP:+ — reserved})"

# ---- 2. DNS ----------------------------------------------------------------
say "Ensuring Cloudflare DNS ($DOMAIN, www.$DOMAIN → $DNS_IP, DNS-only)"
cf() { curl -sf -H "Authorization: Bearer $CF_API_TOKEN" -H "Content-Type: application/json" "$@"; }

ZONE_ID=$(cf "https://api.cloudflare.com/client/v4/zones?name=$DOMAIN" |
  python3 -c 'import json,sys; r=json.load(sys.stdin)["result"]; print(r[0]["id"] if r else "")')
if [ -z "$ZONE_ID" ]; then
  echo "error: Cloudflare zone '$DOMAIN' not found for this token." >&2
  exit 1
fi

ensure_a() {
  local name="$1"
  local rec
  rec=$(cf "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records?type=A&name=$name" |
    python3 -c 'import json,sys; r=json.load(sys.stdin)["result"]; print(json.dumps(r[0]) if r else "")')
  local body="{\"type\":\"A\",\"name\":\"$name\",\"content\":\"$DNS_IP\",\"ttl\":1,\"proxied\":false}"
  if [ -z "$rec" ]; then
    cf -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" --data "$body" >/dev/null
    echo "created A $name → $DNS_IP"
  else
    local id content proxied
    id=$(echo "$rec" | python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])')
    content=$(echo "$rec" | python3 -c 'import json,sys; print(json.load(sys.stdin)["content"])')
    proxied=$(echo "$rec" | python3 -c 'import json,sys; print(json.load(sys.stdin)["proxied"])')
    if [ "$content" = "$DNS_IP" ] && [ "$proxied" = "False" ]; then
      echo "A $name already correct"
    else
      cf -X PUT "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$id" --data "$body" >/dev/null
      echo "updated A $name → $DNS_IP (was $content, proxied=$proxied)"
    fi
  fi
}
ensure_a "$DOMAIN"
ensure_a "www.$DOMAIN"

# ---- 3. content ------------------------------------------------------------
say "Syncing site/ → root@$IP:$WEB_ROOT/"
ssh "${SSH_OPTS[@]}" "root@$IP" "mkdir -p $WEB_ROOT /etc/caddy/sites.d"
# _headers is the Netlify/CF-Pages copy of the header policy; Caddy sets
# the same headers from the vhost, so it isn't served here.
rsync -az --delete-after --exclude='_headers' \
  -e "ssh ${SSH_OPTS[*]}" \
  "$REPO_ROOT/site/" "root@$IP:$WEB_ROOT/"
echo "content synced"

# ---- 4. caddy vhost --------------------------------------------------------
say "Installing Caddy vhost and reloading if changed"
scp "${SSH_OPTS[@]}" "$VHOST_SRC" "root@$IP:$VHOST_DST.new" >/dev/null
ssh "${SSH_OPTS[@]}" "root@$IP" "IMPORT_LINE='$IMPORT_LINE' bash -s" <<'REMOTE'
set -euo pipefail
changed=0

# The main Caddyfile is owned by onym-website (source of truth:
# onym-website/infra/cloud-init.yml, which carries the same import
# line). Ensure it here too so foundation deploys don't depend on a
# website release having happened first.
if ! grep -qF "$IMPORT_LINE" /etc/caddy/Caddyfile; then
  sed -i "1i # Extra sites (onym.foundation, …) live in their own files.\n$IMPORT_LINE\n" /etc/caddy/Caddyfile
  echo "added sites.d import to /etc/caddy/Caddyfile"
  changed=1
fi

if ! cmp -s /etc/caddy/sites.d/onym-foundation.caddy.new /etc/caddy/sites.d/onym-foundation.caddy 2>/dev/null; then
  mv /etc/caddy/sites.d/onym-foundation.caddy.new /etc/caddy/sites.d/onym-foundation.caddy
  echo "vhost updated"
  changed=1
else
  rm /etc/caddy/sites.d/onym-foundation.caddy.new
  echo "vhost unchanged"
fi

caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null
if [ "$changed" = 1 ]; then
  systemctl reload caddy
  echo "caddy reloaded"
else
  echo "no config change, skipping reload"
fi
REMOTE

say "Done"
echo "https://$DOMAIN (droplet $DROPLET_NAME @ $IP)"
