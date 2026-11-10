# FuelLink — Complete Project Detail

**Repository:** `basgenix4u/fuellink-platform` (public) · branch `main` · HEAD `7056422`
**Document written:** 2026-11-06 · based on a full read of the repository at that commit, the live deployments, and a read-only query of the production database.
**Audience:** a new engineer or AI coding agent who has no prior context.

Everything below is labelled with one of four markers:

| Marker | Meaning |
|---|---|
| `[V]` Verified | I ran, read, or queried it myself during this investigation. Evidence is in §23. |
| `[I]` Inferred | A reasonable reading of the code or docs, not directly executed. |
| `[U]` Unresolved | Contradictory or incomplete evidence; do not build on it without checking. |
| `[X]` Confirmed defect | Reproduced or directly observable in code/config that is deployed. |

No credentials appear in this document. Environment *names* are listed; values never are.

---

## 1. Project Overview

FuelLink is a Nigerian downstream petroleum marketplace plus an intelligence layer. Two distinct products live in one monorepo:

1. **L0 — the intelligence layer.** A public, statically exported website that mirrors NMDPRA's monthly "State of the Midstream and Downstream Sector" fact sheets into validated JSON datasets and renders them as dashboards, historic series, monthly reports and an arbitrage calculator. **This part is real, live, sourced, and verifiable today.**
2. **L1-L5 — the exchange and money layer.** A NestJS API with a Postgres schema for organisations, KYC, depots, tank stock, listings, orders, escrow, a double-entry ledger and payouts. **The backend logic is substantially built and tested; no frontend is connected to it.** The console UIs in the same Next.js app are a high-fidelity prototype driven by mock data.

That split is the single most important fact about this codebase: *the marketing/intelligence product is shipped, the transactional product is built but unwired*.

| | |
|---|---|
| Repo created | 2026-09-14 `[V]` |
| Commits on `main` | 45 `[V]` |
| Working tree | Clean; `TASKS.md` untracked by design `[V]` |
| Licence | MIT `[V]` |
| Primary language | TypeScript end to end |
| Monorepo | npm workspaces: `apps/web`, `apps/api`, `packages/contracts` `[V]` |
| Production web | `https://fuellink-platform-seven.vercel.app` (200) `[V]` |
| Production API | `https://fuellink-api-qthr.onrender.com/api/v1` (health 200) `[V]` |
| Production DB | Neon Postgres 17, 38 tables, essentially empty `[V]` |
| Code volume (API) | 6,751 lines across `apps/api/src` `[V]` |
| Code volume (web) | 50 routes, 59 client components, ~30k lines under `apps/web/src` `[I]` |

---

## 2. Identity

**Name:** FuelLink. The intended production domain is `fuellink.ng`; it is referenced in `docs/outreach-nmdpra.md` and used as the default for `NEXT_PUBLIC_SITE_URL`. The domain is **not** attached to any deployment `[U]` — the site is currently served from a `*.vercel.app` host and `fuellink.ng` was not reachable during this investigation.

**Positioning sentence used in the product's own metadata:** "FuelLink — Nigeria's Digital Petroleum Exchange" `[V]`.

**Founder/operator identity in project material:** Abdulbasit (Basgenix), Abuja, Nigeria. The outreach draft is signed "Abdulbasit, founder of FuelLink (fuellink.ng)" `[V]`.

**What it is not:** FuelLink is not a payment processor, not a bank, and not a licensed depot operator. Money is meant to sit at a bank that acts as escrow; FuelLink records the ledger and instructs the movements `[V]` — see D2/D3 in `docs/PRODUCT-PLAN.md`.

---

## 3. The Problem

Taken from `README.md`, `docs/PRODUCT-PLAN.md` and the landing copy, and consistent with the product's own framing `[V]` for the claims, `[I]` for the market reasoning:

- **Price opacity.** Depot prices in Nigeria are private and negotiated. A marketer must phone several depots to find product, stock and price; nobody can prove what anyone else paid.
- **Counterparty risk.** Loading a truck means paying before product is released. Buyers fear non-delivery; sellers fear unreleased funds. There is no neutral record of the agreement.
- **Data scarcity.** NMDPRA publishes the sector's authoritative monthly numbers as PDFs, not as data. Analysts, journalists, lenders and operators rebuild the same spreadsheets by hand every month.
- **Financing gap.** Trade credit for downstream fuel movement is expensive or unavailable because there is no verifiable history of a marketer's deliveries, disputes and repayments.

FuelLink's answer is a stack that solves these in dependency order: measured public data first, then an exchange with escrow, then financing on top of the resulting record.

---

## 4. Vision

The layer model in `README.md` is the clearest statement of ambition and is treated as **confirmed** architecture direction `[V]`:

| Layer | Scope | Status |
|---|---|---|
| **L0 Intelligence** | NMDPRA data mirrored, validated, published; dashboards, reports, arbitrage | Shipped and live `[V]` |
| **L1 Exchange** | Marketer ↔ depot marketplace: private prices, orders, loading, delivery | Backend built, UI mocked `[V]` |
| **L2 LPG** | LPG cylinder / bulk trade and pricing on the same rails | Planned `[I]` |
| **L3 Aviation** | Jet A-1 supply, Lome-index linked | Dataset exists, product planned `[V]`/`[I]` |
| **L4 Finance spine** | Escrow, ledger, payouts, trade credit, invoices | Escrow + ledger built, credit not started `[V]` |
| **L5 Export desk** | Cross-border / export desk | Early `[I]` — least evidenced layer |

**Confirmed vision** (stated in repo documents and reflected in code): a verified intelligence layer that earns trust, an exchange that captures transactions, and a finance spine that monetises the transaction record.

**Ideas under consideration, not decided** `[U]`: the LPG and aviation verticals have datasets and navigation entries but no product decisions recorded; the export desk has essentially one line of description; AI/prediction is explicitly *rejected* in its current form (see D5 in §21) while "predictor" and "AI settings" screens exist in the prototype.

**This document's own reading, not a project decision** `[I]`: the realistic near-term value is L0 + L1 with a manual-bank escrow, because the data layer already has distribution and the escrow design deliberately works without a bank API. Everything beyond that is optional until L1 has real transactions.

---

## 5. Users, Roles and Use Cases

### Platform-level roles `[V]` (`Role` enum in `apps/api/prisma/schema.prisma`)

| Role | Reality |
|---|---|
| `MARKETER` | Buys product; the demand side |
| `DEPOT` | Sells product; owns tanks and listings |
| `ADMIN` | Platform operator: KYC review, payment confirmation, refunds, ledger integrity |

### Organisation roles `[V]` (`OrgRole`)

`OWNER` (billing, bank accounts) · `MANAGER` (prices, deliveries, staff) · `STAFF` (listings, orders) · `FINANCE` (payouts, statements, no trading) · `VIEWER` (read-only).

`RolesGuard` enforces, in order: platform role → org role → org verification status. `ADMIN` bypasses org-role and verification checks by design `[V]` (`apps/api/src/auth/roles.guard.ts`).

### Verified-organisation gate `[V]`

`VerificationStatus` = `UNVERIFIED | PENDING | VERIFIED | REJECTED | SUSPENDED`. Endpoints marked `@RequireVerifiedOrg()` refuse to run until an admin approves submitted documents (D4: manual review).

### Use cases as designed

1. A depot registers, submits KYC documents, is reviewed and verified, sets tank levels, publishes private listings.
2. A marketer registers, is verified, browses depots, requests a price in chat, places an order against a quote.
3. The marketer funds escrow by bank transfer, an admin confirms receipt, the depot allocates stock and dispatches.
4. Delivery is confirmed by the buyer or auto-confirmed after 72 h; variance beyond 0.5 % flags the order; escrow releases; the ledger records the movements; a payout to the depot becomes claimable.
5. Either side can dispute; an admin resolves with release or refund.
6. Throughout, a separate audience reads the public intelligence dashboards and monthly reports without an account.

Steps 1-5 are implemented in the API `[V]`; none of them can be performed from the web app today `[X]` — see §7 and §12.

---

## 6. Differentiation

From the product's own documents `[V]` plus this document's reading `[I]`:

- **Sourced data with provenance.** Every figure carries a `sourceUrl` and a period; `verify:data` fails the build on a fabricated or malformed value. Missing values are `null`, never estimated. This is enforced by `packages/contracts/src/index.ts` and `apps/web/scripts/verify-data.mts`, and it passes today `[V]`.
- **Deterministic analytics.** D5 forbids prediction and heuristic "AI numbers"; derived values are arithmetic on published data and labelled as derived. This is an unusual and defensible position in a market full of invented dashboards.
- **Bank-held escrow, provider-agnostic.** D3 abstracts payment behind a `PaymentProvider` interface so the manual-transfer adapter can be replaced by Providus/Paystack without touching order logic `[V]`.
- **Money safety as a first-class concern.** Integer kobo, `BigInt` in the ledger, database triggers that reject unbalanced or mutated entries (D1, D2, D9) — stricter than most early-stage fintech codebases `[V]`.
- **A single schema package.** `@fuellink/contracts` (zod) is the one place a dataset shape or domain response is defined; web and API both import it (D10) `[V]`.

---

## 7. Feature Inventory and Implementation Status

Legend for status: **Shipped** = works in production and verified · **Backend only** = works via API, no UI · **UI only** = renders, does nothing · **Partial** = some pieces real · **Not started** · **Broken/blocked**.

### L0 — Intelligence (public)

| Capability | Status | Notes |
|---|---|---|
| NMDPRA monthly mirror, Oct 2025 – Jul 2026 (10 months) | Shipped `[V]` | `apps/web/src/data/intelligence/nmdpra-monthly.json` |
| PMS state pump prices | Shipped `[V]` | `pms-prices.json` |
| LPG prices + LPG market | Shipped `[V]` | `lpg-prices.json`, `lpg-market.json` |
| Lome (Togo) index | Shipped `[V]` | `lome-index.json` |
| Gantry prices (DAPPMAN/NGIC etc.) | Shipped `[V]` | `gantry-prices.json` |
| Jet A-1 | Shipped `[V]` | `jet-a1.json` |
| Monthly "sector in numbers" reports | Shipped `[V]` | 10 files in `apps/web/src/data/reports/`, `/reports` and `/reports/[month]` |
| Public dashboards | Shipped `[V]` | `/intel`, `/intel/prices`, `/intel/sufficiency`, `/intel/lpg`, `/intel/lome`, `/intel/gantry`, `/intel/jet`, `/intel/arbitrage`, `/intel/calculator` |
| Dataset ingestion script | Partial `[V]` | `apps/web/scripts/ingest-nmdpra.mts` parses the public Azure blob container; ran successfully on 2026-10-12 but found no new months |
| Scheduled refresh | **Broken** `[X]` | GitHub Actions disabled on the repo; see §19 |
| NMDPRA data relationship (outreach) | Not started `[V]` | Draft only: `docs/outreach-nmdpra.md` |
| Embeddable price widget | Not started `[V]` | Listed as remaining Phase-1 work in `docs/PHASE1.md` |
| 2023–2024 archive | Not started `[V]` | Same |

**Data freshness `[X]`:** datasets stop at July 2026 and `generatedAt` is 2026-09-20. Today is 2026-11-06. The live public product therefore shows three-month-old "latest" data while the schemas promise monthly cadence. This is a content/operations defect, not a code defect, but it is visible to users on `/intel` and `/reports`.

### L1 — Exchange (authenticated consoles)

All console routes render from mock data and every submit handler is a `setTimeout` + toast. Verified examples `[X]`:
- `apps/web/src/app/(auth)/login/page.tsx:82` — `await new Promise(r => setTimeout(r, 1500))`, then `router.push('/marketer'|'/depot')`.
- `apps/web/src/app/(auth)/register/marketer/page.tsx:134` — 2000 ms fake delay.
- `apps/web/src/app/depot/settings/page.tsx:97` — 1500 ms fake save.
- `apps/web/src/app/marketer/orders/new/page.tsx:201` — 2500 ms fake order placement.
- `apps/web/src/app/marketer/subscribe/page.tsx:82` — literal `// TODO: Integrate Providus Bank payment API`.

| Capability | UI | Backend |
|---|---|---|
| Signup / login / logout / refresh / password reset | UI only | Built, tested `[V]` |
| Organisation profile, documents, members, invites, bank accounts | UI only (screens exist) | Built, tested `[V]` |
| Admin KYC review | UI only (`/admin/depots`, `/admin/depots/[id]`) | Built `[V]` |
| Depot + tank CRUD, stock levels | UI only (`/depot/inventory`) | Built `[V]` |
| Listings with private prices | UI only (`/depot/private-prices`) | Built `[V]` |
| Marketplace browse / depot detail | UI only (mock catalogue) | Built `[V]` |
| Order lifecycle (11 states) | UI only | Built + 142 integration tests `[V]` |
| Escrow funding, admin confirmation, release, refund | UI only | Built, **not operable in prod** (empty escrow account config) `[X]` |
| Ledger, statements, balance | UI only | Built + DB triggers `[V]` |
| Payouts | UI only | Built `[V]` |
| Chat / negotiated price | UI only, mock timestamps | Model exists, no endpoints `[V]` |
| Disputes | UI only (`/marketer/disputes`, `/admin/disputes`) | Models exist, no endpoints `[V]` |
| Ratings | UI only | No model at all `[V]` |
| Notifications / alerts | UI only (`/marketer/alerts`) | Models exist, no endpoints, no delivery `[V]` |
| Subscriptions / invoices | UI only (`/marketer/subscribe`, `/depot/settings/subscription`) | Models exist, no endpoints `[V]` |
| Predictor ("AI") | UI only — static mock series | Deliberately not implemented (D5) `[V]` |

**Rule of thumb for anyone reading this repo:** if a screen is under `/depot`, `/marketer` or `/admin`, it is a prototype.

### Cross-cutting

| Capability | Status |
|---|---|
| Design system, responsive layout, 320-2560 px audits | Shipped `[V]` — 0 overflow/hydration/console issues across 17 routes × 7 widths |
| Static export + CDN caching | Shipped `[V]` |
| CI (lint, typecheck, build, unit, integration) | Written but **not running** `[X]` |
| API integration from web | Not started `[X]` |

---

## 8. Backend Implementation

**Stack `[V]`:** NestJS 11, Prisma 6.19.3, PostgreSQL 17, argon2, zod 3, pino, helmet, `@nestjs/throttler`, multer.

**Boot sequence `[V]` (`apps/api/src/main.ts`):** helmet with CSP, 256 kb JSON body limit, CORS allowlist from `CORS_ORIGINS`, `cookie-parser`, `X-Request-Id` on every response, global prefix `api/v1`, global exception filter that maps typed errors to stable codes, global zod validation pipe, serialization interceptor (BigInt → string).

**Fail-fast environment `[V]` (`apps/api/src/config/env.ts`):** zod schema; refuses to boot in production if `COOKIE_SECURE` is not true, if the two JWT secrets are equal, or if a secret looks like a placeholder. 22 validated variables.

**Modules `[V]`:** `prisma`, `common`, `audit`, `auth`, `storage`, `organizations`, `depots`, `orders`, `ledger`, `payments`, `health`.

Notable per-file weight `[V]`: `orders.service.ts` 684 lines, `depots.service.ts` 604, `escrow.service.ts` 594, `organizations.service.ts` 573, `auth.service.ts` 519.

**Money correctness `[V]`:**
- `src/common/money.ts` — kobo integers, no floats in the money path, `BigInt` at the ledger boundary.
- `src/ledger/ledger.service.ts` (241 lines) — double-entry postings, account types, transaction kinds.
- `src/common/idempotency.service.ts` (149 lines) — `Idempotency-Key` header, key row inserted before work, stored response replayed, 24 h TTL, conflict on body mismatch (D8).
- Optimistic locking and row constraints at the DB level (D9), verified in the live schema `[V]`.

**Order engine `[V]`:** state machine `DRAFT → QUOTED → CONFIRMED → AWAITING_PAYMENT → ESCROW_FUNDED → ALLOCATED → LOADING → IN_TRANSIT → DELIVERED → COMPLETED`, with `DISPUTED → RESOLVED → COMPLETED|REFUNDED` as the escape path. Reservations prevent overselling (`listings_reserved_within_available` check constraint exists in the live DB `[V]`). 72 h auto-confirm and 0.5 % variance tolerance are configuration, not hardcoded.

**Escrow `[V]`:** `PaymentProvider` interface with a manual bank-transfer adapter (`ESCROW_BANK_NAME`/`ESCROW_ACCOUNT_NAME`/`ESCROW_ACCOUNT_NUMBER`). Admin confirms or rejects a pending payment; release and refund post ledger entries. Provider kinds include a slot for a real PSP; none is implemented.

**File storage `[V]`:** `apps/api/src/storage/storage.service.ts` writes to `STORAGE_ROOT`, defaulting to `<cwd>/.storage` on the API's local disk. There is no S3/R2 adapter. On Render this is ephemeral — see §19.

**Audit `[V]`:** `audit_logs` table with actor, action, entity, changes, ip, userAgent; one real row exists in production (`auth.registered`), from the smoke test.

---

## 9. Data Model and Database

**`apps/api/prisma/schema.prisma`** is 1,118 lines: roughly 50 enums and models. Two migrations, both applied to production `[V]`:
- `20260922163130_init_full_domain`
- `20260922164000_ledger_integrity` (adds the ledger triggers and check constraints)

**Production reality `[V]`** — queried read-only against the Neon instance:
- 38 tables in `public`.
- `_prisma_migrations`: 2 rows, both finished.
- Every business table is empty except `audit_logs`, which has 1 row.
- Triggers present: `ledger_entries_balanced`, `ledger_entries_immutable` (5 trigger bindings).
- Check constraints present: `tanks_level_within_capacity`, `listings_volumes_nonnegative`, `listings_validity_window`, `listings_price_positive`, `listings_reserved_within_available`, `slots_booking_within_capacity`, `orders_price_positive`, `orders_distinct_parties`, `orders_quantity_positive`, `orders_amounts_nonnegative`, `ledger_entries_amount_nonzero`, `payments_amount_positive`, `payouts_amount_positive`.

**Conclusion:** the production database is a migrated, constrained, completely empty schema. Nobody has transacted on it.

**Entity map (by responsibility):**

| Domain | Models |
|---|---|
| Identity | `User`, `Session`, `VerificationToken`, `AuditLog` |
| Organisations | `Organization`, `OrgMember`, `KycDocument`, `VerificationReview`, `BankAccount` |
| Supply | `Depot`, `Tank`, `ProductListing`, `PriceHistory`, `LoadingSlot` |
| Trading | `QuoteRequest`, `Order`, `OrderEvent`, `OrderDocument`, `Delivery` |
| Money | `Payment`, `PaymentAttempt`, `Payout`, `LedgerAccount`, `LedgerEntry`, `LedgerTransaction`, `IdempotencyKey`, `FeePolicy`, `Invoice`, `Subscription` |
| Communication | `Conversation`, `ConversationParticipant`, `Message`, `Dispute`, `DisputeMessage`, `DisputeEvidence`, `Notification`, `NotificationPreference` |

**Schema ahead of API `[V]`:** `QuoteRequest`, `Dispute`, `DisputeMessage`, `DisputeEvidence`, `Conversation`, `ConversationParticipant`, `Message`, `Notification`, `NotificationPreference`, `Subscription`, `Invoice`, `FeePolicy` (model exists; a service-level default is used), `PriceHistory`, `LoadingSlot` have **no controllers or services**. Building those endpoints is cheaper than the schema suggests, but nothing exists yet.

**No rating/review model exists** `[X]`, despite `/depot/ratings` and rating UI in the prototype.

---

## 10. Authentication, Authorisation, Sessions

`[V]` unless marked.

- **Password hashing:** argon2 (`src/auth/password.service.ts`).
- **Access token:** JWT, default 15 min, `JWT_ACCESS_SECRET`.
- **Refresh token:** separate secret, 30 days default, stored as a row in `sessions` so it can be revoked. `logout` revokes one; `logout-all` revokes the family.
- **Transport:** refresh token in an httpOnly cookie; access token returned in the JSON body for the client to hold.
- **Cookie attributes `[V]` (`auth.controller.ts:168-177`):** `httpOnly: true`, `secure: <COOKIE_SECURE>`, `sameSite: "strict"`, `domain: <COOKIE_DOMAIN>`, `path: "/api/v1/auth"`, `maxAge`.
- **Lockout:** `MAX_FAILED_LOGINS` 5 attempts / `LOCKOUT_MINUTES` 15, counted on the user record.
- **Reset flow:** `forgot-password` issues a `VerificationToken`; **the token is never delivered** — `auth.controller.ts:129` carries `TODO(notifications)`. A user who forgets their password cannot recover today `[X]`.
- **Invites:** `organizations.service.ts:417` and `:441` — same gap; invites are created but never emailed `[X]`.
- **Rate limiting:** global throttler, scaled by `RATE_LIMIT_FACTOR` (production pinned to 1).
- **Admin creation:** no endpoint. `apps/api/README.md` documents promoting a user to `ADMIN` with a direct Prisma update — an operational step, not a feature `[V]`.

**Session defect in the deployed topology `[X]`:** `sameSite: "strict"` plus `domain: fuellink-api.onrender.com` while the web app lives on `fuellink-platform-seven.vercel.app` means the browser will not attach the refresh cookie on a cross-site call. Any future wiring of the console to the API will log users out roughly every 15 minutes and silently fail the refresh. Fix before integration: `sameSite: "none"` + `secure: true` (and a correct `COOKIE_DOMAIN`, or no domain attribute so it binds to the API host), or serve web and API from one site.

---

## 11. API Surface

Prefix `api/v1`. 47 route handlers across 8 controllers `[V]`.

**Auth** — `register`, `login`, `refresh`, `logout`, `logout-all`, `me`, `change-password`, `forgot-password`, `reset-password`.

**Organisations** — `GET/PATCH organizations/me`; `POST organizations/me/documents`; `POST organizations/me/documents/:id/file`; members list/add/patch/delete + invite; bank accounts CRUD.

**Admin (organisations)** — `GET admin/organizations`, `GET admin/organizations/:id`, `POST admin/organizations/:id/review`, `POST admin/documents/:id/review`.

**Depots (public)** — `GET depots`, `GET depots/:idOrSlug`, `GET listings`, `GET listings/:id`.

**Depots (owner)** — `GET my/depots`, `POST my/depots`, `PATCH my/depots/:id`, `POST my/depots/:id/tanks`, `PATCH my/tanks/:id/level`, `POST my/listings`, `PATCH my/listings/:id`.

**Orders** — `POST orders`, `GET orders`, `GET orders/:id`, `POST orders/:id/cancel|allocate|dispatch|confirm-delivery|complete`.

**Payments** — `POST payments/fund`, `GET payments/:id`, `POST orders/:id/release-escrow`, `GET my/balance`, `GET my/statement`, `GET my/payouts`, `POST my/payouts`; admin: `GET admin/payments/pending`, `POST admin/payments/:id/confirm|reject`, `POST admin/orders/:id/refund`, `GET admin/payouts/pending`, `POST admin/payouts/:id/complete`, `GET admin/ledger/integrity`.

**Health** — `GET health` (public) → `{status, db, uptimeSec, version, timestamp}`.

**Live behaviour `[V]`:** health returns `{"status":"ok","db":"up","uptimeSec":16,"version":"0.0.0"}` after a 12.6 s cold start. `version` is `process.env.npm_package_version ?? "0.0.0"`, which is unset when the process is started with `node dist/main.js` — so the field is always `"0.0.0"` in production `[X]`. Cosmetic, but it defeats the purpose of a version probe.

**Not present in the API `[X]`:** disputes, messages/chat, notifications, subscriptions/invoices, quotes, file download for KYC documents, ratings, search/filtering beyond the depot list, any webhook receiver, any background worker or cron.

---

## 12. Frontend Implementation

**Stack `[V]`:** Next.js 16.1.6 App Router, React 19.2.3, TypeScript, Tailwind (v4 utilities + a token layer in `src/app/globals.css`), `zustand` for state, `recharts` (lazy-loaded), `lucide-react`, `react-hot-toast`, `qrcode.react`, `clsx` + `tailwind-merge`. No `framer-motion` (removed; CSS replaces it).

**Build mode `[V]`:** `output: "export"` with `trailingSlash: true`. Everything is a static file. Consequences that shape the whole codebase:
- No server actions, no route handlers, no `headers()`/`cookies()` at runtime.
- Response headers must be set by the host (`vercel.json`).
- Any authenticated data must come from client-side fetches to the API — which do not exist yet.

**Route inventory `[V]` — 50 `page.tsx` files:**

- Public: `/`, `/intel`, `/intel/{prices,sufficiency,lpg,lome,gantry,jet,arbitrage,calculator}`, `/reports`, `/reports/[month]`
- Auth: `/login`, `/register/marketer`, `/register/depot`
- Depot console: `/depot`, `/depot/{inventory,orders,orders/[id],analytics,wallet,verification,private-prices,ratings,chat,ai-settings,settings,settings/subscription}`
- Marketer console: `/marketer`, `/marketer/{depots,depots/[id],orders,orders/[id],orders/new,wallet,alerts,refineries,predictor,subscribe,chat,messages,disputes,disputes/new,settings}`
- Admin: `/admin`, `/admin/{depots,depots/[id],disputes,disputes/[id],marketers,settings}`
- Legal: `/privacy`, `/terms`

**State `[V]`:** three zustand stores in `src/lib/store/index.ts` — auth, depots, refineries. `useAuthStore` holds `{user, isAuthenticated}` with `login(user)`/`logout()`; nothing ever calls `login`, so `isAuthenticated` is permanently false and no route is protected. Stores are not persisted, so a reload loses everything.

**Data `[V]`:** `src/lib/mock-data/{index,depots,refineries}.ts` feed the consoles. `src/lib/intel.ts` exposes the real datasets (`nmdpra`, `pmsPrices`, `lpgPrices`, `lome`, `gantry`, `lpgMarket`, `jet`) and formatting helpers (`fmt`, `fmtNaira`, `fmtPct`, `fmtDelta`, `monthLabel`, `latestMonth`).

**Design system `[V]`:** tokens and type scale in `globals.css` (`.t-*` clamp classes, `.section-padding`, `.page-max`, `.page-x`, `glass-nav`, `press`, `scroll-thin`, `fade-b`, `fade-r`, `.reveal` visible-by-default, `fl-page-enter` transform-only, 16 px mobile input rule, reduced-motion block). Self-hosted fonts: Geist, Geist Mono, Instrument Serif italic.

**Components of record:** `src/components/ui/{Reveal,ToastHost,DashboardShell}.tsx`, `src/components/intel/{charts-lazy,ChartSkeleton,charts,GantryChart,IntelNav}.tsx`, `src/components/shared/{ChatWindow,DepotMap}.tsx`, `src/components/landing/*` (server components except `HowItWorks`, `Pricing`, `Navbar`).

**Quality state `[V]`, re-verified this session:**
- 17 routes × 7 widths (320/375/414/480/834/1280/2560): 0 overflow, 0 blank sections, 0 console errors, 0 page errors.
- `/` FCP 1380 ms, LCP 1380 ms, CLS 0, 376 kB transferred; `/intel/gantry` 1364/1364/0, 404 kB.
- Route JS 167-191 kB gzip per console route, 16.7 kB CSS.
- ESLint: 0 errors, 152 warnings (mostly unused imports).
- No broken internal links: all 27 unique `href` targets resolve to a real route `[V]`.

**Known cosmetic content gaps `[X]`:** landing testimonials, chat messages, depot ratings and the "predictor" series are fabricated or static sample content. They read as real product data. This is a credibility risk for a data-provenance-first brand.

---

## 13. Integrations and External Services

| Service | Purpose | State |
|---|---|---|
| NMDPRA fact-sheet blob container | L0 data source | Working; last successful parse 2026-10-12, no new months found `[V]` |
| Vercel | Hosts the static web app | Live, deployed by CLI, not git-linked `[V]` |
| Render | Hosts the NestJS API | Live, single instance, free-tier cold starts `[V]` |
| Neon | Postgres 17 | Live, migrated, empty `[V]` |
| GitHub Pages | Legacy host for the public site | Live but **stale** (serving the pre-redesign September build) `[V]` |
| GitHub Actions | CI, Pages deploy, monthly ingest | **Disabled for the repo** `[X]` |
| Providus Bank | Intended escrow / payments | Not integrated; interface abstraction only `[V]` |
| Email provider | Password reset, invites, notifications | None configured `[X]` |
| SMS provider | Notifications | None `[X]` |
| Object storage (S3/R2) | KYC and waybill files | None; local disk `[X]` |
| Payment gateway (Paystack etc.) | Card / VA collection | None `[V]` |
| Monitoring / error tracking | Sentry or similar | None `[X]` |
| Notion / Linear / Jira | Project tracking | Empty — no FuelLink content in either workspace `[V]` |

Project tracking lives in `TASKS.md` (untracked) and `docs/`. No external system holds work items.

---

## 14. Configuration and Environment Variables

Names only, never values `[V]`.

**API (`apps/api/.env.example`, validated by `src/config/env.ts`):**
`NODE_ENV`, `PORT`, `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ACCESS_TOKEN_TTL`, `REFRESH_TOKEN_TTL_DAYS`, `CORS_ORIGINS`, `COOKIE_DOMAIN`, `COOKIE_SECURE`, `MAX_FAILED_LOGINS`, `LOCKOUT_MINUTES`, `DELIVERY_AUTO_CONFIRM_HOURS`, `DELIVERY_VARIANCE_TOLERANCE_BPS`, `DEFAULT_FEE_BPS`, `MAX_UPLOAD_BYTES`, `LOG_LEVEL`, `RATE_LIMIT_FACTOR`, `STORAGE_ROOT`, `ESCROW_BANK_NAME`, `ESCROW_ACCOUNT_NAME`, `ESCROW_ACCOUNT_NUMBER`.

**Deployed API environment `[V]`:** all of the above are set in production **except** the three `ESCROW_*` variables, which are present but empty. Consequence `[X]`: the manual-transfer adapter cannot render payment instructions, so escrow funding cannot actually be initiated in production. `CORS_ORIGINS` is pinned to the Vercel host; `COOKIE_DOMAIN` is the Render API host.

**Web:** no `.env` file, no `.env.example`, and no `NEXT_PUBLIC_*` variable is read anywhere in `apps/web/src` `[V]`. Two variables are optional at build time (`NEXT_PUBLIC_BASE_PATH` for GitHub Pages sub-path builds, `NEXT_PUBLIC_SITE_URL` with a `fuellink.ng` default). **An API base URL variable does not exist yet** — the first integration task must introduce one.

---

## 15. Deployment and Hosting

**Current production topology `[V]`:**

```
Browser ──► Vercel (static export, fuellink-platform-seven.vercel.app)
                 │
                 └─ no API calls exist today

Browser/API clients ──► Render (NestJS, fuellink-api-qthr.onrender.com/api/v1)
                              │
                              └──► Neon Postgres 17 (38 tables, empty)
```

**Web deployment `[V]`:** `vercel deploy --prod --yes --archive=tgz` from the repo root by CLI. `.vercel/project.json` pins project `prj_6ZAovuBB11rr8LJF6KP9UhiJmKJn`. Root `vercel.json` sets `trailingSlash: true` and immutable caching for `/_next/static/(.*)` and `*.woff2`, plus `X-Content-Type-Options: nosniff` and a `Referrer-Policy`. **There is no CSP and no `X-Frame-Options` on the web app** `[X]`.

**API deployment `[V]`:** Render web service from the same repo; `apps/api/Dockerfile` exists (multi-stage, `node dist/main.js`, port 4000) but the live service's build method could not be inspected without dashboard access `[U]`. Cold start measured at 12.6 s after idle.

**GitHub Pages `[V]`:** still live at `https://basgenix4u.github.io/fuellink-platform/` but frozen at the 2026-09-22 build (Inter font era, pre-redesign). It is a duplicate, outdated public surface of the same product and should be retired or redirected to avoid confusing visitors and search engines.

**Not configured anywhere `[V]`:** staging environment, database backups policy beyond Neon defaults, uptime monitoring, alerting, log aggregation (Render's own log stream only), CDN purge automation, domain + TLS for `fuellink.ng`.

---

## 16. Tooling, Scripts, Dependencies

**Root scripts `[V]`:** `dev`, `dev:api`, `build`, `start`, `lint`, `typecheck`, `ingest:nmdpra`, `verify:data`, `generate:reports`.

**Web scripts:** `dev`, `build`, `start`, `lint` (eslint), `typecheck` (tsc --noEmit), `ingest:nmdpra` (`tsx scripts/ingest-nmdpra.mts`), `verify:data` (`tsx scripts/verify-data.mts`), `generate:reports` (`tsx scripts/generate-reports.mts`).

**API scripts:** `start:dev`, `build`, `start`, `lint`, `typecheck`, `test` (jest unit), `test:e2e` (jest + real Postgres), plus Prisma scripts.

**Shared package `packages/contracts`:** 382 lines of zod schemas — dataset contracts (`PmsPriceDataset`, `LpgPriceDataset`, `NmdpraDataset`, `LomeDataset`, `GantryDataset`, `JetDataset`, `LpgMarketDataset`, `MonthlyReportSchema`) and `STATE_KEYS`/`STATE_LABELS`. This is the only cross-cutting type contract that exists; API request/response DTOs are **not** yet shared with the web app `[V]`.

**Dependencies of note:** 99 packages were removed during the performance work (framer-motion, 11 unused Radix packages, date-fns, CVA). Remaining direct deps are listed in §12 and §8.

**Known good commands, in this environment `[V]`:**
```
npm run lint          # 0 errors, 152 warnings (web); API clean
npm run typecheck     # passes both workspaces
npm run verify:data   # all 6 datasets valid
npm --workspace @fuellink/api test       # 43 passed
npm --workspace @fuellink/api run test:e2e  # 142 passed (needs TEST_DATABASE_URL)
```

---

## 17. Testing and Verified Quality Status

**Backend `[V]` — verified this session against a freshly initialised local PostgreSQL 17:**
- `npm --workspace @fuellink/api test` → **43/43 passed** (money arithmetic, delivery-variance evaluation, and other pure units).
- `npm --workspace @fuellink/api run test:e2e` → **142/142 passed**, 5 suites: `auth`, `organizations`, `depots`, `orders`, `escrow`. These run against a real database created from the real migrations, so the ledger triggers and check constraints are exercised. `test/global-setup.ts` runs `prisma migrate reset --force` against `TEST_DATABASE_URL` — **never point that at a database whose data you want to keep.**

**Frontend `[V]`:**
- No unit or component tests. No Playwright suite is committed; the browser audits used during development lived in `/tmp` and are not part of the repo.
- Verification is manual: lint, typecheck, static build, then browser sweeps against a local static server and the live host.

**Continuous integration `[X]`:** `.github/workflows/ci.yml` is well-written (Postgres service container, migrations, lint, typecheck, unit, integration, build) but **GitHub Actions is disabled on the repository** (`GET /repos/.../actions/permissions` → `{"enabled": false}`). The last successful CI run was 2026-09-22. Everything merged since — including the entire console redesign and the performance overhaul — never ran through CI. All the green results above are local.

**Security audit `[V]`:** `npm audit --omit=dev` → **14 vulnerabilities: 1 critical, 11 high, 2 moderate**, including `next` (critical), `zod` (high, memory exhaustion while validating oversized constrained collections), `source-map-js`, `body-parser`, `qs`, `multer`/`platform-express`, `sharp`, `postcss`, `nanoid`, `prisma`/`deepmerge-ts`. Fixing `next` requires moving outside the currently pinned range (16.1.6 → 16.4.x) `[V]`.

---

## 18. Problems, Blockers and Risks

### 18.1 Confirmed defects and blockers

**B1 — The web application is not connected to the API at all. [X] [BLOCKER for the product]**
*Where:* `apps/web/src` — no `fetch`, no `axios`, no API base URL variable anywhere.
*Impact:* Nothing a user does in `/login`, `/register/*`, `/depot/*`, `/marketer/*` or `/admin/*` reaches the backend. No account can be created from the UI, no order placed, no escrow funded. The API is reachable only by hand.
*Cause:* Deliberate sequencing — the consoles were built as a design-first prototype while the API was built in parallel.
*Resolves:* A shared API client (`src/lib/api/*`) with typed calls generated from `@fuellink/contracts`, an `NEXT_PUBLIC_API_URL` variable, session bootstrap from `GET /auth/me`, and per-console wiring in this order: auth → organisations/KYC → depot catalogue → orders → payments.
*Status:* Blocking. Everything else in the product is downstream of this.

**B2 — The refresh-token cookie cannot work across the deployed origins. [X] [BLOCKER for B1]**
*Where:* `apps/api/src/auth/auth.controller.ts:168-177` (`sameSite: "strict"`, `domain: COOKIE_DOMAIN` = API host) vs web on a Vercel host.
*Impact:* As soon as the console is wired, sessions will break after 15 minutes and refresh will fail silently; users will be logged out at random.
*Resolves:* `sameSite: "none"` + `secure: true`, and either drop the `domain` attribute or serve both apps from one site (`app.fuellink.ng` + `api.fuellink.ng` behind one registrable domain). Decide this before writing the client.

**B3 — Escrow funding cannot be initiated in production. [X] [BLOCKER for transactions]**
*Where:* `ESCROW_BANK_NAME`, `ESCROW_ACCOUNT_NAME`, `ESCROW_ACCOUNT_NUMBER` are present but empty in the Render environment.
*Impact:* The manual payment adapter has no destination account, so no `payments/fund` call can produce usable instructions. Also, no real escrow bank relationship is known to exist `[U]`.
*Resolves:* Open the bank relationship, populate the three variables, publish the funding instructions in the console, and document the confirmation workflow for admins.

**B4 — GitHub Actions is disabled; nothing is verified automatically. [X] [BLOCKER for safe iteration]**
*Where:* repository settings, not a file.
*Impact:* 45 commits' worth of conventions ("tests must pass before a stage is complete") is enforced only by hand; the monthly data refresh and the Pages deploy silently stopped.
*Resolves:* Re-enable Actions (billing/plan or org policy) and re-run CI on `main`.

**B5 — Password reset and org invites cannot reach a human. [X] [BLOCKER for onboarding]**
*Where:* `apps/api/src/auth/auth.controller.ts:129`, `apps/api/src/organizations/organizations.service.ts:417` and `:441` — three `TODO(notifications)` markers; no mail provider configured.
*Impact:* A user who forgets a password is locked out permanently; an invited colleague never learns of the invite. Real organisations cannot be onboarded.
*Resolves:* Add a transactional email provider (Resend/Postmark/SES) behind a small `NotificationService`, deliver reset and invite tokens, add rate limits and single-use expiry (tokens already exist in `verification_tokens`).

**B6 — Uploaded KYC and waybill documents are stored on ephemeral disk. [X] [BLOCKER for KYC]**
*Where:* `StorageService` writes to `STORAGE_ROOT`, default `<cwd>/.storage`.
*Impact:* Every Render redeploy or restart erases documents that legally justify a verified organisation. KYC review then has no evidence.
*Resolves:* S3-compatible object storage with signed URLs and a database pointer per document; keep the local driver for development behind the same interface.

**B7 — No CSP or frame protection on the web deployment. [X] [security]**
*Where:* `vercel.json` sets only `X-Content-Type-Options` and `Referrer-Policy`.
*Impact:* XSS impact is unbounded on an app whose next phase holds auth tokens; clickjacking is possible.
*Resolves:* Add `Content-Security-Policy` (the app is static and self-hosted, so a strict policy is feasible) plus `X-Frame-Options: DENY` and `Permissions-Policy`.

**B8 — 14 production dependency vulnerabilities, one critical. [X] [security]**
*Where:* `npm audit --omit=dev`.
*Impact:* `next` critical advisory is the headline; `zod`'s memory-exhaustion advisory matters because the API validates every request with it, and the API has a 256 kb body cap but no request-level memory ceiling on constrained collections.
*Resolves:* Upgrade `next` to 16.4.x, `zod` to 4.6.7 (breaking change — coordinate with `packages/contracts`, which pins zod), then re-run the whole suite. Do this as its own commit, not folded into feature work.

**B9 — L0 data is frozen at July 2026. [X] [credibility]**
*Where:* `apps/web/src/data/intelligence/*.json`; `generatedAt` = 2026-09-20; months end at `2026-07`. The unmerged branch `bot/nmdpra-ingest-2026-10-12` contains only timestamp changes, no new months.
*Impact:* The public product's own promise is monthly cadence; visitors see three-month-old "latest" figures.
*Resolves:* Re-enable the ingest job (B4), check whether NMDPRA has published since July, and if the sheets exist, fix the parser for the new layout. If they do not exist, surface "NMDPRA has not published since July 2026" explicitly in the UI instead of implying freshness `[I]`.

**B10 — Duplicate, stale public site on GitHub Pages. [X] [credibility/SEO]**
*Where:* `https://basgenix4u.github.io/fuellink-platform/` serving the pre-redesign build.
*Impact:* Two versions of the same brand are publicly indexable; one is visually old and has different component markup.
*Resolves:* Retire the Pages workflow and add a redirect, or make Pages the canonical host for `/intel` only. Do not leave both.

**B11 — Health endpoint reports version `0.0.0`. [X] [observability]**
*Where:* `apps/api/src/health/health.controller.ts` reads `process.env.npm_package_version`.
*Impact:* Deploy verification cannot tell which build is live.
*Resolves:* Inject the version from `package.json` at build time (e.g. an env value or a generated constant).

### 18.2 Suspected or unquantified issues

**S1 — Render free-tier cold starts (12.6 s observed) will be unacceptable for a trading UI.** `[I]` *Likely:* instance sleeps after idle. *Resolves:* paid instance or a keep-warm ping; measure before deciding.
**S2 — No background jobs anywhere.** `[I]` The 72 h auto-confirm rule and any notification fan-out need a scheduler (cron/queue). Nothing implements them; the state machine documents the rule but no timer enforces it. **This is a real functional gap, not just infrastructure:** an order can sit in `DELIVERED` forever if the buyer never confirms.
**S3 — `test:e2e` resets the target database.** `[V]` It is correct by design but dangerous: a single mis-set `TEST_DATABASE_URL` destroys a real database. Recommend an explicit guard (refuse if the URL contains the production host).
**S4 — No pagination discipline verified on list endpoints.** `[U]` `GET depots`, `GET listings`, `GET orders` — pagination shape not verified in this pass; confirm before seeding volume.
**S5 — Analytics and "predictor" screens show invented series.** `[V]` They are labelled as product features. In a brand built on "no fabricated figures", this is a positioning contradiction; either wire them to real depot data or label them as illustrative.
**S6 — `zustand` auth store is the only auth concept in the client, and it is inert.** `[V]` There is no route protection: `/admin` is reachable by anyone who types the URL. Today that is harmless because the pages hold mock data; the day B1 is fixed it becomes a serious authorization bug. **Build the guard before or with the integration.**
**S7 — Money layer has no reconciliation against the bank.** `[I]` Admin confirmation is manual and the ledger is internal. Nothing compares the ledger to a bank statement; `admin/ledger/integrity` checks internal balance only.
**S8 — No backup/restore drill for Neon.** `[U]` Neon's default retention is assumed sufficient; no restore has been tested.
**S9 — Landing testimonials appear to be fabricated.** `[V]` `src/components/landing/Testimonials.tsx` contains named quotes with no attribution to real customers. Legally and reputationally risky for a Nigerian company.

### 18.3 Not a defect but worth knowing

- The repository is **public** while it contains a business model and a data strategy. That was a deliberate choice (GitHub Pages hosting); if the strategy document should not be public, revisit.
- `TASKS.md` is untracked, so it exists only on one machine. A cloned repo has no work queue.
- The **Prisma schema is 1,118 lines with 2 migrations**. Squashing is unnecessary now, but the next migration must not be generated blindly (`prisma migrate dev`) against the empty production DB without checking drift.

---

## 19. Roadmap

Five phases. Nothing below is claimed as in-progress unless evidence is cited. Sequence is driven by dependencies, not by preference.

### Phase A — Existing foundation (what already exists)

**Delivered and verified:** L0 data engine, validated datasets, 10 monthly reports, 8 public dashboards, arbitrage calculator, landing page, auth/console/admin visual system, static export, CDN caching, responsive + accessibility pass, API foundation with domain model, hardened auth, organisations/KYC, depots/listings, orders lifecycle, escrow + double-entry ledger + payouts, 185 passing tests locally, live web + API + DB deployments.

**Completion criteria (met):** public site serves 0-error pages at 320-2560 px; API health reports the database up; migrations apply cleanly to an empty Postgres 17.

### Phase B — Stabilise the platform (immediate priorities)

Ordered; each item is small and unblocks the next.

1. Re-enable GitHub Actions and get CI green on `main` (B4). Without this, later phases are guesses.
2. Fix the render of health version and add a deploy marker (B11) so every later claim can be checked against a commit.
3. Remediate the 14 vulnerabilities in one isolated commit, `next` and `zod` first (B8).
4. Add CSP, frame and permissions headers to `vercel.json` (B7).
5. Retire or redirect the stale GitHub Pages site (B10).
6. Repair L0 freshness: re-run ingest, publish whatever NMDPRA has released, and make staleness visible if nothing has (B9).
7. Decide and document the auth cookie topology (B2) — this is a decision, not code, and it blocks Phase C.

**Completion criteria:** CI green on `main`; `npm audit --omit=dev` free of critical/high in direct deps; every response header present; `/intel` shows data whose `generatedAt` is within the last 45 days or an explicit staleness notice.

### Phase C — Connect the product (core completion, part 1)

The single largest piece of work in the project.

1. Introduce `NEXT_PUBLIC_API_URL` and a typed API client; add session bootstrap (`GET /auth/me` on load), token refresh, and route guards for `/depot`, `/marketer`, `/admin` (B1 + S6).
2. Wire auth screens to real `register`/`login`/`logout`; delete the fake delays.
3. Wire organisation setup: profile, KYC document upload against the real storage adapter (B6 first), verification status display, admin review queue.
4. Wire depot inventory and listings: real tanks, real levels, real listings, private price entry.
5. Wire the marketplace and order entry: real depot catalogue, real order creation with `Idempotency-Key`.
6. Deliver transactional email for reset and invites (B5) — a prerequisite for real users, not a nicety.

**Completion criteria:** a real user can register, be verified by an admin, publish a listing, and place an order with no mock data in the path.

### Phase D — Close the money loop (core completion, part 2)

1. Populate escrow account configuration and publish funding instructions (B3).
2. Wire `payments/fund`, the admin confirm/reject queue, escrow release and refund into the UI.
3. Implement the scheduler that enforces the 72 h auto-confirm and variance rules (S2) — otherwise orders strand.
4. Wire wallet, statement and payouts to `my/balance`, `my/statement`, `my/payouts`, and the admin payout queue.
5. Add a reconciliation view that compares ledger balances to the bank account (S7).
6. Seed a fee policy and verify commission posting end to end.

**Completion criteria:** one complete order — from listing to payout — executed by two real organisations, with the ledger balanced and the bank statement matching.

### Phase E — Complete the surface and expand (advanced)

Only after Phase D produces real transactions.

1. Build the missing API domains that the schema already models: disputes + evidence, chat/conversation with per-depot private pricing, notifications and preferences, subscriptions/invoices, quotes and loading slots.
2. Add the missing `Rating` model and reviews.
3. Real analytics for depot and marketer consoles, computed from their own transaction data; retire or clearly label the current synthetic charts.
4. L2 LPG and L3 aviation as products on the same rails (datasets already exist).
5. Trade credit on the ledger history (the L4 ambition). Requires a lending partner and a risk policy that does not exist yet.
6. Scale work: read replicas, queue-based notifications, object storage CDN, per-endpoint rate limits, observability (Sentry/metrics).

**Completion criteria per item is not defined in any project document `[U]`.** Treat E as directional.

---

## 20. Decisions

### Final (recorded in `docs/PRODUCT-PLAN.md` as D1-D10, and implemented in code)

| ID | Decision | Evidence |
|---|---|---|
| D1 | Double-entry ledger as the accounting backbone | `src/ledger/ledger.service.ts`, DB triggers `[V]` |
| D2 | Integer kobo, `BigInt` in the ledger, no floats in money | `src/common/money.ts`, `money.spec.ts` `[V]` |
| D3 | `PaymentProvider` abstraction; manual bank transfer first | `src/payments/provider.interface.ts` `[V]` |
| D4 | Manual KYC review, not automated | `verification_reviews`, admin review endpoints `[V]` |
| D5 | Deterministic analytics; no prediction, no fabricated figures | `generate-reports.mts` header, dataset provenance `[V]` |
| D6 | Refresh tokens in httpOnly cookies with server-side revocation | `sessions` table, `auth.controller.ts` `[V]` |
| D7 | Authenticated app served from Vercel, not GitHub Pages | Deployment reality `[V]` |
| D8 | Idempotency keys on unsafe operations | `idempotency.service.ts` `[V]` |
| D9 | Row-level check constraints + optimistic locking | Live DB constraints `[V]` |
| D10 | `@fuellink/contracts` is the single schema package | `packages/contracts` `[V]` |

### Tentative

- **Static export for the whole web app.** Chosen for cheap hosting and CDN speed. It is the reason there is no server-side session and why the host must set headers. Workable, but if the console ever needs SEO-friendly authenticated pages or server-side auth, this decision will be revisited `[I]`.
- **`fuellink.ng` as the production domain.** Referenced everywhere, attached nowhere `[U]`.
- **LPG and aviation verticals.** Datasets exist, product decisions do not `[U]`.

### Unresolved

1. **Where will authenticated sessions live** — cross-site cookie (needs `sameSite: none`) or same registrable domain for web and API? Blocks B2 and all of Phase C.
2. **Which bank holds escrow, and is the relationship open?** Blocks B3.
3. **Does an NMDPRA data relationship exist or is it still an unsent draft?** `docs/outreach-nmdpra.md` is a draft with a placeholder `{N}`.
4. **Is FuelLink taking custody of money at any point?** The design says no (bank holds it), but no document addresses licensing, CBN/regulatory posture, or KYC/AML obligations beyond manual review.
5. **What is the commission model in practice?** `DEFAULT_FEE_BPS` = 100 (1 %) is a default, not a pricing decision. No `FeePolicy` row exists anywhere.
6. **What happens to the fabricated marketing content** (testimonials, ratings, predictor)? Keep, label, or remove.
7. **Who operates admin?** One person, no admin UI wired, no audit review process.

---

## 21. Instructions for Future AI Coding Agents

Read this section before touching anything.

### Read these first, in this order
1. `PROJECT_DETAIL.md` (this file).
2. `README.md` — layer model and monorepo layout.
3. `docs/PRODUCT-PLAN.md` — decisions D1-D10, the domain model, and the authoritative order state machine. **This document overrides your instincts about how to model money or orders.**
4. `apps/api/prisma/schema.prisma` — the real domain model.
5. `apps/api/src/main.ts` and `src/config/env.ts` — how the API boots and what it refuses to run without.
6. `apps/web/src/app/globals.css` — the token and motion system. Every UI change must use these tokens.
7. `TASKS.md` if it exists locally (untracked; may be absent in a clone).

### Non-negotiable conventions established by the operator
- **Never** add comments to code. Not explanatory, not TODO, not section headers. (`TODO(notifications)` markers already in the codebase are pre-existing; do not add more.)
- **No AI filler** in prose, commits or messages. Plain, direct sentences.
- **Commit as the repository owner**, never as an AI. No `Co-authored-by`, no "Generated with" trailers, no attribution of any kind.
- **Commit straight to `main`.** The PR history (10 PRs, all merged) is legacy; the current convention is direct commits.
- **No secrets** in code, commits, logs, or documents. Credentials live outside the repo in mode-0600 files.
- **Do not redesign.** The visual system is deliberate: self-hosted Geist / Geist Mono / Instrument Serif, the `.t-*` clamp type scale, the token palette, transform-only page transitions, visible-by-default reveals. Adding a page means matching it, not inventing a new look.
- **Never remove a feature to gain speed.** Performance work must not delete capability.
- Tests must pass before a stage is considered done: `npm run lint`, `npm run typecheck`, `npm run verify:data`, API unit + e2e, and a production build.

### Architectural patterns to respect

**API**
- One NestJS module per domain; controller → service → Prisma. No Prisma calls from controllers.
- Every error is a typed error from `src/common/errors.ts`, mapped by `AllExceptionsFilter` to a stable `ErrorCode`. Never throw bare `Error` in a request path.
- Every unsafe mutation goes through `IdempotencyService.execute` with an endpoint key and the request body.
- Money is integer kobo (`src/common/money.ts`). `BigInt` crosses into the ledger. No `number` arithmetic on amounts, no `parseFloat`.
- Authorisation is declarative: `@Roles`, `@OrgRoles`, `@RequireVerifiedOrg`. Do not hand-roll checks inside services.
- Validate input with zod at the boundary (`ZodValidationPipe`); validate environment only in `config/env.ts`.
- Anything that changes state also writes an audit row via `AuditService`.
- Storage, payments and notifications are interfaces with one adapter each. Adding a vendor means adding an adapter, never editing business logic.

**Web**
- `output: "export"` — no server-only APIs. If you need data, it comes from a client component fetch to the API, or from a committed JSON dataset.
- Server components by default; `"use client"` only where state, effects or events exist.
- **Do not reintroduce the `Reveal` observer pattern.** Sections must be visible at first paint. There is a history of blank-section bugs caused by opacity-0 defaults; the CSS `animation-timeline: view()` approach plus visible-by-default is the fix.
- **Do not format dates or call `new Date()`/`Date.now()` during render in a prerendered route.** This produced hydration error #418 twice. Render static strings or format after mount.
- Charts come only from `src/components/intel/charts-lazy.tsx`. Do not import `recharts` directly in a page.
- Nav active state must normalise the path (`normalizePath` in `src/lib/utils.ts`) because the host and the prerender disagree about trailing slashes. Any new nav component must do the same.
- Use the existing primitives (`Button`, `Badge`, `Card`, `Input`, `DashboardShell`, `ToastHost`). `Badge` variants are `default|primary|secondary|outline|danger|success|warning|stock-*` — there is no `neutral`. There is no `xs:` breakpoint.
- Tables need explicit `min-w-0` on flex ancestors and their own horizontal scroll wrapper; overflow bugs in this codebase have all been missing `min-w-0`.

**Cross-cutting**
- A shape used by both apps belongs in `packages/contracts`. Do not duplicate a domain type in the web app.
- Dataset files under `apps/web/src/data/` are validated by `verify:data` against the contracts. Never hand-edit a figure without a source URL.

### Sensitive areas — treat with care

| Area | Why |
|---|---|
| `apps/api/src/ledger/*`, `src/payments/*`, `src/common/money.ts` | Money correctness. Database triggers reject unbalanced ledger entries; a "fix" that bypasses them corrupts accounting. |
| `apps/api/prisma/migrations/*` | Already applied to production. Never edit an existing migration; add a new one. |
| Order status transitions | The state machine is contractual (see PRODUCT-PLAN §). Adding a transition means writing the invariant that guards it. |
| `apps/api/src/auth/*` | Cookie/session topology is an open decision (B2). Do not "fix" it casually. |
| `apps/api/test/**` | `global-setup.ts` runs `migrate reset --force`. Never point `TEST_DATABASE_URL` at anything real. |
| `vercel.json` | Contains the trailing-slash setting that fixed the hydration class of bug and the cache headers. |
| `apps/web/src/app/globals.css` | The entire visual system depends on it. Add tokens; do not rewrite. |
| Production database | Read-only for investigation. No writes, no `db push`, no seeding. |

### Testing expectations
- New API behaviour ships with an e2e test in `apps/api/test/` covering the happy path **and** the invariant it protects (constraint violation, forbidden role, double-spend, replay).
- New pure logic ships with a unit test next to it (`*.spec.ts`).
- New web route: verify at 360 px and 1280 px with no horizontal overflow, no console error, no hydration warning, and (if it renders data) no blank section at first paint.
- After any `next.config.ts` change, run a full `rm -rf .next out && next build` with **no dev server running** — a resident dev server makes the build die with exit 137 (OOM).

### Migration and dependency considerations
- **Understand the architecture before adding a dependency.** This codebase deliberately removed 99 packages, including a whole animation library, and replaced them with CSS. Justify any new client library against transfer size and against the existing primitives.
- Adding a dependency that duplicates an existing capability (state, toasts, icons, charts, dates) will be rejected in review.
- `zod` is pinned at 3.x in two workspaces. Upgrading to 4.x is a breaking change across `packages/contracts` and the API — do it as its own commit with the full suite green.
- New Prisma models require: schema change → new migration (never edit the old one) → service → controller → DTO → contract type → e2e test.
- The web app has no environment variables today. The first one (`NEXT_PUBLIC_API_URL`) must be added to Vercel's project settings as well as to a new `.env.example`.

### Do not duplicate
- Do not create a second HTTP client, a second money helper, a second date formatter, a second chart loader, or a second design token set. Extend what exists.
- Do not add a second source of truth for domain types. `packages/contracts` or the Prisma schema, never both hand-maintained.
- Do not create documentation files unless the operator explicitly asks (this file is the exception they requested).

---

## 22. Verification Log and Limits

**What was executed for this document (all read-only on production):**
- Full file-tree walks of `apps/web/src`, `apps/api/src`, `apps/api/prisma`, `packages/contracts`, `.github/workflows`, `docs/`.
- `npm run lint`, `npm run typecheck`, `npm run verify:data` — all pass.
- `npm --workspace @fuellink/api test` → 43 passed; `test:e2e` → 142 passed, executed against a **local** PostgreSQL 17 instance on port 5433 created for this purpose (never the production database).
- `npm audit --omit=dev` → 14 vulnerabilities.
- `psql` read-only against the Neon production database: `information_schema.tables`, `_prisma_migrations`, `pg_stat_user_tables`, `pg_constraint`, `information_schema.triggers`, one `SELECT` on `audit_logs`.
- `curl` against the live web (200), the live API health (200, 12.6 s, `version: "0.0.0"`), and the GitHub Pages site (200, stale build).
- GitHub REST API: repository metadata, workflow runs, workflow list, `actions/permissions` (`enabled: false`), the failed ingest run's job steps, pull request list.
- Git: full `git log`, branch list, diff of `origin/bot/nmdpra-ingest-2026-10-12` against `main`.
- Link audit: all 27 unique internal `href` targets resolve against the route set.
- Connected-app check: Notion search and Linear issue search for "FuelLink" both returned no results.

**What could not be inspected:**
- Render service build configuration and instance plan (no dashboard access in this session). Cold-start figure is measured, not configured.
- Neon plan, retention and backup policy.
- Vercel project settings and environment variables (only `.vercel/project.json` and `vercel.json` were readable).
- Whether NMDPRA has published fact sheets after July 2026 — the ingest run reported no *changes*, not what it found.
- Any bank relationship or correspondence regarding escrow.
- The contents of `TASKS.md`-adjacent machine state, i.e. anything the operator tracks outside the repo `[U]`.

**Bias to be aware of when reading this document:** it was written by inspecting code, not by interviewing the founder. Where the founder's intent and the code disagree, the code is what users experience, and it is what this document reports. Sections marked `[I]` are this document's judgement and should be confirmed before being quoted back as project decisions.
