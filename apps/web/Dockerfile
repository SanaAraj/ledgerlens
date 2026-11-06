FROM oven/bun:1.1.34 AS build
WORKDIR /app
COPY apps/web/package.json ./
RUN bun install
COPY apps/web ./
RUN bun run build

FROM caddy:2.8-alpine
COPY --from=build /app/dist /srv
COPY infra/Caddyfile /etc/caddy/Caddyfile
EXPOSE 8080
