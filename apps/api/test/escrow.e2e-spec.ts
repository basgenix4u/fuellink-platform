import { INestApplication } from "@nestjs/common";
import { LedgerTxnKind, OrderStatus, PaymentStatus, PayoutStatus } from "@prisma/client";
import request from "supertest";
import { createTestApp, prisma, resetDatabase } from "./helpers";
import { authHeaderFor } from "./auth-helpers";
import { seedAdmin, seedDepot, seedListing, seedOrg } from "./factories";

/**
 * Money. These tests exist to prove that value cannot be created, destroyed,
 * or paid to the wrong party — the properties the business depends on.
 */
describe("Escrow, ledger & payouts (integration)", () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;

  beforeAll(async () => {
    // The manual provider refuses to run unconfigured, which is correct
    // behaviour; supply escrow account details for the suite.
    process.env.ESCROW_BANK_NAME = "Providus Bank";
    process.env.ESCROW_ACCOUNT_NAME = "FuelLink Escrow";
    process.env.ESCROW_ACCOUNT_NUMBER = "1234567890";
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

  /** A funded-ready order: verified buyer and seller, listing, order placed. */
  async function placedOrder(quantity = 30_000) {
    const seller = await seedOrg({ type: "DEPOT" });
    const buyer = await seedOrg({ type: "MARKETER" });
    const admin = await seedAdmin();
    const depot = await seedDepot(seller.orgId);
    const listing = await seedListing(depot.id, { availableLitres: 100_000, pricePerLitreKobo: 114_000n });

    const res = await http
      .post("/api/v1/orders")
      .set(await authHeaderFor(app, buyer.userId, buyer.orgId))
      .send({ listingId: listing.id, quantityLitres: quantity })
      .expect(201);

    return { seller, buyer, admin, depot, listing, order: res.body };
  }

  /** Funds an order end-to-end through the real payment + confirm path. */
  async function fundOrder(ctx: Awaited<ReturnType<typeof placedOrder>>, bankRef = `BNK-${Date.now()}`) {
    const fund = await http
      .post("/api/v1/payments/fund")
      .set(await authHeaderFor(app, ctx.buyer.userId, ctx.buyer.orgId))
      .send({ orderId: ctx.order.id })
      .expect(201);

    await http
      .post(`/api/v1/admin/payments/${fund.body.payment.id}/confirm`)
      .set(await authHeaderFor(app, ctx.admin.userId))
      .send({ bankReference: bankRef, receivedAmountKobo: ctx.order.totalKobo })
      .expect(201);

    return fund.body.payment;
  }

  // -------------------------------------------------------------------------
  describe("Funding", () => {
    it("issues transfer instructions with a unique narration", async () => {
      const ctx = await placedOrder();
      const res = await http
        .post("/api/v1/payments/fund")
        .set(await authHeaderFor(app, ctx.buyer.userId, ctx.buyer.orgId))
        .send({ orderId: ctx.order.id })
        .expect(201);

      expect(res.body.payment.status).toBe(PaymentStatus.PENDING);
      expect(res.body.payment.amountKobo).toBe(ctx.order.totalKobo);
      expect(res.body.instructions.fields.some((f: { value: string }) => f.value === "1234567890")).toBe(true);
      // The narration must be tied to the order so an operator can match it.
      expect(res.body.payment.ref).toContain(ctx.order.ref);
    });

    it("returns the same payment when funding is requested twice", async () => {
      const ctx = await placedOrder();
      const headers = await authHeaderFor(app, ctx.buyer.userId, ctx.buyer.orgId);

      const first = await http.post("/api/v1/payments/fund").set(headers).send({ orderId: ctx.order.id }).expect(201);
      const second = await http.post("/api/v1/payments/fund").set(headers).send({ orderId: ctx.order.id }).expect(201);

      expect(second.body.payment.id).toBe(first.body.payment.id);
      expect(second.body.reused).toBe(true);
      expect(await prisma.payment.count({ where: { orderId: ctx.order.id } })).toBe(1);
    });

    it("refuses funding by anyone other than the buyer", async () => {
      const ctx = await placedOrder();
      await http
        .post("/api/v1/payments/fund")
        .set(await authHeaderFor(app, ctx.seller.userId, ctx.seller.orgId))
        .send({ orderId: ctx.order.id })
        .expect(403);
    });

    it("posts a balanced ledger transaction when a credit is confirmed", async () => {
      const ctx = await placedOrder();
      await fundOrder(ctx, "BNK-REF-001");

      const txn = await prisma.ledgerTransaction.findFirstOrThrow({
        where: { orderId: ctx.order.id, kind: LedgerTxnKind.ESCROW_FUND },
        include: { entries: true },
      });

      expect(txn.entries).toHaveLength(2);
      const sum = txn.entries.reduce((acc, e) => acc + e.amountKobo, 0n);
      expect(sum).toBe(0n);

      const order = await prisma.order.findUniqueOrThrow({ where: { id: ctx.order.id } });
      expect(order.status).toBe(OrderStatus.ESCROW_FUNDED);
    });

    it("rejects a confirmation whose amount does not match", async () => {
      const ctx = await placedOrder();
      const fund = await http
        .post("/api/v1/payments/fund")
        .set(await authHeaderFor(app, ctx.buyer.userId, ctx.buyer.orgId))
        .send({ orderId: ctx.order.id })
        .expect(201);

      const res = await http
        .post(`/api/v1/admin/payments/${fund.body.payment.id}/confirm`)
        .set(await authHeaderFor(app, ctx.admin.userId))
        // ₦1 short.
        .send({ bankReference: "BNK-SHORT", receivedAmountKobo: (BigInt(ctx.order.totalKobo) - 100n).toString() })
        .expect(400);

      expect(res.body.error.message).toMatch(/mismatch/i);
      // Nothing moved.
      expect(await prisma.ledgerEntry.count()).toBe(0);
      const order = await prisma.order.findUniqueOrThrow({ where: { id: ctx.order.id } });
      expect(order.status).toBe(OrderStatus.AWAITING_PAYMENT);
    });

    it("refuses to apply the same bank reference twice", async () => {
      const a = await placedOrder();
      await fundOrder(a, "BNK-DUPLICATE");

      const b = await placedOrder();
      const fund = await http
        .post("/api/v1/payments/fund")
        .set(await authHeaderFor(app, b.buyer.userId, b.buyer.orgId))
        .send({ orderId: b.order.id })
        .expect(201);

      const res = await http
        .post(`/api/v1/admin/payments/${fund.body.payment.id}/confirm`)
        .set(await authHeaderFor(app, b.admin.userId))
        .send({ bankReference: "BNK-DUPLICATE", receivedAmountKobo: b.order.totalKobo })
        .expect(409);

      expect(res.body.error.code).toBe("DUPLICATE_RESOURCE");
    });

    it("refuses double confirmation of one payment", async () => {
      const ctx = await placedOrder();
      const payment = await fundOrder(ctx, "BNK-ONCE");

      const res = await http
        .post(`/api/v1/admin/payments/${payment.id}/confirm`)
        .set(await authHeaderFor(app, ctx.admin.userId))
        .send({ bankReference: "BNK-ONCE-2", receivedAmountKobo: ctx.order.totalKobo })
        .expect(409);
      expect(res.body.error.message).toMatch(/already been confirmed/i);

      // Exactly one funding transaction exists.
      expect(
        await prisma.ledgerTransaction.count({
          where: { orderId: ctx.order.id, kind: LedgerTxnKind.ESCROW_FUND },
        })
      ).toBe(1);
    });

    it("lets only an operator confirm a credit", async () => {
      const ctx = await placedOrder();
      const fund = await http
        .post("/api/v1/payments/fund")
        .set(await authHeaderFor(app, ctx.buyer.userId, ctx.buyer.orgId))
        .send({ orderId: ctx.order.id })
        .expect(201);

      // The buyer must not be able to mark their own transfer as received.
      await http
        .post(`/api/v1/admin/payments/${fund.body.payment.id}/confirm`)
        .set(await authHeaderFor(app, ctx.buyer.userId, ctx.buyer.orgId))
        .send({ bankReference: "SELF-CONFIRM", receivedAmountKobo: ctx.order.totalKobo })
        .expect(403);
    });
  });

  // -------------------------------------------------------------------------
  describe("Release", () => {
    /** Drives an order through to DELIVERED so escrow can be released. */
    async function deliveredOrder(received = 30_000) {
      const ctx = await placedOrder(30_000);
      await fundOrder(ctx, `BNK-${Math.random().toString(36).slice(2, 10)}`);

      const sellerHeaders = await authHeaderFor(app, ctx.seller.userId, ctx.seller.orgId);
      const buyerHeaders = await authHeaderFor(app, ctx.buyer.userId, ctx.buyer.orgId);

      await http
        .post(`/api/v1/orders/${ctx.order.id}/allocate`)
        .set(sellerHeaders)
        .send({ loadingDate: new Date(Date.now() + 86_400_000).toISOString() })
        .expect(201);
      await http
        .post(`/api/v1/orders/${ctx.order.id}/dispatch`)
        .set(sellerHeaders)
        .send({ truckPlate: "LAG-77-XY", driverName: "Musa Bello", driverPhone: "08031234567", loadedLitres: 30_000 })
        .expect(201);
      await http
        .post(`/api/v1/orders/${ctx.order.id}/confirm-delivery`)
        .set(buyerHeaders)
        .send({ receivedLitres: received, receivedByName: "Station Manager" })
        .expect(201);

      return { ...ctx, buyerHeaders, sellerHeaders };
    }

    it("splits the release between supplier and platform fee, and balances", async () => {
      const ctx = await deliveredOrder();

      await http
        .post(`/api/v1/orders/${ctx.order.id}/release-escrow`)
        .set(ctx.buyerHeaders)
        .send({})
        .expect(201);

      const txn = await prisma.ledgerTransaction.findFirstOrThrow({
        where: { orderId: ctx.order.id, kind: LedgerTxnKind.ESCROW_RELEASE },
        include: { entries: { include: { account: true } } },
      });

      expect(txn.entries.reduce((a, e) => a + e.amountKobo, 0n)).toBe(0n);

      const sellerLine = txn.entries.find((e) => e.account.code.startsWith("PAYABLE:"));
      const feeLine = txn.entries.find((e) => e.account.code === "PLATFORM:FEE_REVENUE");

      // Supplier receives the goods value; platform keeps the commission.
      expect(sellerLine?.amountKobo).toBe(-BigInt(ctx.order.subtotalKobo));
      expect(feeLine?.amountKobo).toBe(-BigInt(ctx.order.feeKobo));

      const order = await prisma.order.findUniqueOrThrow({ where: { id: ctx.order.id } });
      expect(order.status).toBe(OrderStatus.COMPLETED);
    });

    it("leaves the whole ledger balanced after a full trade", async () => {
      const ctx = await deliveredOrder();
      await http.post(`/api/v1/orders/${ctx.order.id}/release-escrow`).set(ctx.buyerHeaders).send({}).expect(201);

      const res = await http
        .get("/api/v1/admin/ledger/integrity")
        .set(await authHeaderFor(app, ctx.admin.userId))
        .expect(200);

      expect(res.body.balanced).toBe(true);
      expect(res.body.grandTotalKobo).toBe("0");
      expect(res.body.unbalancedTransactions).toHaveLength(0);
    });

    it("refuses to release twice", async () => {
      const ctx = await deliveredOrder();
      await http.post(`/api/v1/orders/${ctx.order.id}/release-escrow`).set(ctx.buyerHeaders).send({}).expect(201);

      const res = await http
        .post(`/api/v1/orders/${ctx.order.id}/release-escrow`)
        .set(ctx.buyerHeaders)
        .send({})
        .expect(409);
      expect(res.body.error.message).toMatch(/already been released/i);

      expect(
        await prisma.ledgerTransaction.count({
          where: { orderId: ctx.order.id, kind: LedgerTxnKind.ESCROW_RELEASE },
        })
      ).toBe(1);
    });

    it("refuses to release an unfunded order", async () => {
      const ctx = await placedOrder();
      // Force the order to DELIVERED without any payment.
      await prisma.order.update({ where: { id: ctx.order.id }, data: { status: OrderStatus.DELIVERED } });

      const res = await http
        .post(`/api/v1/orders/${ctx.order.id}/release-escrow`)
        .set(await authHeaderFor(app, ctx.buyer.userId, ctx.buyer.orgId))
        .send({})
        .expect(400);
      expect(res.body.error.message).toMatch(/no confirmed funding/i);
    });

    it("blocks release when the delivery is short, until an operator settles it", async () => {
      // 1,000 L short of 30,000 — outside the 0.5% tolerance.
      const ctx = await deliveredOrder(29_000);

      const blocked = await http
        .post(`/api/v1/orders/${ctx.order.id}/release-escrow`)
        .set(ctx.buyerHeaders)
        .send({})
        .expect(400);
      expect(blocked.body.error.message).toMatch(/tolerance/i);

      // The operator can settle it.
      await http
        .post(`/api/v1/orders/${ctx.order.id}/release-escrow`)
        .set(await authHeaderFor(app, ctx.admin.userId))
        .send({ note: "Variance accepted after meter check" })
        .expect(201);
    });

    it("keeps escrow frozen while a dispute is open", async () => {
      const ctx = await deliveredOrder();
      await prisma.dispute.create({
        data: {
          ref: `DSP-${Date.now()}`,
          orderId: ctx.order.id,
          raisedByOrgId: ctx.buyer.orgId,
          reason: "SHORT_DELIVERY",
          description: "Two compartments short on arrival",
          status: "OPEN",
        },
      });

      const res = await http
        .post(`/api/v1/orders/${ctx.order.id}/release-escrow`)
        .set(ctx.buyerHeaders)
        .send({})
        .expect(400);
      expect(res.body.error.message).toMatch(/dispute/i);
    });
  });

  // -------------------------------------------------------------------------
  describe("Refunds", () => {
    it("refunds in full and marks the order refunded", async () => {
      const ctx = await placedOrder();
      await fundOrder(ctx, "BNK-REFUND-FULL");

      await http
        .post(`/api/v1/admin/orders/${ctx.order.id}/refund`)
        .set(await authHeaderFor(app, ctx.admin.userId))
        .send({ reason: "Depot could not supply" })
        .expect(201);

      const order = await prisma.order.findUniqueOrThrow({ where: { id: ctx.order.id } });
      expect(order.status).toBe(OrderStatus.REFUNDED);

      const txn = await prisma.ledgerTransaction.findFirstOrThrow({
        where: { orderId: ctx.order.id, kind: LedgerTxnKind.ESCROW_REFUND },
        include: { entries: true },
      });
      expect(txn.entries.reduce((a, e) => a + e.amountKobo, 0n)).toBe(0n);

      // The buyer's escrow liability is back to zero.
      const escrowAccount = await prisma.ledgerAccount.findUniqueOrThrow({
        where: { code: `ESCROW:${ctx.buyer.orgId}` },
      });
      const balance = await prisma.ledgerEntry.aggregate({
        where: { accountId: escrowAccount.id },
        _sum: { amountKobo: true },
      });
      expect(balance._sum.amountKobo).toBe(0n);
    });

    it("refuses to refund more than was funded", async () => {
      const ctx = await placedOrder();
      await fundOrder(ctx, "BNK-REFUND-OVER");

      const res = await http
        .post(`/api/v1/admin/orders/${ctx.order.id}/refund`)
        .set(await authHeaderFor(app, ctx.admin.userId))
        .send({ amountKobo: (BigInt(ctx.order.totalKobo) * 2n).toString(), reason: "Attempted over-refund" })
        .expect(400);
      expect(res.body.error.message).toMatch(/only ₦/i);
    });

    it("refuses a refund after release", async () => {
      const ctx = await placedOrder();
      await fundOrder(ctx, "BNK-REFUND-AFTER");
      await prisma.order.update({ where: { id: ctx.order.id }, data: { status: OrderStatus.DELIVERED } });
      await http
        .post(`/api/v1/orders/${ctx.order.id}/release-escrow`)
        .set(await authHeaderFor(app, ctx.admin.userId))
        .send({})
        .expect(201);

      const res = await http
        .post(`/api/v1/admin/orders/${ctx.order.id}/refund`)
        .set(await authHeaderFor(app, ctx.admin.userId))
        .send({ reason: "Too late" })
        .expect(400);
      expect(res.body.error.message).toMatch(/already been released/i);
    });

    it("lets only an operator refund", async () => {
      const ctx = await placedOrder();
      await fundOrder(ctx, "BNK-REFUND-AUTH");

      await http
        .post(`/api/v1/admin/orders/${ctx.order.id}/refund`)
        .set(await authHeaderFor(app, ctx.buyer.userId, ctx.buyer.orgId))
        .send({ reason: "I want my money back" })
        .expect(403);
    });
  });

  // -------------------------------------------------------------------------
  describe("Payouts", () => {
    /** Runs a full trade so the seller has a withdrawable balance. */
    async function sellerWithBalance() {
      const ctx = await placedOrder(30_000);
      await fundOrder(ctx, `BNK-${Math.random().toString(36).slice(2, 10)}`);
      const sellerHeaders = await authHeaderFor(app, ctx.seller.userId, ctx.seller.orgId);
      const buyerHeaders = await authHeaderFor(app, ctx.buyer.userId, ctx.buyer.orgId);

      await http.post(`/api/v1/orders/${ctx.order.id}/allocate`).set(sellerHeaders).send({ loadingDate: new Date(Date.now() + 86_400_000).toISOString() });
      await http.post(`/api/v1/orders/${ctx.order.id}/dispatch`).set(sellerHeaders).send({ truckPlate: "LAG-77-XY", driverName: "Musa", driverPhone: "08031234567", loadedLitres: 30_000 });
      await http.post(`/api/v1/orders/${ctx.order.id}/confirm-delivery`).set(buyerHeaders).send({ receivedLitres: 30_000, receivedByName: "Manager" });
      await http.post(`/api/v1/orders/${ctx.order.id}/release-escrow`).set(buyerHeaders).send({}).expect(201);

      return { ...ctx, sellerHeaders };
    }

    it("reports the supplier's withdrawable balance", async () => {
      const ctx = await sellerWithBalance();
      const res = await http.get("/api/v1/my/balance").set(ctx.sellerHeaders).expect(200);
      // The supplier receives the goods value, not the fee.
      expect(res.body.availableKobo).toBe(ctx.order.subtotalKobo);
    });

    it("refuses a payout to an unverified bank account", async () => {
      const ctx = await sellerWithBalance();
      const account = await prisma.bankAccount.create({
        data: {
          orgId: ctx.seller.orgId,
          bankName: "GTBank",
          bankCode: "058",
          accountNumber: "0123456789",
          accountName: "Depot Ltd",
          isVerified: false,
          isPrimary: true,
        },
      });

      const res = await http
        .post("/api/v1/my/payouts")
        .set(ctx.sellerHeaders)
        .send({ bankAccountId: account.id, amountKobo: "1000000" })
        .expect(400);
      expect(res.body.error.message).toMatch(/not been verified/i);
    });

    it("refuses a payout larger than the balance", async () => {
      const ctx = await sellerWithBalance();
      const account = await prisma.bankAccount.create({
        data: {
          orgId: ctx.seller.orgId,
          bankName: "GTBank",
          bankCode: "058",
          accountNumber: "0123456789",
          accountName: "Depot Ltd",
          isVerified: true,
          isPrimary: true,
        },
      });

      const res = await http
        .post("/api/v1/my/payouts")
        .set(ctx.sellerHeaders)
        .send({ bankAccountId: account.id, amountKobo: (BigInt(ctx.order.subtotalKobo) * 2n).toString() })
        .expect(400);
      expect(res.body.error.message).toMatch(/insufficient balance/i);
    });

    it("cannot be double-spent by two concurrent requests", async () => {
      const ctx = await sellerWithBalance();
      const account = await prisma.bankAccount.create({
        data: {
          orgId: ctx.seller.orgId,
          bankName: "GTBank",
          bankCode: "058",
          accountNumber: "0123456789",
          accountName: "Depot Ltd",
          isVerified: true,
          isPrimary: true,
        },
      });

      // Two requests, each for the entire balance.
      const full = ctx.order.subtotalKobo as string;
      const results = await Promise.allSettled([
        http.post("/api/v1/my/payouts").set(ctx.sellerHeaders).send({ bankAccountId: account.id, amountKobo: full }),
        http.post("/api/v1/my/payouts").set(ctx.sellerHeaders).send({ bankAccountId: account.id, amountKobo: full }),
      ]);

      const created = results.filter((r) => r.status === "fulfilled" && r.value.status === 201);
      // Requests in flight count against the balance, so only one can pass.
      expect(created.length).toBe(1);

      const { availableKobo } = { availableKobo: (await http.get("/api/v1/my/balance").set(ctx.sellerHeaders)).body.availableKobo };
      expect(availableKobo).toBe("0");
    });

    it("discharges the payable when an operator records the transfer", async () => {
      const ctx = await sellerWithBalance();
      const account = await prisma.bankAccount.create({
        data: {
          orgId: ctx.seller.orgId,
          bankName: "GTBank",
          bankCode: "058",
          accountNumber: "0123456789",
          accountName: "Depot Ltd",
          isVerified: true,
          isPrimary: true,
        },
      });

      const payout = await http
        .post("/api/v1/my/payouts")
        .set(ctx.sellerHeaders)
        .send({ bankAccountId: account.id, amountKobo: ctx.order.subtotalKobo })
        .expect(201);

      await http
        .post(`/api/v1/admin/payouts/${payout.body.id}/complete`)
        .set(await authHeaderFor(app, ctx.admin.userId))
        .send({ providerRef: "NIP-987654321" })
        .expect(201);

      const paid = await prisma.payout.findUniqueOrThrow({ where: { id: payout.body.id } });
      expect(paid.status).toBe(PayoutStatus.PAID);

      // The supplier's payable is now zero and the ledger still balances.
      const after = await http.get("/api/v1/my/balance").set(ctx.sellerHeaders).expect(200);
      expect(after.body.availableKobo).toBe("0");

      const integrity = await http
        .get("/api/v1/admin/ledger/integrity")
        .set(await authHeaderFor(app, ctx.admin.userId))
        .expect(200);
      expect(integrity.body.balanced).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  describe("End-to-end money conservation", () => {
    it("conserves value across fund -> release -> payout", async () => {
      const ctx = await placedOrder(30_000);
      await fundOrder(ctx, "BNK-E2E-001");

      const sellerHeaders = await authHeaderFor(app, ctx.seller.userId, ctx.seller.orgId);
      const buyerHeaders = await authHeaderFor(app, ctx.buyer.userId, ctx.buyer.orgId);
      const adminHeaders = await authHeaderFor(app, ctx.admin.userId);

      await http.post(`/api/v1/orders/${ctx.order.id}/allocate`).set(sellerHeaders).send({ loadingDate: new Date(Date.now() + 86_400_000).toISOString() });
      await http.post(`/api/v1/orders/${ctx.order.id}/dispatch`).set(sellerHeaders).send({ truckPlate: "LAG-77-XY", driverName: "Musa", driverPhone: "08031234567", loadedLitres: 30_000 });
      await http.post(`/api/v1/orders/${ctx.order.id}/confirm-delivery`).set(buyerHeaders).send({ receivedLitres: 30_000, receivedByName: "Manager" });
      await http.post(`/api/v1/orders/${ctx.order.id}/release-escrow`).set(buyerHeaders).send({}).expect(201);

      const account = await prisma.bankAccount.create({
        data: {
          orgId: ctx.seller.orgId,
          bankName: "GTBank",
          bankCode: "058",
          accountNumber: "0123456789",
          accountName: "Depot Ltd",
          isVerified: true,
          isPrimary: true,
        },
      });
      const payout = await http
        .post("/api/v1/my/payouts")
        .set(sellerHeaders)
        .send({ bankAccountId: account.id, amountKobo: ctx.order.subtotalKobo })
        .expect(201);
      await http
        .post(`/api/v1/admin/payouts/${payout.body.id}/complete`)
        .set(adminHeaders)
        .send({ providerRef: "NIP-E2E" })
        .expect(201);

      // Final positions, derived purely from ledger entries.
      const accounts = await prisma.ledgerAccount.findMany({ include: { entries: true } });
      const balances = Object.fromEntries(
        accounts.map((a) => [a.code, a.entries.reduce((s, e) => s + e.amountKobo, 0n)])
      );

      const fee = BigInt(ctx.order.feeKobo);

      // Buyer's escrow liability discharged.
      expect(balances[`ESCROW:${ctx.buyer.orgId}`]).toBe(0n);
      // Supplier fully paid out.
      expect(balances[`PAYABLE:${ctx.seller.orgId}`]).toBe(0n);
      // Platform retains exactly the commission.
      expect(balances["PLATFORM:FEE_REVENUE"]).toBe(-fee);
      // The bank holds the fee and nothing else.
      expect(balances["PLATFORM:BANK_SETTLEMENT"]).toBe(fee);

      // And nothing was created or destroyed anywhere.
      const grand = Object.values(balances).reduce((a, b) => a + b, 0n);
      expect(grand).toBe(0n);
    });
  });
});
