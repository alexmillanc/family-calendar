#!/bin/sh
set -e

PORT="${PORT:-80}"
CONF="/etc/nginx/conf.d/default.conf"

# Rewrite listen port when Railway (or others) inject PORT.
# Avoid sed -i on bind-mounted files (fails with "Resource busy").
if [ "$PORT" != "80" ]; then
  TMP="$(mktemp)"
  sed "s/listen 80;/listen ${PORT};/" "$CONF" > "$TMP"
  cat "$TMP" > "$CONF"
  rm -f "$TMP"
fi

exec nginx -g "daemon off;"
