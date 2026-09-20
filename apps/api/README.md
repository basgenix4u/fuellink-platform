# FuelLink API

Exchange backend for the FuelLink platform. **NestJS 11 + Prisma 6 + PostgreSQL**, zod-validated input, JWT auth with role-based access control (RBAC).

## What's here (Phase 2, scaffold → working core)

| Module | Endpoints (under `/api/v1`) | Auth |
|---|---|---|
| Health | `GET /health` | public |
| Auth | `POST /auth/register` · `POST /auth/login` · `GET /auth/me` | public / Bearer |
| Users | `GET /users` · `GET /users/:id` · `PATCH /users/:id/role` · `PATCH /users/:id/status` | ADMIN |
| Depots | `GET /depots` · `GET /depots/:id` (public registry) · `POST /depots` · `PATCH /depots/:id` · `DELETE /depots/:id` (soft) | public read; DEPOT/ADMIN write (owner-only) |
| Escrow | `POST /escrow` · `GET /escrow` · `GET /escrow/:id` · `PATCH /escrow/:id` (state transitions) | Bearer; role-scoped |

**Roles:** `ADMIN` (platform operator), `DEPOT` (depot owner/manager), `MARKETER` (independent marketer). Self-service registration is restricted to `DEPOT`/`MARKETER`; `ADMIN` is provisioned manually.

**Money:** stored as `BigInt` kobo (never floats) and serialized to decimal strings in every response (global interceptor). `totalKobo = quantityLiters × unitPriceKobo`, computed server-side.

**Escrow state machine:** `DRAFT → PENDING_PAYMENT → BANK_HELD → RELEASED`, with `CANCELLED` and `DISPUTED` branches. Bank-held semantics: `BANK_HELD` requires a `bankRef` (the bank's hold reference) and is operator-only until the Providus webhook lands; `RELEASED` is operator-only until the buyer delivery-confirmation flow ships. See the PROVIDUS INTEGRATION block at the top of `src/escrow/escrow.service.ts` — the bank API wiring is deliberately stubbed pending Providus API access + legal structure.

## Local development

```bash
# 1. Postgres + Redis (from repo root)
docker compose up -d

# 2. Env + deps (from repo root — workspaces)
cp apps/api/.env.example apps/api/.env
npm install

# 3. Database
cd apps/api
npm run prisma:migrate     # applies prisma/migrations (init migration committed)
npm run start:dev          # tsx watch on :4000
```

Create the first admin (one-off, via `tsx`):

```ts
// e.g. scripts/make-admin.ts — run with: DATABASE_URL=… npx tsx scripts/make-admin.ts
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();
await prisma.user.create({
  data: {
    email: "admin@fuellink.ng",
    passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD ?? "change-me-now", 10),
    name: "Platform Admin",
    role: Role.ADMIN
  }
});
```

## Scripts (from `apps/api`)

| Script | Purpose |
|---|---|
| `npm run build` | `prisma generate` + `tsc` → `dist/` |
| `npm run start` | run compiled `dist/main.js` |
| `npm run start:dev` | tsx watch (dev) |
| `npm run lint` | eslint (flat config) |
| `npm run typecheck` | tsc --noEmit |
| `npm run prisma:migrate` | `prisma migrate deploy` (apply committed migrations) |
| `npm run prisma:studio` | Prisma Studio |

## Deployment targets (planned)

- **API host:** Railway or fly.io — build `Dockerfile` (multi-stage, `node:20-slim`), start `node apps/api/dist/main.js`, health check `GET /api/v1/health`.
- **Postgres:** Neon or Supabase (managed). Run `npm run prisma:migrate` on deploy.
- **Redis:** Upstash — comes in with the queue work (BullMQ) for order webhooks + notifications.
- **Env:** see `.env.example`. `JWT_SECRET` ≥ 32 chars; `CORS_ORIGINS` comma-separated (prod web is `https://fuellink.ng`).

## Conventions

- Input validation is **zod** (`ZodValidationPipe`) — no class-validator; schemas live in each module's `dto.ts`.
- Guards: `JwtAuthGuard` (verify + re-fetch user every request, so role/status changes apply immediately) → `RolesGuard` (enforces `@Roles(...)` metadata).
- Errors: Nest exception filters → `400` validation (with field messages), `401` auth, `403` RBAC, `404`, `409` conflicts.
- Soft deletes for `Depot` (`isActive`) — order history must survive (`onDelete: Restrict`).
