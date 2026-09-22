# FuelLink — Production Implementation Plan

Status: **active build plan**. Written 2026-09-22. Supersedes the Phase-2 sketch in `STRATEGY.md` §5 for everything below the intelligence layer.

---

## 1. What this product is

A downstream petroleum **exchange** for Nigeria: independent marketers buy PMS/AGO/ATK/LPG from verified depots and refineries at prices they can actually see, and pay through **bank-held escrow** so neither side carries counterparty risk.

Around that spine sit the things that make the spine usable: verification (who is real), inventory (what is actually available), orders (the contract), escrow + ledger (the money), delivery confirmation (the trigger), disputes (when it goes wrong), notifications (so nobody has to refresh), wallet (float and settlement), subscriptions (how we earn), messaging (how they negotiate), and analytics (why they trust us).

### Users
| Role | Who they are | What they need to do |
|---|---|---|
| **Marketer** | Independent fuel marketer / station owner | Find product near them at a real price, verify the depot is real, order, pay safely, confirm delivery, dispute if short-delivered |
| **Depot** | Depot, terminal, or refinery sales desk | List real available stock and prices, receive verified buyers, get paid on delivery without chasing, manage loading |
| **Admin (us)** | Platform operator | Verify both sides, confirm bank movements, resolve disputes, keep the market honest |

### Non-functional requirements
- **Money is never wrong.** Double-entry ledger, integer kobo, atomic transactions, idempotent writes. A reconciliation query must always balance to zero.
- **No fabricated data.** The locked L0 policy extends to the exchange: no invented prices, no simulated stock, no fake forecasts.
- **Auditability.** Every state change to money, verification, or an order is attributable to an actor and timestamped. Nigerian financial/regulatory scrutiny is a real scenario.
- **Availability** matters more than latency: a depot listing being wrong is worse than it loading in 400ms.

---

## 2. Decisions taken (and why)

| # | Decision | Rationale | Cost of reversal |
|---|---|---|---|
| D1 | **Double-entry ledger** for all money, not balance columns | Balance columns drift and cannot be audited. Every movement is two entries that sum to zero. | High — do it now |
| D2 | **Integer kobo (BigInt)** everywhere | Floats lose money. ₦ amounts are serialized as decimal strings over the wire. | High |
| D3 | **Payment provider abstraction** (`PaymentProvider` interface) with a **manual bank-transfer adapter** live now; Providus/Paystack adapters slot in behind the same interface | You have no Providus credentials yet, but the business can legally operate on confirmed bank transfers with admin reconciliation from day one | Low — that's the point |
| D4 | **Manual KYC review** with a document vault + audit trail, behind a `VerificationProvider` interface | Trust is the product. A human reviewing a CAC cert and an NMDPRA licence is *more* credible than an automated BVN ping, and needs no vendor. | Low |
| D5 | **Deterministic analytics, no price prediction** | A forecast presented as data can cost a marketer real money on a single truck. We show sourced figures, spreads, and landed-cost arithmetic, labelled as derived. | n/a |
| D6 | **Refresh-token sessions in httpOnly cookies**, short-lived access tokens, server-side session revocation | Tokens in localStorage are stolen by any XSS. Revocation must be instant when an account is suspended. | Medium |
| D7 | **The authenticated app must run on a Node host (Vercel), not static Pages** | Static export cannot do auth middleware, server-side redirects, or first-party cookies. Public `/intel` + `/reports` stay static and can keep deploying to Pages. | Medium — plan for it now |
| D8 | **Idempotency keys** on every money-moving and order-creating endpoint | Mobile networks in Nigeria retry. A double-submitted order is a double truck. | High |
| D9 | **Postgres row-level constraints + optimistic locking** on inventory and orders | Two marketers buying the last 30,000 litres simultaneously must not both succeed. | High |
| D10 | Keep `@fuellink/contracts` as the single shared schema package | The web app and API must not drift on what an Order is. | Medium |

### D7 in practice — deployment topology
```
fuellink.ng                 → Vercel (Next.js, SSR + middleware)  ← the app
  /intel, /reports          → statically generated, revalidated on data push
  /app/**                   → authenticated, server-guarded
  /api/**                   → Vercel rewrite → api.fuellink.ng  (same-origin ⇒ first-party cookies)
api.fuellink.ng             → Railway (NestJS) + Neon Postgres + Upstash Redis
basgenix4u.github.io/...    → stays as the free public mirror of the intel layer
```

---

## 3. Product-manager recommendations (changes to what the mock app implies)

I am not going to faithfully reproduce all 38 mock screens — several of them describe features that would be wrong, unsellable, or dangerous in the real market. My recommendations:

**Cut or change**
1. **"Price predictor" → "Landed cost & spread calculator."** A forecast is a liability. Same screen real estate, real arithmetic, sourced inputs. *(Your call already: deterministic.)*
2. **"AI chatbot negotiation" → "Structured quote requests (RFQ) + human chat."** Marketers don't want a bot inventing terms; they want a fast, auditable quote. I'll build RFQ → depot counter-offer → accept, with real-time messaging attached to the thread. An LLM assistant can later *summarise* a thread or draft a reply, never commit to a price. This is more valuable and far less risky.
3. **Wallet: not a stored-value account.** Holding customer funds is a licensed activity (CBN). Instead: wallet = **settlement account view** (your escrow holds, your released payouts, your fees), with payouts going to a verified bank account. Same screen, legal.
4. **Subscription: don't gate the intel layer.** Charge depots for listing + transaction fees; charge marketers for premium features (alerts, API, credit). Gating public data kills the SEO/authority flywheel Phase 1 built.

**Add (missing from the mock, needed in reality)**
5. **Truck / haulage tracking + waybill capture.** The order isn't done at payment; it's done when the product is in the buyer's tank. Delivery confirmation with waybill + quantity-received is the trigger for escrow release — and the #1 source of disputes.
6. **Quantity reconciliation & short-delivery handling.** Loaded vs delivered litres differ (temperature, theft, meter error). Needs a tolerance policy and a partial-release path, or every delivery becomes a dispute.
7. **Multi-user organisations with roles.** A depot is a company: a sales rep lists prices, a manager approves, finance sees payouts. Single-user accounts break on contact with a real depot.
8. **Price validity windows.** Depot prices in Nigeria move intraday. Every listed price needs `valid_until` and an explicit expiry, or you will be sued over a stale price.
9. **Allocation / loading slots.** Depots sell against loading capacity per day. Without it, you oversell.
10. **Notification fan-out (email + SMS/WhatsApp).** In-app only is useless to a depot manager who lives on WhatsApp.

I'll implement 5–10 as part of the spine. 1–4 change existing screens rather than add new ones.

---

## 4. Domain model (authoritative)

```
Organization ──< OrgMember >── User ──< Session
     │                                 └─< AuditLog (actor)
     ├─< KycDocument ──< VerificationReview
     ├─< BankAccount
     ├─< Depot ──< Tank
     │      ├─< ProductListing ──< PriceHistory
     │      └─< LoadingSlot
     ├─< Order ─┬─< OrderEvent            (immutable timeline)
     │          ├─< OrderDocument         (waybill, meter ticket)
     │          ├─< Delivery              (loaded vs received litres)
     │          └─< Dispute ──< DisputeMessage / DisputeEvidence
     ├─< Conversation ──< Message ──< Attachment
     ├─< Subscription ──< Invoice
     └─< NotificationPreference

LedgerAccount ──< LedgerEntry >── LedgerTransaction   (every tx balances to 0)
Payment ── PaymentAttempt         (provider-agnostic)
IdempotencyKey                    (dedupe of all unsafe writes)
Notification                      (fan-out record per channel)
```

**Money invariant:** `SELECT SUM(amount_kobo) FROM ledger_entries GROUP BY transaction_id` must be `0` for every transaction. Enforced by a DB constraint trigger *and* asserted in tests.

**Order lifecycle** (each transition writes an `OrderEvent` and is permission-checked):
```
DRAFT → QUOTED → CONFIRMED → AWAITING_PAYMENT → ESCROW_FUNDED
      → ALLOCATED → LOADING → IN_TRANSIT → DELIVERED → COMPLETED
                                     ↘ DISPUTED ↗ (→ RESOLVED → COMPLETED | REFUNDED)
      ↘ CANCELLED (pre-funding, or admin-forced with refund)
```
Escrow release fires on `DELIVERED → COMPLETED`, either by buyer confirmation or by a 72-hour auto-confirm timer, and is blocked while a dispute is open.

---

## 5. Build phases

| Phase | Content | State |
|---|---|---|
| **P3 — Foundation** | Full schema + migrations; hardened auth (argon2id, refresh rotation, revocation); RBAC incl. org scoping; security middleware (helmet, rate limiting, CORS, body limits); global error contract; request/audit logging; idempotency; **test harness against real Postgres** | ✅ **DONE** — PR #6, 43 unit + 33 integration |
| **P4a — Trust & supply** | Organisations, KYC vault + admin review queue, depots, tanks, product listings with validity windows, inventory, loading slots | ✅ **DONE** — PR #7, +57 integration |
| **P4b — Trade** | Orders + full lifecycle, allocation, delivery + waybill + quantity reconciliation, oversell prevention, idempotent placement | ✅ **DONE** — PR #8, +28 integration (118 total) |
| **P4c — Money** | Double-entry ledger, escrow fund/release/refund, payment provider abstraction + manual bank-transfer adapter, payouts, fee revenue | ✅ **DONE** — PR #9, +24 integration (142 total) |
| **P4d — Around the trade** | Disputes, notifications (in-app + email + SMS), messaging/RFQ threads, analytics dashboards | ← **next** |
| **P4e — Web app** | Replace mock data with the real API: auth flows, depot console, marketplace, order workspace, admin review console | |
| **P5 — Hardening** | Load/edge-case testing, full authz matrix, penetration review, data-integrity jobs, backup/restore drill | |
| **P6 — Deploy** | Vercel + Railway + Neon + Upstash, migrations in CI/CD, observability, rollback runbook | |
| **P7 — Launch readiness** | Documented status of every feature: complete / tested / known-limited | |

### Verified behaviour so far (not claims — test-backed)
- Unbalanced ledger transaction (off by ₦0.01) rejected at COMMIT; ledger rows immutable.
- Refresh-token reuse revokes the whole session family; logout kills a stolen access token.
- Unverified or suspended organisations cannot list or trade; suspension withdraws listings.
- A script renamed `.pdf` is rejected by magic-byte inspection.
- 10 buyers racing for 90,000 L produce exactly 3 orders of 30,000 L — never an oversell.
- 10 concurrent listing edits produce exactly 1 winner and 9 `409`s — no lost updates.
- A 1,000 L short delivery is flagged and blocks completion; 100 L (within 0.5%) passes.
- Retried order placement with the same Idempotency-Key returns the original order.
- A full fund → deliver → release → payout cycle conserves value exactly: buyer escrow 0,
  supplier payable 0, platform holding exactly its commission, grand total 0.
- One bank credit cannot fund two orders; a payment cannot be confirmed twice; an
  amount mismatch (even ₦1) blocks funding entirely.
- Escrow is frozen while a dispute is open and while a delivery is out of tolerance.
- Two concurrent full-balance payout requests yield exactly one payout (double-spend fixed).

---

## 6. Honesty ledger

Things I will **not** claim:
- That any of this is secure until the authz matrix tests and a review pass exist (P5).
- That a payment integration works before real credentials and a sandbox transaction.
- That the system scales beyond what I have actually measured.

Things that are **genuinely blocked on you** (not on engineering):
1. Providus API credentials + escrow legal structure → real bank escrow.
2. A payment processor account (Paystack/Flutterwave) → card/transfer funding.
3. Domain + Vercel/Railway/Neon accounts → the authenticated app going live.
4. SMS/WhatsApp sender (Termii/Africa's Talking/Twilio) → notification fan-out.
5. Company legal entity + terms/privacy copy → lawful onboarding of real depots.

Everything else I build now, behind interfaces, so the day credentials land it is a config change and an adapter, not a rewrite.
