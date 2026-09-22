import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { createTestApp, prisma, readCookie, registrationPayload, resetDatabase, validPassword } from "./helpers";

/**
 * Authentication integration tests.
 *
 * These assert *security properties*, not just happy paths: enumeration
 * resistance, lockout, session revocation, refresh-token rotation and theft
 * detection, and password-reset single use.
 */
describe("Auth (integration)", () => {
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
  describe("POST /auth/register", () => {
    it("creates the user, organisation and OWNER membership atomically", async () => {
      const payload = registrationPayload();
      const res = await http.post("/api/v1/auth/register").send(payload).expect(201);

      expect(res.body.user.email).toBe(payload.email);
      expect(res.body.accessToken).toEqual(expect.any(String));
      expect(res.body.user.organizations).toHaveLength(1);
      expect(res.body.user.organizations[0].orgRole).toBe("OWNER");
      // New organisations must not start verified.
      expect(res.body.user.organizations[0].verificationStatus).toBe("UNVERIFIED");

      // The refresh token is delivered as an httpOnly cookie, never in the body.
      expect(res.body.refreshToken).toBeUndefined();
      const setCookie = res.headers["set-cookie"] as unknown as string[];
      expect(setCookie.join(";")).toMatch(/HttpOnly/i);
      expect(setCookie.join(";")).toMatch(/SameSite=Strict/i);
    });

    it("never stores the password in plaintext and uses argon2id", async () => {
      const payload = registrationPayload();
      await http.post("/api/v1/auth/register").send(payload).expect(201);

      const user = await prisma.user.findUnique({ where: { email: payload.email } });
      expect(user).not.toBeNull();
      expect(user!.passwordHash).not.toContain(payload.password);
      expect(user!.passwordHash.startsWith("$argon2id$")).toBe(true);
    });

    it("rejects a duplicate email", async () => {
      const payload = registrationPayload();
      await http.post("/api/v1/auth/register").send(payload).expect(201);

      const res = await http
        .post("/api/v1/auth/register")
        .send({ ...registrationPayload(), email: payload.email })
        .expect(409);
      expect(res.body.error.code).toBe("DUPLICATE_RESOURCE");
    });

    it("rejects a duplicate phone number", async () => {
      const payload = registrationPayload();
      await http.post("/api/v1/auth/register").send(payload).expect(201);

      const res = await http
        .post("/api/v1/auth/register")
        .send({ ...registrationPayload(), phone: payload.phone })
        .expect(409);
      expect(res.body.error.code).toBe("DUPLICATE_RESOURCE");
    });

    it("leaves no partial data when registration fails midway", async () => {
      const payload = registrationPayload();
      await http.post("/api/v1/auth/register").send(payload).expect(201);
      const orgsBefore = await prisma.organization.count();

      // Same phone, different email: fails after the email check passes.
      await http
        .post("/api/v1/auth/register")
        .send({ ...registrationPayload(), phone: payload.phone })
        .expect(409);

      expect(await prisma.organization.count()).toBe(orgsBefore);
      expect(await prisma.user.count()).toBe(1);
    });

    it.each([
      ["short", "Ab1cdef"],
      ["no digit", "abcdefghijk"],
      ["no letter", "1234567890"],
      ["common", "password123"],
    ])("rejects a weak password (%s)", async (_label, password) => {
      const res = await http.post("/api/v1/auth/register").send(registrationPayload({ password })).expect(400);
      expect(res.body.error.code).toBe("VALIDATION_FAILED");
    });

    it("rejects a non-Nigerian phone number", async () => {
      await http.post("/api/v1/auth/register").send(registrationPayload({ phone: "+1415555000" })).expect(400);
    });

    it("normalises 0803… to +234803… so the same line cannot register twice", async () => {
      const local = "08031234567";
      await http.post("/api/v1/auth/register").send(registrationPayload({ phone: local })).expect(201);

      const user = await prisma.user.findFirst({ where: { phone: "+2348031234567" } });
      expect(user).not.toBeNull();

      await http.post("/api/v1/auth/register").send(registrationPayload({ phone: "+2348031234567" })).expect(409);
    });

    it("refuses to let a user self-register as ADMIN", async () => {
      await http.post("/api/v1/auth/register").send(registrationPayload({ role: "ADMIN" })).expect(400);
    });
  });

  // -------------------------------------------------------------------------
  describe("POST /auth/login", () => {
    let creds: ReturnType<typeof registrationPayload>;

    beforeEach(async () => {
      creds = registrationPayload();
      await http.post("/api/v1/auth/register").send(creds).expect(201);
    });

    it("authenticates with correct credentials", async () => {
      const res = await http
        .post("/api/v1/auth/login")
        .send({ email: creds.email, password: creds.password })
        .expect(200);
      expect(res.body.accessToken).toEqual(expect.any(String));
    });

    it("returns an identical error for unknown email and wrong password", async () => {
      const unknown = await http
        .post("/api/v1/auth/login")
        .send({ email: "nobody@example.com", password: validPassword })
        .expect(401);

      const wrong = await http
        .post("/api/v1/auth/login")
        .send({ email: creds.email, password: "WrongPassword123" })
        .expect(401);

      // No account enumeration: same code and same message.
      expect(unknown.body.error.code).toBe("INVALID_CREDENTIALS");
      expect(wrong.body.error.code).toBe("INVALID_CREDENTIALS");
      expect(unknown.body.error.message).toBe(wrong.body.error.message);
    });

    it("locks the account after repeated failures and unlocks on expiry", async () => {
      for (let i = 0; i < 5; i++) {
        await http.post("/api/v1/auth/login").send({ email: creds.email, password: "WrongPassword123" });
      }

      // Even the *correct* password is refused while locked.
      const locked = await http
        .post("/api/v1/auth/login")
        .send({ email: creds.email, password: creds.password })
        .expect(401);
      expect(locked.body.error.code).toBe("ACCOUNT_LOCKED");

      // Simulate the lockout window elapsing.
      await prisma.user.update({ where: { email: creds.email }, data: { lockedUntil: new Date(Date.now() - 1000) } });
      await http.post("/api/v1/auth/login").send({ email: creds.email, password: creds.password }).expect(200);
    });

    it("resets the failure counter after a successful login", async () => {
      await http.post("/api/v1/auth/login").send({ email: creds.email, password: "WrongPassword123" }).expect(401);
      await http.post("/api/v1/auth/login").send({ email: creds.email, password: creds.password }).expect(200);

      const user = await prisma.user.findUnique({ where: { email: creds.email } });
      expect(user!.failedLoginCount).toBe(0);
    });

    it("refuses a deactivated account", async () => {
      await prisma.user.update({ where: { email: creds.email }, data: { isActive: false } });
      const res = await http
        .post("/api/v1/auth/login")
        .send({ email: creds.email, password: creds.password })
        .expect(403);
      expect(res.body.error.code).toBe("ACCOUNT_INACTIVE");
    });
  });

  // -------------------------------------------------------------------------
  describe("Session lifecycle", () => {
    let creds: ReturnType<typeof registrationPayload>;
    let accessToken: string;
    let refreshCookie: string;

    beforeEach(async () => {
      creds = registrationPayload();
      const res = await http.post("/api/v1/auth/register").send(creds).expect(201);
      accessToken = res.body.accessToken;
      refreshCookie = readCookie(res, "fl_refresh")!;
    });

    it("authorises /auth/me with a valid token and rejects without one", async () => {
      await http.get("/api/v1/auth/me").set("Authorization", `Bearer ${accessToken}`).expect(200);
      await http.get("/api/v1/auth/me").expect(401);
      await http.get("/api/v1/auth/me").set("Authorization", "Bearer not-a-token").expect(401);
    });

    it("rotates the refresh token and invalidates the previous one", async () => {
      const first = await http
        .post("/api/v1/auth/refresh")
        .set("Cookie", `fl_refresh=${refreshCookie}`)
        .expect(200);

      const rotated = readCookie(first, "fl_refresh")!;
      expect(rotated).not.toBe(refreshCookie);

      // The new token works.
      await http.post("/api/v1/auth/refresh").set("Cookie", `fl_refresh=${rotated}`).expect(200);
    });

    it("revokes the whole session family when a rotated token is replayed (theft detection)", async () => {
      const first = await http
        .post("/api/v1/auth/refresh")
        .set("Cookie", `fl_refresh=${refreshCookie}`)
        .expect(200);
      const rotated = readCookie(first, "fl_refresh")!;

      // Attacker replays the OLD token.
      const replay = await http
        .post("/api/v1/auth/refresh")
        .set("Cookie", `fl_refresh=${refreshCookie}`)
        .expect(401);
      expect(replay.body.error.code).toBe("TOKEN_EXPIRED");

      // The legitimate user's newer token is now revoked too.
      await http.post("/api/v1/auth/refresh").set("Cookie", `fl_refresh=${rotated}`).expect(401);

      const live = await prisma.session.count({ where: { revokedAt: null } });
      expect(live).toBe(0);
    });

    it("invalidates the access token immediately when the session is revoked", async () => {
      await http.get("/api/v1/auth/me").set("Authorization", `Bearer ${accessToken}`).expect(200);

      // Deliberately WITHOUT the refresh cookie: revocation must key on the
      // session id in the access token, not on the cookie being present.
      await http.post("/api/v1/auth/logout").set("Authorization", `Bearer ${accessToken}`).expect(204);

      // The JWT itself is still cryptographically valid, but the session is gone.
      await http.get("/api/v1/auth/me").set("Authorization", `Bearer ${accessToken}`).expect(401);
      expect(await prisma.session.count({ where: { revokedAt: null } })).toBe(0);
    });

    it("also revokes the session when logout is called with the refresh cookie", async () => {
      await http
        .post("/api/v1/auth/logout")
        .set("Authorization", `Bearer ${accessToken}`)
        .set("Cookie", `fl_refresh=${refreshCookie}`)
        .expect(204);
      await http.get("/api/v1/auth/me").set("Authorization", `Bearer ${accessToken}`).expect(401);
    });

    it("invalidates access immediately when the account is deactivated", async () => {
      await prisma.user.update({ where: { email: creds.email }, data: { isActive: false } });
      const res = await http.get("/api/v1/auth/me").set("Authorization", `Bearer ${accessToken}`).expect(403);
      expect(res.body.error.code).toBe("ACCOUNT_INACTIVE");
    });

    it("rejects a refresh token that has expired", async () => {
      await prisma.session.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
      await http.post("/api/v1/auth/refresh").set("Cookie", `fl_refresh=${refreshCookie}`).expect(401);
    });

    it("logout-all revokes every session for the user", async () => {
      await http.post("/api/v1/auth/login").send({ email: creds.email, password: creds.password }).expect(200);
      expect(await prisma.session.count({ where: { revokedAt: null } })).toBe(2);

      await http.post("/api/v1/auth/logout-all").set("Authorization", `Bearer ${accessToken}`).expect(204);
      expect(await prisma.session.count({ where: { revokedAt: null } })).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  describe("Password management", () => {
    let creds: ReturnType<typeof registrationPayload>;
    let accessToken: string;

    beforeEach(async () => {
      creds = registrationPayload();
      const res = await http.post("/api/v1/auth/register").send(creds).expect(201);
      accessToken = res.body.accessToken;
    });

    it("changes the password and revokes all sessions", async () => {
      await http
        .post("/api/v1/auth/change-password")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ currentPassword: creds.password, newPassword: "An0therStrongPass!" })
        .expect(204);

      expect(await prisma.session.count({ where: { revokedAt: null } })).toBe(0);
      await http.get("/api/v1/auth/me").set("Authorization", `Bearer ${accessToken}`).expect(401);

      await http.post("/api/v1/auth/login").send({ email: creds.email, password: creds.password }).expect(401);
      await http
        .post("/api/v1/auth/login")
        .send({ email: creds.email, password: "An0therStrongPass!" })
        .expect(200);
    });

    it("refuses a password change with the wrong current password", async () => {
      const res = await http
        .post("/api/v1/auth/change-password")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ currentPassword: "WrongPassword123", newPassword: "An0therStrongPass!" })
        .expect(401);
      expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
    });

    it("does not reveal whether an email is registered on forgot-password", async () => {
      const known = await http.post("/api/v1/auth/forgot-password").send({ email: creds.email }).expect(202);
      const unknown = await http
        .post("/api/v1/auth/forgot-password")
        .send({ email: "nobody@example.com" })
        .expect(202);

      expect(known.body.message).toBe(unknown.body.message);
    });

    it("resets the password with a valid token, once only", async () => {
      const issued = await http.post("/api/v1/auth/forgot-password").send({ email: creds.email }).expect(202);
      const token = issued.body.devResetToken as string;
      expect(token).toEqual(expect.any(String));

      await http.post("/api/v1/auth/reset-password").send({ token, newPassword: "Recovered!Pass9" }).expect(204);
      await http.post("/api/v1/auth/login").send({ email: creds.email, password: "Recovered!Pass9" }).expect(200);

      // Replay of the same token must fail.
      await http.post("/api/v1/auth/reset-password").send({ token, newPassword: "Another!Pass9" }).expect(401);
    });

    it("rejects an expired reset token", async () => {
      const issued = await http.post("/api/v1/auth/forgot-password").send({ email: creds.email }).expect(202);
      const token = issued.body.devResetToken as string;

      await prisma.verificationToken.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
      await http.post("/api/v1/auth/reset-password").send({ token, newPassword: "Recovered!Pass9" }).expect(401);
    });

    it("clears account lockout after a successful reset", async () => {
      for (let i = 0; i < 5; i++) {
        await http.post("/api/v1/auth/login").send({ email: creds.email, password: "WrongPassword123" });
      }
      const issued = await http.post("/api/v1/auth/forgot-password").send({ email: creds.email }).expect(202);
      await http
        .post("/api/v1/auth/reset-password")
        .send({ token: issued.body.devResetToken, newPassword: "Recovered!Pass9" })
        .expect(204);

      await http.post("/api/v1/auth/login").send({ email: creds.email, password: "Recovered!Pass9" }).expect(200);
    });
  });

  // -------------------------------------------------------------------------
  describe("Audit trail", () => {
    it("records registration, login and logout", async () => {
      const creds = registrationPayload();
      const reg = await http.post("/api/v1/auth/register").send(creds).expect(201);
      await http.post("/api/v1/auth/login").send({ email: creds.email, password: creds.password }).expect(200);
      await http.post("/api/v1/auth/logout").set("Authorization", `Bearer ${reg.body.accessToken}`).expect(204);

      const actions = await prisma.auditLog.findMany({ select: { action: true } });
      const names = actions.map((a) => a.action);
      expect(names).toEqual(expect.arrayContaining(["auth.registered", "auth.login", "auth.logout"]));
    });

    it("never writes a password into the audit trail", async () => {
      const creds = registrationPayload();
      await http.post("/api/v1/auth/register").send(creds).expect(201);

      const logs = await prisma.auditLog.findMany();
      const serialized = JSON.stringify(logs);
      expect(serialized).not.toContain(creds.password);
    });
  });
});
