#!/bin/sh
set -eu
root=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
base="$root/deploy/experimental/compose.yaml"
pilot="$root/deploy/experimental/instagram-pilot.compose.yaml"
envfile="$root/deploy/staging/.env.staging"
secret="/opt/social-media-staging-private/instagram-pilot-vnc.pass"
if [ "$(id -u)" -ne 0 ]; then echo "Run as VPS root/operator"; exit 1; fi
export INSTAGRAM_PILOT_VNC_PASSWORD_PATH="$secret"
export BROWSER_LAB_PROXY_MAP_PATH="$root/experimental/browser-lab/example.proxy-map.json"
docker compose --env-file "$envfile" -f "$base" -f "$pilot" --profile instagram-pilot stop instagram-pilot
docker compose --env-file "$envfile" -f "$base" -f "$pilot" --profile instagram-pilot rm -f instagram-pilot
# Destroy private viewer password after the session ends.
rm -f -- "$secret"
export EXPERIMENTAL_BROWSER_LAB_ENABLED=true
export BROWSER_LAB_ALLOWED_ORIGINS=https://example.org
docker compose --env-file "$envfile" -f "$base" --profile experimental \
  up -d --no-build --no-deps --scale browser-lab=1 browser-lab
echo "Instagram private session ended, ephemeral browser profile destroyed, lab worker resumed."
