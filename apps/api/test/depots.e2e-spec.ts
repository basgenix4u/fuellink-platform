import { INestApplication } from "@nestjs/common";
import { OrgRole, Prisma, VerificationStatus } from "@prisma/client";
import request from "supertest";
import { createTestApp, prisma, resetDatabase } from "./helpers";
import { authHeaderFor } from "./auth-helpers";
import { seedDepot, seedListing, seedOrg } from "./factories";

describe("Depots & listings (integration)", () => {
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

  // -------------------------------------------------------------------------
  describe("Depot creation", () => {
    it("lets a verified depot organisation register a depot", async () => {
      const org = await seedOrg({ type: "DEPOT" });
      const res = await http
        .post("/api/v1/my/depots")
        .set(await authHeaderFor(app, org.userId, org.orgId))
        .send({ name: "Apapa Terminal", state: "Lagos", gantryActive: true })
        .expect(201);

      expect(res.body.slug).toBe("apapa-terminal");
      expect(res.body.state).toBe("Lagos");
    });

    it("blocks an unverified organisation from registering a depot", async () => {
      const org = await seedOrg({ type: "DEPOT", verification: VerificationStatus.PENDING });
      const res = await http
        .post("/api/v1/my/depots")
        .set(await authHeaderFor(app, org.userId, org.orgId))
        .send({ name: "Apapa Terminal", state: "Lagos" })
        .expect(403);
      expect(res.body.error.code).toBe("ORG_NOT_VERIFIED");
    });

    it("blocks a marketer organisation from registering a depot", async () => {
      const org = await seedOrg({ type: "MARKETER" });
      await http
        .post("/api/v1/my/depots")
        .set(await authHeaderFor(app, org.userId, org.orgId))
        .send({ name: "Not A Depot", state: "Lagos" })
        .expect(400);
    });

    it("rejects an invalid state", async () => {
      const org = await seedOrg({ type: "DEPOT" });
      await http
        .post("/api/v1/my/depots")
        .set(await authHeaderFor(app, org.userId, org.orgId))
        .send({ name: "Nowhere Depot", state: "Atlantis" })
        .expect(400);
    });

    it("accepts Abuja as a valid location", async () => {
      const org = await seedOrg({ type: "DEPOT" });
      const res = await http
        .post("/api/v1/my/depots")
        .set(await authHeaderFor(app, org.userId, org.orgId))
        .send({ name: "Central Depot", state: "Abuja" })
        .expect(201);
      expect(res.body.state).toBe("Abuja");
    });

    it("generates unique slugs for identically named depots", async () => {
      const org = await seedOrg({ type: "DEPOT" });
      const headers = await authHeaderFor(app, org.userId, org.orgId);

      const a = await http.post("/api/v1/my/depots").set(headers).send({ name: "Main Depot", state: "Lagos" }).expect(201);
      const b = await http.post("/api/v1/my/depots").set(headers).send({ name: "Main Depot", state: "Kano" }).expect(201);

      expect(a.body.slug).not.toBe(b.body.slug);
    });

    it("does not let one organisation modify another's depot", async () => {
      const owner = await seedOrg({ type: "DEPOT" });
      const attacker = await seedOrg({ type: "DEPOT" });
      const depot = await seedDepot(owner.orgId);

      // 404, not 403: existence is not confirmed to outsiders.
      await http
        .patch(`/api/v1/my/depots/${depot.id}`)
        .set(await authHeaderFor(app, attacker.userId, attacker.orgId))
        .send({ name: "Hijacked" })
        .expect(404);
    });
  });

  // -------------------------------------------------------------------------
  describe("Public discovery", () => {
    it("lists only depots of verified organisations", async () => {
      const verified = await seedOrg({ type: "DEPOT", verification: VerificationStatus.VERIFIED });
      const pending = await seedOrg({ type: "DEPOT", verification: VerificationStatus.PENDING });
      const dv = await seedDepot(verified.orgId, { name: "Verified Depot" });
      const dp = await seedDepot(pending.orgId, { name: "Pending Depot" });
      await seedListing(dv.id);
      await seedListing(dp.id);

      const res = await http.get("/api/v1/depots").expect(200);
      const names = res.body.data.map((d: { name: string }) => d.name);
      expect(names).toContain("Verified Depot");
      expect(names).not.toContain("Pending Depot");
    });

    it("is reachable without authentication", async () => {
      await http.get("/api/v1/listings").expect(200);
    });

    it("filters by state and product", async () => {
      const org = await seedOrg({ type: "DEPOT" });
      const lagos = await seedDepot(org.orgId, { state: "Lagos" });
      const kano = await seedDepot(org.orgId, { state: "Kano" });
      await seedListing(lagos.id, { product: "PMS" });
      await seedListing(kano.id, { product: "AGO" });

      const byState = await http.get("/api/v1/listings?state=Lagos").expect(200);
      expect(byState.body.data).toHaveLength(1);

      const byProduct = await http.get("/api/v1/listings?product=AGO").expect(200);
      expect(byProduct.body.data).toHaveLength(1);
      expect(byProduct.body.data[0].product).toBe("AGO");
    });

    it("hides expired listings by default", async () => {
      const org = await seedOrg({ type: "DEPOT" });
      const depot = await seedDepot(org.orgId);
      await seedListing(depot.id, { validUntil: new Date(Date.now() - 3600_000) });

      const hidden = await http.get("/api/v1/listings").expect(200);
      expect(hidden.body.data).toHaveLength(0);

      const shown = await http.get("/api/v1/listings?includeExpired=true").expect(200);
      expect(shown.body.data).toHaveLength(1);
      expect(shown.body.data[0].isExpired).toBe(true);
      expect(shown.body.data[0].isOrderable).toBe(false);
    });

    it("sorts by price ascending by default", async () => {
      const org = await seedOrg({ type: "DEPOT" });
      const depot = await seedDepot(org.orgId);
      await seedListing(depot.id, { pricePerLitreKobo: 120_000n });
      await seedListing(depot.id, { pricePerLitreKobo: 110_000n });
      await seedListing(depot.id, { pricePerLitreKobo: 115_000n });

      const res = await http.get("/api/v1/listings").expect(200);
      const prices = res.body.data.map((l: { pricePerLitreKobo: string }) => Number(l.pricePerLitreKobo));
      expect(prices).toEqual([110_000, 115_000, 120_000]);
    });

    it("serialises money as an exact string, never a float", async () => {
      const org = await seedOrg({ type: "DEPOT" });
      const depot = await seedDepot(org.orgId);
      await seedListing(depot.id, { pricePerLitreKobo: 114_055n });

      const res = await http.get("/api/v1/listings").expect(200);
      expect(res.body.data[0].pricePerLitreKobo).toBe("114055");
      expect(typeof res.body.data[0].pricePerLitreKobo).toBe("string");
    });

    it("reports sellable volume net of reservations", async () => {
      const org = await seedOrg({ type: "DEPOT" });
      const depot = await seedDepot(org.orgId);
      await seedListing(depot.id, { availableLitres: 50_000, reservedLitres: 20_000 });

      const res = await http.get("/api/v1/listings").expect(200);
      expect(res.body.data[0].sellableLitres).toBe("30000");
    });

    it("paginates", async () => {
      const org = await seedOrg({ type: "DEPOT" });
      const depot = await seedDepot(org.orgId);
      for (let i = 0; i < 5; i++) await seedListing(depot.id, { pricePerLitreKobo: BigInt(110_000 + i) });

      const res = await http.get("/api/v1/listings?page=2&pageSize=2").expect(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.total).toBe(5);
      expect(res.body.totalPages).toBe(3);
    });
  });

  // -------------------------------------------------------------------------
  describe("Listing lifecycle", () => {
    it("creates a listing and records the opening price in history", async () => {
      const org = await seedOrg({ type: "DEPOT" });
      const depot = await seedDepot(org.orgId);

      const res = await http
        .post("/api/v1/my/listings")
        .set(await authHeaderFor(app, org.userId, org.orgId))
        .send({ depotId: depot.id, product: "PMS", pricePerLitreNaira: 1140.55, availableLitres: 50_000 })
        .expect(201);

      // ₦1,140.55 -> 114055 kobo, exactly.
      expect(res.body.pricePerLitreKobo).toBe("114055");
      expect(await prisma.priceHistory.count({ where: { listingId: res.body.id } })).toBe(1);
    });

    it("defaults the validity window to 24 hours", async () => {
      const org = await seedOrg({ type: "DEPOT" });
      const depot = await seedDepot(org.orgId);

      const res = await http
        .post("/api/v1/my/listings")
        .set(await authHeaderFor(app, org.userId, org.orgId))
        .send({ depotId: depot.id, product: "PMS", pricePerLitreNaira: 1140, availableLitres: 1000 })
        .expect(201);

      const validUntil = new Date(res.body.validUntil).getTime();
      expect(validUntil).toBeGreaterThan(Date.now() + 23 * 3600_000);
      expect(validUntil).toBeLessThanOrEqual(Date.now() + 25 * 3600_000);
    });

    it("refuses a validity window beyond 30 days", async () => {
      const org = await seedOrg({ type: "DEPOT" });
      const depot = await seedDepot(org.orgId);

      await http
        .post("/api/v1/my/listings")
        .set(await authHeaderFor(app, org.userId, org.orgId))
        .send({
          depotId: depot.id,
          product: "PMS",
          pricePerLitreNaira: 1140,
          availableLitres: 1000,
          validUntil: new Date(Date.now() + 60 * 86_400_000).toISOString(),
        })
        .expect(400);
    });

    it("refuses a validity date in the past", async () => {
      const org = await seedOrg({ type: "DEPOT" });
      const depot = await seedDepot(org.orgId);

      await http
        .post("/api/v1/my/listings")
        .set(await authHeaderFor(app, org.userId, org.orgId))
        .send({
          depotId: depot.id,
          product: "PMS",
          pricePerLitreNaira: 1140,
          availableLitres: 1000,
          validUntil: new Date(Date.now() - 3600_000).toISOString(),
        })
        .expect(400);
    });

    it("refuses a minimum order larger than the available volume", async () => {
      const org = await seedOrg({ type: "DEPOT" });
      const depot = await seedDepot(org.orgId);

      await http
        .post("/api/v1/my/listings")
        .set(await authHeaderFor(app, org.userId, org.orgId))
        .send({
          depotId: depot.id,
          product: "PMS",
          pricePerLitreNaira: 1140,
          availableLitres: 1000,
          minOrderLitres: 5000,
        })
        .expect(400);
    });

    it("records a new history row when the price changes", async () => {
      const org = await seedOrg({ type: "DEPOT" });
      const depot = await seedDepot(org.orgId);
      const listing = await seedListing(depot.id);

      await http
        .patch(`/api/v1/my/listings/${listing.id}`)
        .set(await authHeaderFor(app, org.userId, org.orgId))
        .send({ pricePerLitreNaira: 1200 })
        .expect(200);

      const history = await prisma.priceHistory.findMany({ where: { listingId: listing.id } });
      expect(history).toHaveLength(1);
      expect(history[0].pricePerLitreKobo).toBe(120_000n);
    });

    it("blocks reducing stock below what is already reserved", async () => {
      const org = await seedOrg({ type: "DEPOT" });
      const depot = await seedDepot(org.orgId);
      const listing = await seedListing(depot.id, { availableLitres: 50_000, reservedLitres: 30_000 });

      const res = await http
        .patch(`/api/v1/my/listings/${listing.id}`)
        .set(await authHeaderFor(app, org.userId, org.orgId))
        .send({ availableLitres: 10_000 })
        .expect(400);

      expect(res.body.error.code).toBe("INSUFFICIENT_INVENTORY");
    });

    it("rejects a stale optimistic-lock version", async () => {
      const org = await seedOrg({ type: "DEPOT" });
      const depot = await seedDepot(org.orgId);
      const listing = await seedListing(depot.id);
      const headers = await authHeaderFor(app, org.userId, org.orgId);

      // First writer succeeds and bumps the version.
      await http
        .patch(`/api/v1/my/listings/${listing.id}`)
        .set(headers)
        .send({ pricePerLitreNaira: 1200, version: listing.version })
        .expect(200);

      // Second writer, holding the stale version, must be refused.
      const res = await http
        .patch(`/api/v1/my/listings/${listing.id}`)
        .set(headers)
        .send({ pricePerLitreNaira: 1300, version: listing.version })
        .expect(409);

      expect(res.body.error.code).toBe("CONCURRENT_MODIFICATION");
      const fresh = await prisma.productListing.findUniqueOrThrow({ where: { id: listing.id } });
      expect(fresh.pricePerLitreKobo).toBe(120_000n);
    });

    it("survives concurrent updates without losing one (no lost update)", async () => {
      const org = await seedOrg({ type: "DEPOT" });
      const depot = await seedDepot(org.orgId);
      const listing = await seedListing(depot.id);
      const headers = await authHeaderFor(app, org.userId, org.orgId);

      // Ten writers race with the same starting version.
      const results = await Promise.allSettled(
        Array.from({ length: 10 }, (_, i) =>
          http
            .patch(`/api/v1/my/listings/${listing.id}`)
            .set(headers)
            .send({ pricePerLitreNaira: 1200 + i, version: listing.version })
        )
      );

      const ok = results.filter((r) => r.status === "fulfilled" && r.value.status === 200);
      const conflicts = results.filter((r) => r.status === "fulfilled" && r.value.status === 409);

      // Exactly one may win; the rest must be told to retry.
      expect(ok).toHaveLength(1);
      expect(conflicts).toHaveLength(9);

      const fresh = await prisma.productListing.findUniqueOrThrow({ where: { id: listing.id } });
      expect(fresh.version).toBe(listing.version + 1);
    });

    it("prevents a STAFF member of another org from editing a listing", async () => {
      const owner = await seedOrg({ type: "DEPOT" });
      const attacker = await seedOrg({ type: "DEPOT", orgRole: OrgRole.STAFF });
      const depot = await seedDepot(owner.orgId);
      const listing = await seedListing(depot.id);

      await http
        .patch(`/api/v1/my/listings/${listing.id}`)
        .set(await authHeaderFor(app, attacker.userId, attacker.orgId))
        .send({ pricePerLitreNaira: 1 })
        .expect(404);
    });

    it("blocks an unverified organisation from listing product", async () => {
      const org = await seedOrg({ type: "DEPOT", verification: VerificationStatus.VERIFIED });
      const depot = await seedDepot(org.orgId);
      // Verification revoked after the depot existed.
      await prisma.organization.update({
        where: { id: org.orgId },
        data: { verificationStatus: VerificationStatus.SUSPENDED },
      });

      const res = await http
        .post("/api/v1/my/listings")
        .set(await authHeaderFor(app, org.userId, org.orgId))
        .send({ depotId: depot.id, product: "PMS", pricePerLitreNaira: 1140, availableLitres: 1000 })
        .expect(403);
      expect(res.body.error.code).toBe("ORG_NOT_VERIFIED");
    });
  });

  // -------------------------------------------------------------------------
  describe("Tanks", () => {
    it("adds a tank and refuses a level above capacity", async () => {
      const org = await seedOrg({ type: "DEPOT" });
      const depot = await seedDepot(org.orgId);
      const headers = await authHeaderFor(app, org.userId, org.orgId);

      await http
        .post(`/api/v1/my/depots/${depot.id}/tanks`)
        .set(headers)
        .send({ name: "Tank A", product: "PMS", capacityLitres: 1_000_000, currentLitres: 250_000 })
        .expect(201);

      await http
        .post(`/api/v1/my/depots/${depot.id}/tanks`)
        .set(headers)
        .send({ name: "Tank B", product: "AGO", capacityLitres: 100, currentLitres: 500 })
        .expect(400);
    });

    it("records a dip reading", async () => {
      const org = await seedOrg({ type: "DEPOT" });
      const depot = await seedDepot(org.orgId);
      const headers = await authHeaderFor(app, org.userId, org.orgId);

      const tank = await http
        .post(`/api/v1/my/depots/${depot.id}/tanks`)
        .set(headers)
        .send({ name: "Tank A", product: "PMS", capacityLitres: 1_000_000 })
        .expect(201);

      const res = await http
        .patch(`/api/v1/my/tanks/${tank.body.id}/level`)
        .set(headers)
        .send({ currentLitres: 333_333.125 })
        .expect(200);

      // 3dp precision preserved exactly.
      expect(res.body.currentLitres).toBe("333333.125");
      expect(res.body.lastDipAt).not.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  describe("Depot deactivation", () => {
    it("refuses while orders are in progress", async () => {
      const seller = await seedOrg({ type: "DEPOT" });
      const buyer = await seedOrg({ type: "MARKETER" });
      const depot = await seedDepot(seller.orgId);

      await prisma.order.create({
        data: {
          ref: "FL-TEST-0001",
          buyerOrgId: buyer.orgId,
          sellerOrgId: seller.orgId,
          depotId: depot.id,
          product: "PMS",
          quantityLitres: new Prisma.Decimal(1000),
          pricePerLitreKobo: 114_000n,
          subtotalKobo: 114_000_000n,
          totalKobo: 114_000_000n,
          status: "ESCROW_FUNDED",
        },
      });

      const res = await http
        .delete(`/api/v1/my/depots/${depot.id}`)
        .set(await authHeaderFor(app, seller.userId, seller.orgId))
        .expect(400);
      expect(res.body.error.message).toMatch(/in progress/i);
    });

    it("withdraws listings when deactivated", async () => {
      const org = await seedOrg({ type: "DEPOT" });
      const depot = await seedDepot(org.orgId);
      await seedListing(depot.id);

      await http
        .delete(`/api/v1/my/depots/${depot.id}`)
        .set(await authHeaderFor(app, org.userId, org.orgId))
        .expect(200);

      expect(await prisma.productListing.count({ where: { depotId: depot.id, isActive: true } })).toBe(0);
      const res = await http.get("/api/v1/depots").expect(200);
      expect(res.body.data).toHaveLength(0);
    });
  });
});
