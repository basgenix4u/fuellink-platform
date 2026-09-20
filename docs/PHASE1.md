# Phase 1 — L0 Intelligence: plan, status, sources

**Status: IN PROGRESS — data engine + public dashboards shipped on `feat/phase1-intelligence` (PR #2), awaiting review. Weeks 1–6 of the 5-layer plan; no payments in this phase.**

## What "L0" means

The intelligence layer is the trust foundation. Before FuelLink settles a single naira, it must be
the place where the downstream industry's real numbers live — free, sourced, verifiable, and updated
on the regulator's own cadence. Depots and marketers who come for the data stay for the exchange.

## Delivered in this phase

### 1. Data engine (committed: `f7389fb`)

| Piece | Location | Notes |
|---|---|---|
| Ingest pipeline | `apps/web/scripts/ingest-nmdpra.mts` | Enumerates NMDPRA's **public blob container** (`alps.blob.core.windows.net/nmdprawebsite`, `Statistics/` prefix), downloads fact-sheet PDFs to a gitignored cache, parses both sheet formats (legacy Oct/Nov 2025 + new Dec 2025+), writes 7 typed datasets |
| Verification | `apps/web/scripts/verify-data.mts` | zod re-validation of all 7 datasets + plausibility invariants; wired into CI (`npm run verify:data`) |
| Contracts | `packages/contracts/src/index.ts` | Single-file zod schemas; consts `*Schema`, types plain (tsx constraint — do not split) |
| Datasets | `apps/web/src/data/intelligence/*.json` | 7 files, 10 months of NMDPRA data (Oct 2025 → Jul 2026) + curated sourced sets |
| Scheduled refresh | `.github/workflows/ingest.yml` | Cron 12th of month 08:00 UTC + `workflow_dispatch`; on data change: bot branch → PR → human approves |

**Coverage:** 10 fact sheets, two published formats, 8-state price tables, DPRP utilization/evacuation,
supply/consumption/sufficiency, LPG, gas (Bscf/d), NGIC pipeline progress, Lomé trade flows, gantry
price ladder, LPG market structure, Jet A-1 crisis timeline.

**Integrity rules (enforced by design):**
- Every number is a real published figure; missing = `null` → rendered "not reported", **never estimated**.
- A clearly-labelled `MANUAL_OVERRIDES` table transcribes a handful of layout-poor values **from the same PDFs**.
- Derived values (arithmetic only, e.g. import = total − domestic) are flagged in `notes` and tagged `derived` in the UI.
- Known sheet defects are documented in dataset notes (e.g. May 2026 ATK supply cell; July 2026 draft-stage QA comments).

### 2. Public dashboards (this commit)

| Route | What it shows |
|---|---|
| `/intel` | Hub: latest snapshot (Jul 2026), dashboard index, coverage table, methodology |
| `/intel/gantry` | PMS price ladder: DPRP ex-gantry band → NNPC revisions → indicative Lagos/Abuja, all 12 reported points with sources |
| `/intel/sufficiency` | Days-of-sufficiency (PMS/AGO/ATK/LPG) × 10 months; basis-change warning (DPRP stock incl. from Feb 2026); consumption vs NMDPRA 2026 benchmarks |
| `/intel/lome` | The Lomé paradox (70–80% of waterborne "imports" = DPRP product via Togo), import/export flows, NBS Q1-2026 exports, jet surge |
| `/intel/prices` | 8-state PMS indices (indicative + actuals), state wedge, LPG national range + June 2026 state table |
| `/intel/calculator` | Delivered price = **sourced base + user's own freight/costs**. No pre-filled freight — the tool refuses to guess routes |
| `/intel/arbitrage` | 8 computed signals (spreads/gaps), each with derivation + source |
| `/intel/lpg` | LPG desk: deficit, buffer, price history, producers, policy |
| `/intel/jet` | Jet A-1 desk: crisis timeline, DPRP USD + 25% holdback model, airport spreads |

Landing integration: navbar **Intelligence** link; hero counters replaced with **real** NMDPRA
figures (DPRP utilization 71.09%, PMS consumption 35.7 ML/d, sufficiency 22.4 days, gas 4.72
Bscf/d — Jul 2026) with a link into the layer. The fake "127+ depots / ₦58B / 3,400+ marketers"
traction counters are gone.

### 3. Engineering notes (do not regress)

- tsx (the script runner) **cannot** handle: same-name const+type exports, extensionless relative
  TS imports. Contracts stay a single file; schema consts are `*Schema`.
- `apps/web/tsconfig.json` target raised ES2017 → ES2020 (dotAll regex flag in ingest script).
- `.next/` untracked (1,260 files were committed by the monorepo move; fixed in `34a0305`).
- The `abuza` typo hazard: after any state-related edit, `grep -n "abuza\|abuja"`.

## Data sources (all public, per-dataset attribution in the JSONs)

1. **NMDPRA monthly fact sheets** — "State of the Midstream and Downstream Sector", public Azure
   blob container (enumerated + cached). Site: https://nmdpra.gov.ng/
2. **NNPC/DPRP price revisions (2026)** — as reported by trade press (each point carries its note).
3. **NBS foreign trade statistics Q1 2026** — product export values + destinations.
4. **S&P Global Commodity Insights, via MEMAN industry webinar** — Lomé paradox share, jet export surge.
5. **NUPRC/NALPGAM 2026 outlook** — as reported (Vanguard/Legit) — LPG demand/supply, buffer.
6. **AON/AirInsight/ThisDay/Legit 2026 coverage** — Jet A-1 crisis timeline, airport spreads.

## What's next (Phase 1 remainder, wks 3–6)

- [ ] **SEO/news engine**: auto-drafted monthly "Nigeria fuel sector in numbers" posts from the datasets (deterministic template, human edit before publish).
- [ ] **NMDPRA outreach**: data-relationship proposal (see `docs/outreach-nmdpra.md`) — offer of an official data mirror + their logo on the source block; ask: early access to unpublished tables + a contact for the API/Blazor stats feed.
- [ ] Widget embed: iframe-able price board for partner sites (one-day build on existing components).
- [ ] Data quality: add the 2023–2024 archive sheets to coverage once format drift is mapped.
- [ ] Then hand off to Phase 2 (backend: auth, depot profiles, the real price board fed by this layer).

## Verification checklist (run before merge)

```sh
npm run verify:data    # zod + invariants on all 7 datasets
npm run typecheck
npm run lint           # 0 errors (172 pre-existing warnings in legacy landing code)
npm run build          # 46 routes, /intel* all static
```

Manual smoke: `next start`, visit all 9 `/intel` routes; every metric traces to a dataset field;
no "NaN"/"undefined" in rendered HTML (checked); derived values tagged.
