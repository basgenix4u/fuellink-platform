import { INestApplication } from "@nestjs/common";
import { OrderStatus, VerificationStatus } from "@prisma/client";
import request from "supertest";
import { createTestApp, prisma, resetDatabase } from "./helpers";
import { authHeaderFor } from "./auth-helpers";
import { seedAdmin, seedDepot, seedListing, seedOrg } from "./factories";

describe("Orders (integration)", () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;

  beforeAll(async () => {
    app = await createTestApp();
    http = request(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  /** Seller + buyer + depot + listing, ready to trade. */
  async function tradingPair(listingOverrides = {}) {
    const seller = await seedOrg({ type: "DEPOT" });
    const buyer = await seedOrg({ type: "MARKETER" });
    const depot = await seedDepot(seller.orgId);
    const listing = await seedListing(depot.id, listingOverrides);
    return { seller, buyer, depot, listing };
  }

  // -------------------------------------------------------------------------
  describe("Placing an order", () => {
    it("creates an order with server-computed totals", async () => {
      const { buyer, listing } = await tradingPair({ pricePerLitreKobo: 114_000n });

      const res = await http
        .post("/api/v1/orders")
        .set(await authHeaderFor(app, buyer.userId, buyer.orgId))
        .send({ listingId: listing.id, quantityLitres: 33_000, deliveryState: "Lagos" })
        .expect(201);

      // 33,000 L x ₦1,140.00 = ₦37,620,000.00 = 3,762,000,000 kobo
      expect(res.body.subtotalKobo).toBe("3762000000");
      // Default fee 1% = 37,620,000 kobo
      expect(res.body.feeKobo).toBe("37620000");
      expect(res.body.totalKobo).toBe("3799620000");
      expect(res.body.status).toBe(OrderStatus.AWAITING_PAYMENT);
      expect(res.body.ref).toMatch(/^FL-\d{4}-[0-9A-F]{8}$/);
    });

    it("reserves the volume so it cannot be sold twice", async () => {
      const { buyer, listing } = await tradingPair({ availableLitres: 50_000 });

      await http
        .post("/api/v1/orders")
        .set(await authHeaderFor(app, buyer.userId, buyer.orgId))
        .send({ listingId: listing.id, quantityLitres: 30_000 })
        .expect(201);

      const fresh = await prisma.productListing.findUniqueOrThrow({ where: { id: listing.id } });
      expect(fresh.reservedLitres.toString()).toBe("30000");
      // Availability is unchanged until the product physically leaves.
      expect(fresh.availableLitres.toString()).toBe("50000");
    });

    it("records an immutable opening event", async () => {
      const { buyer, listing } = await tradingPair();
      const res = await http
        .post("/api/v1/orders")
        .set(await authHeaderFor(app, buyer.userId, buyer.orgId))
        .send({ listingId: listing.id, quantityLitres: 1000 })
        .expect(201);

      const events = await prisma.orderEvent.findMany({ where: { orderId: res.body.id } });
      expect(events).toHaveLength(1);
      expect(events[0].toStatus).toBe(OrderStatus.AWAITING_PAYMENT);
      expect(events[0].fromStatus).toBeNull();
    });

    it("refuses to exceed available volume", async () => {
      const { buyer, listing } = await tradingPair({ availableLitres: 10_000 });
      const res = await http
        .post("/api/v1/orders")
        .set(await authHeaderFor(app, buyer.userId, buyer.orgId))
        .send({ listingId: listing.id, quantityLitres: 20_000 })
        .expect(400);
      expect(res.body.error.code).toBe("INSUFFICIENT_INVENTORY");
    });

    it("refuses an expired listing", async () => {
      const { buyer, listing } = await tradingPair({ validUntil: new Date(Date.now() - 3600_000) });
      const res = await http
        .post("/api/v1/orders")
        .set(await authHeaderFor(app, buyer.userId, buyer.orgId))
        .send({ listingId: listing.id, quantityLitres: 1000 })
        .expect(400);
      expect(res.body.error.code).toBe("LISTING_EXPIRED");
    });

    it("refuses when the price moved under the buyer", async () => {
      const { buyer, listing } = await tradingPair({ pricePerLitreKobo: 114_000n });

      const res = await http
        .post("/api/v1/orders")
        .set(await authHeaderFor(app, buyer.userId, buyer.orgId))
        // Buyer saw an older, cheaper price.
        .send({ listingId: listing.id, quantityLitres: 1000, expectedPricePerLitreKobo: "110000" })
        .expect(400);

      expect(res.body.error.message).toMatch(/price changed/i);
      expect(await prisma.order.count()).toBe(0);
    });

    it("proceeds when the expected price still matches", async () => {
      const { buyer, listing } = await tradingPair({ pricePerLitreKobo: 114_000n });
      await http
        .post("/api/v1/orders")
        .set(await authHeaderFor(app, buyer.userId, buyer.orgId))
        .send({ listingId: listing.id, quantityLitres: 1000, expectedPricePerLitreKobo: "114000" })
        .expect(201);
    });

    it("enforces the depot's minimum order", async () => {
      const { buyer, listing } = await tradingPair({ minOrderLitres: 5000 });
      await http
        .post("/api/v1/orders")
        .set(await authHeaderFor(app, buyer.userId, buyer.orgId))
        .send({ listingId: listing.id, quantityLitres: 100 })
        .expect(400);
    });

    it("refuses self-dealing", async () => {
      const seller = await seedOrg({ type: "DEPOT" });
      const depot = await seedDepot(seller.orgId);
      const listing = await seedListing(depot.id);

      const res = await http
        .post("/api/v1/orders")
        .set(await authHeaderFor(app, seller.userId, seller.orgId))
        .send({ listingId: listing.id, quantityLitres: 1000 })
        .expect(400);
      expect(res.body.error.message).toMatch(/your own organisation/i);
    });

    it("blocks an unverified buyer", async () => {
      const seller = await seedOrg({ type: "DEPOT" });
      const buyer = await seedOrg({ type: "MARKETER", verification: VerificationStatus.PENDING });
      const depot = await seedDepot(seller.orgId);
      const listing = await seedListing(depot.id);

      const res = await http
        .post("/api/v1/orders")
        .set(await authHeaderFor(app, buyer.userId, buyer.orgId))
        .send({ listingId: listing.id, quantityLitres: 1000 })
        .expect(403);
      expect(res.body.error.code).toBe("ORG_NOT_VERIFIED");
    });

    it("refuses to buy from a seller whose verification was revoked", async () => {
      const { seller, buyer, listing } = await tradingPair();
      await prisma.organization.update({
        where: { id: seller.orgId },
        data: { verificationStatus: VerificationStatus.SUSPENDED },
      });

      const res = await http
        .post("/api/v1/orders")
        .set(await authHeaderFor(app, buyer.userId, buyer.orgId))
        .send({ listingId: listing.id, quantityLitres: 1000 })
        .expect(400);
      expect(res.body.error.message).toMatch(/not currently verified/i);
    });
  });

  // -------------------------------------------------------------------------
  describe("Concurrency — the oversell guard", () => {
    it("never sells more than exists when buyers race", async () => {
      const seller = await seedOrg({ type: "DEPOT" });
      const depot = await seedDepot(seller.orgId);
      // Exactly 3 x 30,000 L available.
      const listing = await seedListing(depot.id, { availableLitres: 90_000 });

      // Ten different buyers all try to take 30,000 L at the same instant.
      const buyers = await Promise.all(
        Array.from({ length: 10 }, () => seedOrg({ type: "MARKETER" }))
      );
      const headers = await Promise.all(buyers.map((b) => authHeaderFor(app, b.userId, b.orgId)));

      const results = await Promise.allSettled(
        headers.map((h) =>
          http.post("/api/v1/orders").set(h).send({ listingId: listing.id, quantityLitres: 30_000 })
        )
      );

      const created = results.filter((r) => r.status === "fulfilled" && r.value.status === 201);
      const rejected = results.filter((r) => r.status === "fulfilled" && r.value.status === 400);

      // At most three can succeed, and the rest must be cleanly refused.
      expect(created).toHaveLength(3);
      expect(rejected).toHaveLength(7);

      const fresh = await prisma.productListing.findUniqueOrThrow({ where: { id: listing.id } });
      expect(fresh.reservedLitres.toString()).toBe("90000");
      // The invariant that matters: never reserve more than exists.
      expect(fresh.reservedLitres.lessThanOrEqualTo(fresh.availableLitres)).toBe(true);
      expect(await prisma.order.count()).toBe(3);
    });

    it("does not double-charge a retried request with the same Idempotency-Key", async () => {
      const { buyer, listing } = await tradingPair({ availableLitres: 100_000 });
      const headers = await authHeaderFor(app, buyer.userId, buyer.orgId);
      const body = { listingId: listing.id, quantityLitres: 10_000 };

      const first = await http
        .post("/api/v1/orders")
        .set(headers)
        .set("Idempotency-Key", "order-retry-key-0001")
        .send(body)
        .expect(201);

      const retry = await http
        .post("/api/v1/orders")
        .set(headers)
        .set("Idempotency-Key", "order-retry-key-0001")
        .send(body)
        .expect(201);

      expect(retry.body.id).toBe(first.body.id);
      expect(await prisma.order.count()).toBe(1);

      const fresh = await prisma.productListing.findUniqueOrThrow({ where: { id: listing.id } });
      expect(fresh.reservedLitres.toString()).toBe("10000");
    });

    it("rejects the same Idempotency-Key with a different body", async () => {
      const { buyer, listing } = await tradingPair();
      const headers = await authHeaderFor(app, buyer.userId, buyer.orgId);

      await http
        .post("/api/v1/orders")
        .set(headers)
        .set("Idempotency-Key", "order-key-mismatch-01")
        .send({ listingId: listing.id, quantityLitres: 1000 })
        .expect(201);

      const res = await http
        .post("/api/v1/orders")
        .set(headers)
        .set("Idempotency-Key", "order-key-mismatch-01")
        .send({ listingId: listing.id, quantityLitres: 5000 })
        .expect(409);

      expect(res.body.error.code).toBe("IDEMPOTENCY_KEY_REUSED");
    });
  });

  // -------------------------------------------------------------------------
  describe("Visibility", () => {
    it("shows an order to both parties and hides it from everyone else", async () => {
      const { seller, buyer, listing } = await tradingPair();
      const created = await http
        .post("/api/v1/orders")
        .set(await authHeaderFor(app, buyer.userId, buyer.orgId))
        .send({ listingId: listing.id, quantityLitres: 1000 })
        .expect(201);

      await http
        .get(`/api/v1/orders/${created.body.id}`)
        .set(await authHeaderFor(app, buyer.userId, buyer.orgId))
        .expect(200);
      await http
        .get(`/api/v1/orders/${created.body.id}`)
        .set(await authHeaderFor(app, seller.userId, seller.orgId))
        .expect(200);

      const stranger = await seedOrg({ type: "MARKETER" });
      // 404, not 403 — the order's existence is not disclosed.
      await http
        .get(`/api/v1/orders/${created.body.id}`)
        .set(await authHeaderFor(app, stranger.userId, stranger.orgId))
        .expect(404);
    });

    it("scopes the list to the caller's organisation", async () => {
      const a = await tradingPair();
      const b = await tradingPair();

      await http
        .post("/api/v1/orders")
        .set(await authHeaderFor(app, a.buyer.userId, a.buyer.orgId))
        .send({ listingId: a.listing.id, quantityLitres: 1000 })
        .expect(201);
      await http
        .post("/api/v1/orders")
        .set(await authHeaderFor(app, b.buyer.userId, b.buyer.orgId))
        .send({ listingId: b.listing.id, quantityLitres: 2000 })
        .expect(201);

      const res = await http
        .get("/api/v1/orders")
        .set(await authHeaderFor(app, a.buyer.userId, a.buyer.orgId))
        .expect(200);

      expect(res.body.total).toBe(1);
      expect(res.body.data[0].buyerOrgId).toBe(a.buyer.orgId);
    });

    it("lets an admin see every order", async () => {
      const a = await tradingPair();
      const b = await tradingPair();
      await http.post("/api/v1/orders").set(await authHeaderFor(app, a.buyer.userId, a.buyer.orgId)).send({ listingId: a.listing.id, quantityLitres: 1000 });
      await http.post("/api/v1/orders").set(await authHeaderFor(app, b.buyer.userId, b.buyer.orgId)).send({ listingId: b.listing.id, quantityLitres: 1000 });

      const admin = await seedAdmin();
      const res = await http.get("/api/v1/orders").set(await authHeaderFor(app, admin.userId)).expect(200);
      expect(res.body.total).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  describe("Lifecycle", () => {
    async function placedOrder(overrides = {}) {
      const ctx = await tradingPair(overrides);
      const res = await http
        .post("/api/v1/orders")
        .set(await authHeaderFor(app, ctx.buyer.userId, ctx.buyer.orgId))
        .send({ listingId: ctx.listing.id, quantityLitres: 30_000 })
        .expect(201);
      return { ...ctx, orderId: res.body.id as string };
    }

    it("releases the reservation when cancelled before funding", async () => {
      const { buyer, listing, orderId } = await placedOrder({ availableLitres: 50_000 });

      await http
        .post(`/api/v1/orders/${orderId}/cancel`)
        .set(await authHeaderFor(app, buyer.userId, buyer.orgId))
        .send({ reason: "Found better freight" })
        .expect(201);

      const fresh = await prisma.productListing.findUniqueOrThrow({ where: { id: listing.id } });
      expect(fresh.reservedLitres.toString()).toBe("0");

      const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
      expect(order.status).toBe(OrderStatus.CANCELLED);
    });

    it("refuses a buyer cancellation once escrow is funded", async () => {
      const { buyer, orderId } = await placedOrder();
      await prisma.order.update({ where: { id: orderId }, data: { status: OrderStatus.ESCROW_FUNDED } });

      const res = await http
        .post(`/api/v1/orders/${orderId}/cancel`)
        .set(await authHeaderFor(app, buyer.userId, buyer.orgId))
        .send({ reason: "Changed my mind" })
        .expect(400);

      expect(res.body.error.message).toMatch(/dispute/i);
    });

    it("runs the full funded -> allocated -> dispatched -> delivered -> completed path", async () => {
      const { seller, buyer, listing, orderId } = await placedOrder({ availableLitres: 50_000 });
      const sellerHeaders = await authHeaderFor(app, seller.userId, seller.orgId);
      const buyerHeaders = await authHeaderFor(app, buyer.userId, buyer.orgId);

      // Money layer will do this; simulate it here.
      await prisma.order.update({ where: { id: orderId }, data: { status: OrderStatus.ESCROW_FUNDED } });

      await http
        .post(`/api/v1/orders/${orderId}/allocate`)
        .set(sellerHeaders)
        .send({ loadingDate: new Date(Date.now() + 86_400_000).toISOString() })
        .expect(201);

      await http
        .post(`/api/v1/orders/${orderId}/dispatch`)
        .set(sellerHeaders)
        .send({
          truckPlate: "LAG-123-XY",
          driverName: "Musa Ibrahim",
          driverPhone: "08031234567",
          loadedLitres: 30_000,
          waybillNumber: "WB-99881",
        })
        .expect(201);

      await http
        .post(`/api/v1/orders/${orderId}/confirm-delivery`)
        .set(buyerHeaders)
        .send({ receivedLitres: 30_000, receivedByName: "Station Manager" })
        .expect(201);

      const delivered = await prisma.order.findUniqueOrThrow({
        where: { id: orderId },
        include: { delivery: true },
      });
      expect(delivered.status).toBe(OrderStatus.DELIVERED);
      expect(delivered.delivery?.varianceFlagged).toBe(false);
      // Clean delivery starts the auto-complete clock.
      expect(delivered.autoCompleteAt).not.toBeNull();

      // Stock is consumed only once the product has physically moved.
      const fresh = await prisma.productListing.findUniqueOrThrow({ where: { id: listing.id } });
      expect(fresh.availableLitres.toString()).toBe("20000");
      expect(fresh.reservedLitres.toString()).toBe("0");

      await http.post(`/api/v1/orders/${orderId}/complete`).set(buyerHeaders).expect(201);
      const completed = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
      expect(completed.status).toBe(OrderStatus.COMPLETED);
      expect(completed.completedAt).not.toBeNull();
    });

    it("flags a short delivery and blocks auto-completion", async () => {
      const { seller, buyer, orderId } = await placedOrder({ availableLitres: 50_000 });
      const sellerHeaders = await authHeaderFor(app, seller.userId, seller.orgId);
      const buyerHeaders = await authHeaderFor(app, buyer.userId, buyer.orgId);

      await prisma.order.update({ where: { id: orderId }, data: { status: OrderStatus.ESCROW_FUNDED } });
      await http.post(`/api/v1/orders/${orderId}/allocate`).set(sellerHeaders).send({ loadingDate: new Date(Date.now() + 86_400_000).toISOString() }).expect(201);
      await http
        .post(`/api/v1/orders/${orderId}/dispatch`)
        .set(sellerHeaders)
        .send({ truckPlate: "LAG-123-XY", driverName: "Musa Ibrahim", driverPhone: "08031234567", loadedLitres: 30_000 })
        .expect(201);

      // 1,000 L short — well beyond the 0.5% tolerance (150 L).
      await http
        .post(`/api/v1/orders/${orderId}/confirm-delivery`)
        .set(buyerHeaders)
        .send({ receivedLitres: 29_000, receivedByName: "Station Manager", notes: "Short by one compartment" })
        .expect(201);

      const order = await prisma.order.findUniqueOrThrow({
        where: { id: orderId },
        include: { delivery: true },
      });
      expect(order.delivery?.varianceFlagged).toBe(true);
      expect(order.delivery?.varianceLitres?.toString()).toBe("-1000");
      // No auto-release clock for a disputed quantity.
      expect(order.autoCompleteAt).toBeNull();

      // The buyer cannot simply complete it and pay in full.
      const res = await http.post(`/api/v1/orders/${orderId}/complete`).set(buyerHeaders).expect(400);
      expect(res.body.error.message).toMatch(/tolerance/i);
    });

    it("accepts a small variance within tolerance", async () => {
      const { seller, buyer, orderId } = await placedOrder({ availableLitres: 50_000 });
      const sellerHeaders = await authHeaderFor(app, seller.userId, seller.orgId);
      const buyerHeaders = await authHeaderFor(app, buyer.userId, buyer.orgId);

      await prisma.order.update({ where: { id: orderId }, data: { status: OrderStatus.ESCROW_FUNDED } });
      await http.post(`/api/v1/orders/${orderId}/allocate`).set(sellerHeaders).send({ loadingDate: new Date(Date.now() + 86_400_000).toISOString() }).expect(201);
      await http
        .post(`/api/v1/orders/${orderId}/dispatch`)
        .set(sellerHeaders)
        .send({ truckPlate: "LAG-123-XY", driverName: "Musa Ibrahim", driverPhone: "08031234567", loadedLitres: 30_000 })
        .expect(201);

      // 100 L short of 30,000 = 0.33%, inside the 0.5% tolerance.
      await http
        .post(`/api/v1/orders/${orderId}/confirm-delivery`)
        .set(buyerHeaders)
        .send({ receivedLitres: 29_900, receivedByName: "Station Manager" })
        .expect(201);

      const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { delivery: true } });
      expect(order.delivery?.varianceFlagged).toBe(false);
      await http.post(`/api/v1/orders/${orderId}/complete`).set(buyerHeaders).expect(201);
    });

    it("stops the seller from confirming delivery on the buyer's behalf", async () => {
      const { seller, orderId } = await placedOrder();
      await prisma.order.update({ where: { id: orderId }, data: { status: OrderStatus.IN_TRANSIT } });

      await http
        .post(`/api/v1/orders/${orderId}/confirm-delivery`)
        .set(await authHeaderFor(app, seller.userId, seller.orgId))
        .send({ receivedLitres: 30_000, receivedByName: "Not the buyer" })
        .expect(403);
    });

    it("stops the buyer from dispatching", async () => {
      const { buyer, orderId } = await placedOrder();
      await prisma.order.update({ where: { id: orderId }, data: { status: OrderStatus.ALLOCATED } });

      await http
        .post(`/api/v1/orders/${orderId}/dispatch`)
        .set(await authHeaderFor(app, buyer.userId, buyer.orgId))
        .send({ truckPlate: "LAG-1-XY", driverName: "Someone", driverPhone: "08031234567", loadedLitres: 30_000 })
        .expect(403);
    });

    it("rejects an illegal state jump", async () => {
      const { buyer, orderId } = await placedOrder();
      // AWAITING_PAYMENT -> complete is not a legal transition.
      const res = await http
        .post(`/api/v1/orders/${orderId}/complete`)
        .set(await authHeaderFor(app, buyer.userId, buyer.orgId))
        .expect(400);
      expect(res.body.error.code).toBe("INVALID_STATE_TRANSITION");
    });

    it("refuses to load materially more than was sold", async () => {
      const { seller, orderId } = await placedOrder();
      await prisma.order.update({ where: { id: orderId }, data: { status: OrderStatus.ALLOCATED } });

      await http
        .post(`/api/v1/orders/${orderId}/dispatch`)
        .set(await authHeaderFor(app, seller.userId, seller.orgId))
        .send({ truckPlate: "LAG-1-XY", driverName: "Musa", driverPhone: "08031234567", loadedLitres: 40_000 })
        .expect(400);
    });

    it("keeps a complete, ordered event trail", async () => {
      const { seller, buyer, orderId } = await placedOrder({ availableLitres: 50_000 });
      const sellerHeaders = await authHeaderFor(app, seller.userId, seller.orgId);
      const buyerHeaders = await authHeaderFor(app, buyer.userId, buyer.orgId);

      await prisma.order.update({ where: { id: orderId }, data: { status: OrderStatus.ESCROW_FUNDED } });
      await http.post(`/api/v1/orders/${orderId}/allocate`).set(sellerHeaders).send({ loadingDate: new Date(Date.now() + 86_400_000).toISOString() });
      await http.post(`/api/v1/orders/${orderId}/dispatch`).set(sellerHeaders).send({ truckPlate: "LAG-1-XY", driverName: "Musa", driverPhone: "08031234567", loadedLitres: 30_000 });
      await http.post(`/api/v1/orders/${orderId}/confirm-delivery`).set(buyerHeaders).send({ receivedLitres: 30_000, receivedByName: "Manager" });
      await http.post(`/api/v1/orders/${orderId}/complete`).set(buyerHeaders);

      const events = await prisma.orderEvent.findMany({ where: { orderId }, orderBy: { createdAt: "asc" } });
      const statuses = events.map((e) => e.toStatus);
      // LOADING is recorded distinctly: the truck is filled at the gantry
      // before it leaves, and disputes turn on exactly when each happened.
      expect(statuses).toEqual([
        OrderStatus.AWAITING_PAYMENT,
        OrderStatus.ALLOCATED,
        OrderStatus.LOADING,
        OrderStatus.IN_TRANSIT,
        OrderStatus.DELIVERED,
        OrderStatus.COMPLETED,
      ]);
      // Every transition is attributed to someone.
      expect(events.every((e) => e.actorUserId !== null)).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  describe("Loading slots", () => {
    it("refuses to overbook a depot's daily capacity", async () => {
      const seller = await seedOrg({ type: "DEPOT" });
      const depot = await prisma.depot.create({
        data: {
          orgId: seller.orgId,
          name: "Capacity Depot",
          slug: `cap-depot-${Date.now()}`,
          state: "Lagos",
          dailyLoadingCapacity: 1,
        },
      });
      const listing = await seedListing(depot.id, { availableLitres: 100_000 });
      const sellerHeaders = await authHeaderFor(app, seller.userId, seller.orgId);
      const loadingDate = new Date(Date.now() + 86_400_000).toISOString();

      const orderIds: string[] = [];
      for (let i = 0; i < 2; i++) {
        const buyer = await seedOrg({ type: "MARKETER" });
        const res = await http
          .post("/api/v1/orders")
          .set(await authHeaderFor(app, buyer.userId, buyer.orgId))
          .send({ listingId: listing.id, quantityLitres: 10_000 })
          .expect(201);
        await prisma.order.update({ where: { id: res.body.id }, data: { status: OrderStatus.ESCROW_FUNDED } });
        orderIds.push(res.body.id);
      }

      await http.post(`/api/v1/orders/${orderIds[0]}/allocate`).set(sellerHeaders).send({ loadingDate }).expect(201);

      const second = await http
        .post(`/api/v1/orders/${orderIds[1]}/allocate`)
        .set(sellerHeaders)
        .send({ loadingDate })
        .expect(400);
      expect(second.body.error.message).toMatch(/fully booked/i);
    });
  });
});
