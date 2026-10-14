#!/bin/sh
set -eu
if [ "${INSTAGRAM_PILOT_ENABLED:-false}" != "true" ] ||
   [ "${BROWSER_LAB_MAX_SESSIONS:-0}" != "1" ]; then
 echo "Instagram pilot is disabled or one-session limit not configured" >&2
 exit 1
fi
if [ ! -r /run/instagram-viewer/password ] || [ ! -s /run/instagram-viewer/password ]; then
 echo "Private VNC password file missing" >&2
 exit 1
fi
umask 077
export DISPLAY=:98
Xvfb :98 -screen 0 1280x800x24 -nolisten tcp &
xvfb_pid=$!
# VNC listens only inside the container; websockify is published ONLY to VPS loopback.
x11vnc -display :98 -listen 127.0.0.1 -rfbport 5900 -forever -shared \
 -passwdfile /run/instagram-viewer/password -o /tmp/x11vnc.log &
vnc_pid=$!
websockify --web /usr/share/novnc 6081 127.0.0.1:5900 >/tmp/websockify.log 2>&1 &
web_pid=$!
trap 'kill "$web_pid" "$vnc_pid" "$xvfb_pid" 2>/dev/null || true' EXIT INT TERM
sleep 2
# The browser is interactive only: the operator signs in using the private viewer.
# A 15-minute timeout guarantees eventual session teardown.
timeout --signal=TERM --kill-after=10s 15m node /app/dist/instagram-pilot.js
