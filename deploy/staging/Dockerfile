# One shared application image for web, API and fail-closed worker.
# Build using GitHub Actions before installing on a memory-constrained VPS.
FROM node:22-bookworm-slim AS build
WORKDIR /srv/social
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@12.9.1 --activate
COPY . .
ARG NEXT_PUBLIC_API_BASE_URL=https://socials.businessos.af/api/v1
ARG NEXT_PUBLIC_SITE_URL=https://socials.businessos.af
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL} \
    NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL} \
    NEXT_PUBLIC_AUTH_ENABLED=true \
    PUBLIC_INDEXING_ENABLED=false \
    NEXT_TELEMETRY_DISABLED=1
RUN pnpm install --no-frozen-lockfile
RUN pnpm build

FROM node:22-bookworm-slim
WORKDIR /srv/social
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@12.9.1 --activate
COPY --chown=node:node --from=build /srv/social /srv/social
USER node
EXPOSE 3000 4000
CMD ["node", "apps/api/dist/main.js"]
