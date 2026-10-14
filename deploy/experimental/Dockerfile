# Isolated experiment only. This image is NOT part of the main staging Docker image.
FROM node:22-bookworm-slim
ENV DEBIAN_FRONTEND=noninteractive \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    NODE_ENV=production \
    HOME=/tmp
RUN apt-get update && apt-get install -y --no-install-recommends \
      chromium xvfb fonts-liberation ca-certificates tini \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY experimental/browser-lab/package.json ./package.json
RUN npm install --no-audit --no-fund
COPY experimental/browser-lab/tsconfig.json ./tsconfig.json
COPY experimental/browser-lab/src ./src
RUN npm run build
COPY experimental/browser-lab/entrypoint.sh /app/entrypoint.sh
RUN chmod 755 /app/entrypoint.sh \
 && useradd --system --uid 10001 --home-dir /app --shell /usr/sbin/nologin lab \
 && mkdir -p /app/profiles \
 && chown -R lab:lab /app
USER lab
ENTRYPOINT ["/usr/bin/tini","--","/app/entrypoint.sh"]
