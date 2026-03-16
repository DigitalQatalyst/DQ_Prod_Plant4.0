#!/bin/sh

echo "Generating env-config.js from runtime environment variables..."

envsubst < /usr/share/nginx/html/env.template.js \
  > /usr/share/nginx/html/env-config.js

echo "Starting NGINX as non-root user"
exec nginx -g "daemon off;"