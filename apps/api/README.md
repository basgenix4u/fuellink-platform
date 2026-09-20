# @fuellink/api

Scaffold placeholder. The API service lands in **Phase 2** (Exchange core) with:

- **NestJS** modules + **Prisma/Postgres** persistence
- **Redis + BullMQ** jobs (price ingestion, order state transitions, webhook fan-out)
- **Socket.IO** for live chat/order events
- **Providus** bank-held escrow + card APIs; durable webhook/event bus for bank callbacks
- **packages/contracts** for shared zod schemas (domain model moves from `apps/web/src/types` here in Phase 2)

Phase 1 (L0 Intelligence) is data-driven from NMDPRA public fact sheets and needs no backend — see `apps/web/scripts/ingest-nmdpra.mjs`.
