#!/bin/sh
# Operator-only start command. Do NOT run on production without reviewing resources.
set -eu
root=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
base="$root/deploy/experimental/compose.yaml"
pilot="$root/deploy/experimental/instagram-pilot.compose.yaml"
envfile="$root/deploy/staging/.env.staging"
secret_dir="/opt/social-media-staging-private"
password_file="$secret_dir/instagram-pilot-vnc.pass"

test -f "$envfile" || { echo "Missing private staging env"; exit 1; }
test -f "$base" && test -f "$pilot"
command -v openssl >/dev/null
command -v docker >/dev/null
if [ "$(id -u)" -ne 0 ]; then echo "Run as VPS root/operator"; exit 1; fi
if docker ps --format '{{.Names}}' | grep -q '^social-media-experimental-browser-lab-instagram-pilot-1$'; then
 echo "Private Instagram pilot already running"; exit 1
fi
mkdir -p "$secret_dir"
chmod 0700 "$secret_dir"
# VNC protocol password supports only the first 8 characters; make them random.
umask 077
openssl rand -hex 8 > "$password_file"
chown 10001:10001 "$password_file"
chmod 0400 "$password_file"
export INSTAGRAM_PILOT_ENABLED=true
export INSTAGRAM_PILOT_VNC_PASSWORD_PATH="$password_file"
export BROWSER_LAB_PROXY_MAP_PATH="$root/experimental/browser-lab/example.proxy-map.json"
# Existing Temporal worker is explicitly stopped to enforce a single browser.
docker compose --env-file "$envfile" -f "$base" --profile experimental stop browser-lab
docker compose --env-file "$envfile" -f "$base" -f "$pilot" --profile instagram-pilot \
  up -d --no-build --no-deps --scale instagram-pilot=1 instagram-pilot
echo "Private human-assisted Instagram login session started (15-minute TTL)."
echo "Open an SSH tunnel from your PC: ssh -N -L 6081:127.0.0.1:6081 <your-vps-user>@<your-vps-host>"
echo "Then open: http://127.0.0.1:6081/vnc.html?autoconnect=true"
echo "Retrieve the VNC viewer password via your authorized SSH shell from: $password_file"
echo "Never share your Instagram password or verification codes with this application."
