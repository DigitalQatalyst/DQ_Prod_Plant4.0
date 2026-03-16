##############################
# 1. BUILD STAGE
##############################
FROM node:18 AS build
WORKDIR /app

ENV NODE_OPTIONS="--max-old-space-size=4096"

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build  --no-lint


##############################
# 2. RUNTIME STAGE (NGINX + NON-ROOT USER)
##############################
FROM nginx:stable-alpine

# Install envsubst (part of gettext)
RUN apk add --no-cache gettext

# Create non-root user and group
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Copy runtime template & entrypoint
COPY env.template.js /usr/share/nginx/html/env.template.js
COPY entrypoint.sh /entrypoint.sh

# Permissions: allow non-root user to read/serve files
RUN mkdir -p /var/cache/nginx/pids && \
    chown -R appuser:appgroup /var/cache/nginx && \
    chown -R appuser:appgroup /usr/share/nginx/html && \
    chown -R appuser:appgroup /var/log/nginx && \
    chmod +x /entrypoint.sh

# Change NGINX to run as non-root user
# We override the default user in nginx.conf
RUN sed -i 's/user  nginx;/user appuser;/g' /etc/nginx/nginx.conf

# Override NGINX default port (80 requires root)
# Update NGINX config to serve on 8080 instead of 80
RUN sed -i 's/listen       80;/listen 3000;/g' /etc/nginx/conf.d/default.conf

# Change pid location to one writable by non-root user
RUN sed -i 's|pid        /run/nginx.pid;|pid        /var/cache/nginx/pids/nginx.pid;|g' /etc/nginx/nginx.conf

USER appuser

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]