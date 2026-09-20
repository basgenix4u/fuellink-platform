# FuelLink

**Nigeria's downstream energy exchange & intelligence layer.** FuelLink is built in layers — data on top, exchange in the middle, finance underneath — to serve the era of the Dangote Refinery's rising domestic output.

- **L0 — Intelligence (public):** NMDPRA-derived market dashboards — gantry pricing, the Lomé index, fuel sufficiency radar, state price indices, LPG desk, jet A-1 desk. → public `/intel` routes (Phase 1, in this repo)
- **L1 — Exchange:** verified product, private pricing, escrowed orders between suppliers and independent marketers (this codebase's current app — `/depot`, `/marketer`, `/admin`)
- **L2 — LPG Exchange** · **L3 — Aviation Fuel Desk** · **L4 — Finance spine (Providus bank-held escrow, trade credit)** · **L5 — Export desk**

## Monorepo

```
apps/
  web/    @fuellink/web — Next.js 16 (App Router, Turbopack) + React 19. Public site, intel dashboards, exchange app.
  api/    @fuellink/api — NestJS + Prisma + Postgres + Redis/BullMQ + Socket.IO. Scaffolded in Phase 2.
packages/
  contracts/  @fuellink/contracts — shared zod-validated data schemas (L0 intelligence now; exchange domain model in Phase 2).
scripts in apps/web/scripts/ — data ingestion (NMDPRA fact sheets) + validation.
```

Workspaces are managed with npm. From the repo root:

```bash
npm install
npm run dev          # web dev server
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm run build        # production build
npm run ingest:nmdpra  # refresh L0 intelligence data from NMDPRA fact sheets (see below)
```

CI (`.github/workflows/ci.yml`) runs **lint → typecheck → build** on pushes and PRs to `main`.

## L0 Intelligence data pipeline

All intelligence data is real, published, regulator data — **no fabricated figures**.

1. **Ingest** — `apps/web/scripts/ingest-nmdpra.mjs` enumerates NMDPRA's public fact-sheet container (`alps.blob.core.windows.net/nmdprawebsite/Statistics/`), downloads new monthly PDFs, parses the key tables, validates against the zod contracts in `@fuellink/contracts`, and writes `apps/web/src/data/intelligence/*.json`.
2. **Verify** — `apps/web/scripts/verify-data.mjs` re-validates the committed JSON against the contracts (fails loudly on schema drift).
3. **Serve** — the `/intel` pages import the validated JSON and chart it (recharts).

Data sources per dataset are recorded inside each JSON file (`source` blocks with URLs and retrieval timestamps). Primary source: NMDPRA monthly *"State of the Midstream and Downstream Sector"* fact sheets (Oct 2025 → latest).

## Notes

- The exchange app's data is still in-memory (zustand + mock data) and auth is a stub — Phase 2 replaces both with `@fuellink/api`.
- `apps/web/src/data/intelligence/` is the single source of truth for L0 dashboards; never hand-edit without re-running `verify:data`.
