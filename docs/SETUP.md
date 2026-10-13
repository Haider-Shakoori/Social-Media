# Batch 1 local setup

Prerequisites: Node.js >=22, pnpm as pinned in the root package manifest, and Docker Compose.

1. Clone the repository and enter the root.
2. Copy .env.example to .env and change POSTGRES_PASSWORD for any non-local setup.
3. Start development database and queue backend: docker compose up -d.
4. Install dependencies: pnpm install.
5. Start API + marketing website: pnpm dev.
6. Open http://localhost:3000 and call GET http://localhost:4000/api/v1/health.
7. Run pnpm ci for typechecks, unit tests and production builds.

Database and Redis ports bind to loopback and are not available from the network by default. The database is not yet wired into application entities; migrations and tenant identity ship in later batches. No production publishing or authentication features are claimed at this stage. Do not use this development Compose file as a production deployment manifest.

## Important
- The root .env is gitignored; never commit secrets.
- This repository is public. Do not commit OAuth tokens, customer session state, VPS SSH keys or real credentials.
- Do not modify or deploy relayWA.
