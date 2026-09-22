import { INestApplication } from "@nestjs/common";
import { KycDocumentType, OrgRole, VerificationStatus } from "@prisma/client";
import request from "supertest";
import { createTestApp, prisma, resetDatabase } from "./helpers";
import { authHeaderFor } from "./auth-helpers";
import { fakePdf, seedAdmin, seedApprovedKyc, seedDepot, seedListing, seedOrg } from "./factories";

/**
 * Verification is the trust layer of the marketplace: it decides who is
 * allowed to trade. These tests assert that the gates cannot be bypassed.
 */
describe("Organisations & verification (integration)", () => {
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
  describe("Access control", () => {
    it("requires authentication", async () => {
      await http.get("/api/v1/organizations/me").expect(401);
    });

    it("rejects an X-Org-Id the caller is not a member of", async () => {
      const mine = await seedOrg({ type: "MARKETER" });
      const other = await seedOrg({ type: "DEPOT" });

      const res = await http
        .get("/api/v1/organizations/me")
        .set(await authHeaderFor(app, mine.userId, other.orgId))
        .expect(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("prevents a VIEWER from editing the organisation", async () => {
      const org = await seedOrg({ type: "DEPOT", orgRole: OrgRole.VIEWER });
      const res = await http
        .patch("/api/v1/organizations/me")
        .set(await authHeaderFor(app, org.userId, org.orgId))
        .send({ addressLine: "12 Marina, Lagos" })
        .expect(403);
      expect(res.body.error.code).toBe("INSUFFICIENT_ORG_ROLE");
    });

    it("allows an OWNER to edit the organisation", async () => {
      const org = await seedOrg({ type: "DEPOT", verification: VerificationStatus.UNVERIFIED });
      await http
        .patch("/api/v1/organizations/me")
        .set(await authHeaderFor(app, org.userId, org.orgId))
        .send({ addressLine: "12 Marina, Lagos" })
        .expect(200);
    });

    it("stops a verified organisation from silently changing its legal identity", async () => {
      const org = await seedOrg({ type: "DEPOT", verification: VerificationStatus.VERIFIED });
      const res = await http
        .patch("/api/v1/organizations/me")
        .set(await authHeaderFor(app, org.userId, org.orgId))
        .send({ name: "Totally Different Company Ltd" })
        .expect(400);
      expect(res.body.error.message).toMatch(/re-verification/i);
    });
  });

  // -------------------------------------------------------------------------
  describe("KYC upload", () => {
    it("accepts a PDF and moves the organisation into review", async () => {
      const org = await seedOrg({ type: "DEPOT", verification: VerificationStatus.UNVERIFIED });
      const headers = await authHeaderFor(app, org.userId, org.orgId);

      const res = await http
        .post("/api/v1/organizations/me/documents")
        .set(headers)
        .field("type", KycDocumentType.CAC_CERTIFICATE)
        .attach("file", fakePdf(), { filename: "cac.pdf", contentType: "application/pdf" })
        .expect(201);

      expect(res.body.status).toBe("PENDING");
      expect(res.body.checksum).toEqual(expect.any(String));

      const updated = await prisma.organization.findUniqueOrThrow({ where: { id: org.orgId } });
      expect(updated.verificationStatus).toBe(VerificationStatus.PENDING);
    });

    it("rejects a file whose content does not match its declared type", async () => {
      const org = await seedOrg({ type: "DEPOT", verification: VerificationStatus.UNVERIFIED });
      const res = await http
        .post("/api/v1/organizations/me/documents")
        .set(await authHeaderFor(app, org.userId, org.orgId))
        .field("type", KycDocumentType.CAC_CERTIFICATE)
        // Declared PDF, actually a script.
        .attach("file", Buffer.from("#!/bin/sh\nrm -rf /\n"), {
          filename: "evil.pdf",
          contentType: "application/pdf",
        })
        .expect(400);
      expect(res.body.error.code).toBe("UNSUPPORTED_MEDIA_TYPE");
    });

    it("rejects an unsupported file type", async () => {
      const org = await seedOrg({ type: "DEPOT", verification: VerificationStatus.UNVERIFIED });
      await http
        .post("/api/v1/organizations/me/documents")
        .set(await authHeaderFor(app, org.userId, org.orgId))
        .field("type", KycDocumentType.CAC_CERTIFICATE)
        .attach("file", Buffer.from("MZ\x90\x00"), {
          filename: "x.exe",
          contentType: "application/x-msdownload",
        })
        .expect(400);
    });

    it("treats an identical re-upload as the same document (retry safety)", async () => {
      const org = await seedOrg({ type: "DEPOT", verification: VerificationStatus.UNVERIFIED });
      const headers = await authHeaderFor(app, org.userId, org.orgId);

      const first = await http
        .post("/api/v1/organizations/me/documents")
        .set(headers)
        .field("type", KycDocumentType.CAC_CERTIFICATE)
        .attach("file", fakePdf(), { filename: "cac.pdf", contentType: "application/pdf" })
        .expect(201);

      const second = await http
        .post("/api/v1/organizations/me/documents")
        .set(headers)
        .field("type", KycDocumentType.CAC_CERTIFICATE)
        .attach("file", fakePdf(), { filename: "cac.pdf", contentType: "application/pdf" })
        .expect(201);

      expect(second.body.id).toBe(first.body.id);
      expect(await prisma.kycDocument.count({ where: { orgId: org.orgId } })).toBe(1);
    });

    it("rejects a document that is already expired", async () => {
      const org = await seedOrg({ type: "DEPOT", verification: VerificationStatus.UNVERIFIED });
      await http
        .post("/api/v1/organizations/me/documents")
        .set(await authHeaderFor(app, org.userId, org.orgId))
        .field("type", KycDocumentType.NMDPRA_LICENSE)
        .field("expiresAt", new Date(Date.now() - 86_400_000).toISOString())
        .attach("file", fakePdf(), { filename: "licence.pdf", contentType: "application/pdf" })
        .expect(400);
    });

    it("does not let one organisation read another's documents", async () => {
      const owner = await seedOrg({ type: "DEPOT", verification: VerificationStatus.UNVERIFIED });
      const outsider = await seedOrg({ type: "MARKETER" });

      const uploaded = await http
        .post("/api/v1/organizations/me/documents")
        .set(await authHeaderFor(app, owner.userId, owner.orgId))
        .field("type", KycDocumentType.CAC_CERTIFICATE)
        .attach("file", fakePdf(), { filename: "cac.pdf", contentType: "application/pdf" })
        .expect(201);

      await http
        .get(`/api/v1/documents/${uploaded.body.id}/file`)
        .set(await authHeaderFor(app, outsider.userId, outsider.orgId))
        .expect(403);

      // The owner can.
      const own = await http
        .get(`/api/v1/documents/${uploaded.body.id}/file`)
        .set(await authHeaderFor(app, owner.userId, owner.orgId))
        .expect(200);
      expect(own.headers["content-disposition"]).toMatch(/attachment/);
    });
  });

  // -------------------------------------------------------------------------
  describe("Admin review", () => {
    it("refuses to verify an organisation with missing documents", async () => {
      const org = await seedOrg({ type: "DEPOT", verification: VerificationStatus.PENDING });
      const admin = await seedAdmin();

      const res = await http
        .post(`/api/v1/admin/organizations/${org.orgId}/review`)
        .set(await authHeaderFor(app, admin.userId))
        .send({ decision: VerificationStatus.VERIFIED })
        .expect(400);

      expect(res.body.error.message).toMatch(/missing or unapproved/i);
      const after = await prisma.organization.findUniqueOrThrow({ where: { id: org.orgId } });
      expect(after.verificationStatus).toBe(VerificationStatus.PENDING);
    });

    it("verifies once every required document is approved", async () => {
      const org = await seedOrg({ type: "DEPOT", verification: VerificationStatus.PENDING });
      await seedApprovedKyc(org.orgId, [
        KycDocumentType.CAC_CERTIFICATE,
        KycDocumentType.NMDPRA_LICENSE,
        KycDocumentType.DIRECTOR_ID,
      ]);
      const admin = await seedAdmin();

      await http
        .post(`/api/v1/admin/organizations/${org.orgId}/review`)
        .set(await authHeaderFor(app, admin.userId))
        .send({ decision: VerificationStatus.VERIFIED, notes: "Documents check out" })
        .expect(201);

      const after = await prisma.organization.findUniqueOrThrow({ where: { id: org.orgId } });
      expect(after.verificationStatus).toBe(VerificationStatus.VERIFIED);
      expect(after.verifiedAt).not.toBeNull();
      expect(await prisma.verificationReview.count({ where: { orgId: org.orgId } })).toBe(1);
    });

    it("refuses to verify when an approved document has expired", async () => {
      const org = await seedOrg({ type: "MARKETER", verification: VerificationStatus.PENDING });
      await seedApprovedKyc(org.orgId, [KycDocumentType.CAC_CERTIFICATE, KycDocumentType.DIRECTOR_ID]);
      await prisma.kycDocument.updateMany({
        where: { orgId: org.orgId, type: KycDocumentType.CAC_CERTIFICATE },
        data: { expiresAt: new Date(Date.now() - 86_400_000) },
      });
      const admin = await seedAdmin();

      const res = await http
        .post(`/api/v1/admin/organizations/${org.orgId}/review`)
        .set(await authHeaderFor(app, admin.userId))
        .send({ decision: VerificationStatus.VERIFIED })
        .expect(400);
      expect(res.body.error.message).toMatch(/expired/i);
    });

    it("requires a reason when rejecting", async () => {
      const org = await seedOrg({ type: "MARKETER", verification: VerificationStatus.PENDING });
      const admin = await seedAdmin();

      await http
        .post(`/api/v1/admin/organizations/${org.orgId}/review`)
        .set(await authHeaderFor(app, admin.userId))
        .send({ decision: VerificationStatus.REJECTED })
        .expect(400);

      await http
        .post(`/api/v1/admin/organizations/${org.orgId}/review`)
        .set(await authHeaderFor(app, admin.userId))
        .send({ decision: VerificationStatus.REJECTED, notes: "CAC certificate is illegible" })
        .expect(201);
    });

    it("rejects an invalid verification transition", async () => {
      const org = await seedOrg({ type: "MARKETER", verification: VerificationStatus.UNVERIFIED });
      const admin = await seedAdmin();

      const res = await http
        .post(`/api/v1/admin/organizations/${org.orgId}/review`)
        .set(await authHeaderFor(app, admin.userId))
        .send({ decision: VerificationStatus.SUSPENDED, notes: "Not applicable yet" })
        .expect(400);
      expect(res.body.error.code).toBe("INVALID_STATE_TRANSITION");
    });

    it("withdraws all listings when an organisation is suspended", async () => {
      const org = await seedOrg({ type: "DEPOT", verification: VerificationStatus.VERIFIED });
      const depot = await seedDepot(org.orgId);
      await seedListing(depot.id);
      const admin = await seedAdmin();

      await http
        .post(`/api/v1/admin/organizations/${org.orgId}/review`)
        .set(await authHeaderFor(app, admin.userId))
        .send({ decision: VerificationStatus.SUSPENDED, notes: "Licence revoked by the regulator" })
        .expect(201);

      const active = await prisma.productListing.count({ where: { depotId: depot.id, isActive: true } });
      expect(active).toBe(0);
    });

    it("denies the admin review queue to non-admins", async () => {
      const org = await seedOrg({ type: "DEPOT" });
      await http
        .get("/api/v1/admin/organizations")
        .set(await authHeaderFor(app, org.userId, org.orgId))
        .expect(403);
    });

    it("orders the review queue oldest-first", async () => {
      const older = await seedOrg({ type: "DEPOT", verification: VerificationStatus.PENDING, name: "Older Co" });
      await prisma.organization.update({
        where: { id: older.orgId },
        data: { createdAt: new Date(Date.now() - 86_400_000) },
      });
      await seedOrg({ type: "DEPOT", verification: VerificationStatus.PENDING, name: "Newer Co" });
      const admin = await seedAdmin();

      const res = await http
        .get("/api/v1/admin/organizations?status=PENDING")
        .set(await authHeaderFor(app, admin.userId))
        .expect(200);

      expect(res.body.data[0].name).toBe("Older Co");
    });
  });

  // -------------------------------------------------------------------------
  describe("Members", () => {
    it("prevents removing the last owner", async () => {
      const org = await seedOrg({ type: "DEPOT" });
      const res = await http
        .patch(`/api/v1/organizations/me/members/${org.memberId}`)
        .set(await authHeaderFor(app, org.userId, org.orgId))
        .send({ role: OrgRole.STAFF })
        .expect(400);
      expect(res.body.error.message).toMatch(/at least one owner/i);
    });

    it("refuses to invite someone as OWNER", async () => {
      const org = await seedOrg({ type: "DEPOT" });
      await http
        .post("/api/v1/organizations/me/members/invite")
        .set(await authHeaderFor(app, org.userId, org.orgId))
        .send({ email: "new@example.com", role: OrgRole.OWNER })
        .expect(400);
    });

    it("invites an existing user directly", async () => {
      const org = await seedOrg({ type: "DEPOT" });
      const other = await seedOrg({ type: "MARKETER" });

      const res = await http
        .post("/api/v1/organizations/me/members/invite")
        .set(await authHeaderFor(app, org.userId, org.orgId))
        .send({ email: other.email, role: OrgRole.STAFF })
        .expect(201);

      expect(res.body.requiresSignup).toBe(false);
      expect(await prisma.orgMember.count({ where: { orgId: org.orgId } })).toBe(2);
    });

    it("issues an invite token for an unknown email", async () => {
      const org = await seedOrg({ type: "DEPOT" });
      const res = await http
        .post("/api/v1/organizations/me/members/invite")
        .set(await authHeaderFor(app, org.userId, org.orgId))
        .send({ email: "brand-new@example.com", role: OrgRole.MANAGER })
        .expect(201);

      expect(res.body.requiresSignup).toBe(true);
      expect(await prisma.verificationToken.count({ where: { purpose: "ORG_INVITE" } })).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  describe("Bank accounts", () => {
    it("makes the first account primary automatically", async () => {
      const org = await seedOrg({ type: "DEPOT" });
      const res = await http
        .post("/api/v1/organizations/me/bank-accounts")
        .set(await authHeaderFor(app, org.userId, org.orgId))
        .send({ bankName: "GTBank", bankCode: "058", accountNumber: "0123456789", accountName: "Depot Ltd" })
        .expect(201);
      expect(res.body.isPrimary).toBe(true);
      // Never auto-trusted: a human still confirms before payout.
      expect(res.body.isVerified).toBe(false);
    });

    it("keeps exactly one primary account when a second is added as primary", async () => {
      const org = await seedOrg({ type: "DEPOT" });
      const headers = await authHeaderFor(app, org.userId, org.orgId);

      await http
        .post("/api/v1/organizations/me/bank-accounts")
        .set(headers)
        .send({ bankName: "GTBank", bankCode: "058", accountNumber: "0123456789", accountName: "Depot Ltd" })
        .expect(201);

      await http
        .post("/api/v1/organizations/me/bank-accounts")
        .set(headers)
        .send({
          bankName: "Zenith",
          bankCode: "057",
          accountNumber: "9876543210",
          accountName: "Depot Ltd",
          isPrimary: true,
        })
        .expect(201);

      const primaries = await prisma.bankAccount.count({ where: { orgId: org.orgId, isPrimary: true } });
      expect(primaries).toBe(1);
    });

    it("rejects a duplicate account and a malformed NUBAN", async () => {
      const org = await seedOrg({ type: "DEPOT" });
      const headers = await authHeaderFor(app, org.userId, org.orgId);
      const body = { bankName: "GTBank", bankCode: "058", accountNumber: "0123456789", accountName: "Depot Ltd" };

      await http.post("/api/v1/organizations/me/bank-accounts").set(headers).send(body).expect(201);
      await http.post("/api/v1/organizations/me/bank-accounts").set(headers).send(body).expect(409);

      await http
        .post("/api/v1/organizations/me/bank-accounts")
        .set(headers)
        .send({ ...body, accountNumber: "12345" })
        .expect(400);
    });

    it("hides bank accounts from roles without finance access", async () => {
      const org = await seedOrg({ type: "DEPOT", orgRole: OrgRole.STAFF });
      await http
        .get("/api/v1/organizations/me/bank-accounts")
        .set(await authHeaderFor(app, org.userId, org.orgId))
        .expect(403);
    });
  });
});
