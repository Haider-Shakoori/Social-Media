#!/bin/sh
set -eu
if [ "${EXPERIMENTAL_BROWSER_LAB_ENABLED:-false}" != "true" ]; then
 echo "Experimental browser lab disabled" >&2
 exit 1
fi
umask 077
export DISPLAY=:99
Xvfb :99 -screen 0 1280x800x24 -nolisten tcp -ac &
xvfb_pid=$!
trap 'kill "$xvfb_pid" 2>/dev/null || true' EXIT INT TERM
exec node /app/dist/worker.js
