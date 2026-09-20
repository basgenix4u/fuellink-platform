# FuelLink

**Nigeria's downstream energy exchange & intelligence layer.** FuelLink is built in layers — data on top, exchange in the middle, finance underneath — to serve the era of the Dangote Refinery's rising domestic output.

- **L0 — Intelligence (public):** NMDPRA-derived market dashboards — gantry pricing, the Lomé index, fuel sufficiency radar, state price indices, LPG desk, jet A-1 desk. → public `/intel` routes (Phase 1, in this repo)
- **L1 — Exchange:** verified product, private pricing, escrowed orders between suppliers and independent marketers (this codebase's current app — `/depot`, `/marketer`, `/admin`)
- **L2 — LPG Exchange** · **L3 — Aviation Fuel Desk** · **L4 — Finance spine (Providus bank-held escrow, trade credit)** · **L5 — Export desk**

## Monorepo

```
apps/
  web/    @fuellink/web — Next.js 16 (App Router, Turbopack) + React 19. Public site, intel dashboards, exchange app. Static export (see Deployment).
  api/    @fuellink/api — NestJS 11 + Prisma 6 + Postgres. Exchange core: auth/RBAC, depot registry, escrow state machine (bank-held via Providus — bank wiring lands with API access). See apps/api/README.md.
packages/
  contracts/  @fuellink/contracts — shared zod-validated data schemas (L0 intelligence now; exchange domain model in Phase 2).
scripts in apps/web/scripts/ — data ingestion (NMDPRA fact sheets) + validation + report generation.
docker-compose.yml — local Postgres 16 + Redis 7 for the API (docker compose up -d).
```

Workspaces are managed with npm. From the repo root:

```bash
npm install
npm run dev          # web dev server
npm run dev:api      # api dev server (needs .env — see apps/api/.env.example + docker compose)
npm run lint         # eslint (web + api)
npm run typecheck    # tsc --noEmit (web + api)
npm run build        # production build (web static export → apps/web/out, api → apps/api/dist)
npm run ingest:nmdpra  # refresh L0 intelligence data from NMDPRA fact sheets (see below)
```

CI (`.github/workflows/ci.yml`) runs **lint → verify:data → typecheck → build** on pushes and PRs to `main`.

## Deployment

- **Public site (live):** static export deployed to **GitHub Pages** → https://basgenix4u.github.io/fuellink-platform/ — `deploy-pages.yml` rebuilds + redeploys on every push to `main` (so monthly data refreshes go live automatically). `NEXT_PUBLIC_BASE_PATH=/fuellink-platform` is set by the workflow for sub-path serving; drop it (and point `NEXT_PUBLIC_SITE_URL` at the domain root) when the site moves to fuellink.ng on Vercel.
- **Preview the export locally:** `npm run build` then `npx serve apps/web/out`.
- **API:** deployable via `apps/api/Dockerfile` to Railway/fly.io; run `npm run prisma:migrate` on a managed Postgres (Neon/Supabase) at deploy time. Env: `apps/api/.env.example`.

## L0 Intelligence data pipeline

All intelligence data is real, published, regulator data — **no fabricated figures**.

1. **Ingest** — `apps/web/scripts/ingest-nmdpra.mts` enumerates NMDPRA's public fact-sheet container (`alps.blob.core.windows.net/nmdprawebsite/Statistics/`), downloads new monthly PDFs, parses the key tables, validates against the zod contracts in `@fuellink/contracts`, and writes `apps/web/src/data/intelligence/*.json`.
2. **Verify** — `apps/web/scripts/verify-data.mts` re-validates the committed JSON against the contracts (fails loudly on schema drift).
3. **Serve** — the `/intel` pages import the validated JSON and chart it (recharts).

Data sources per dataset are recorded inside each JSON file (`source` blocks with URLs and retrieval timestamps). Primary source: NMDPRA monthly *"State of the Midstream and Downstream Sector"* fact sheets (Oct 2025 → latest).

## Notes

- The exchange app's data is still in-memory (zustand + mock data) and auth is a stub — Phase 2 replaces both with `@fuellink/api`.
- `apps/web/src/data/intelligence/` is the single source of truth for L0 dashboards; never hand-edit without re-running `verify:data`.
