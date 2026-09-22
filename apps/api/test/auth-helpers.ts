import { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { randomBytes, createHash } from "node:crypto";
import { prisma } from "./helpers";

/**
 * Issues a real access token for a seeded user by creating a genuine session
 * row and signing the same claims the auth service would. Tests therefore
 * exercise the real guard, not a stubbed one.
 */
export async function authHeaderFor(
  app: INestApplication,
  userId: string,
  orgId?: string
): Promise<Record<string, string>> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  const raw = randomBytes(32).toString("base64url");
  const session = await prisma.session.create({
    data: {
      userId,
      refreshTokenHash: createHash("sha256").update(raw).digest("hex"),
      expiresAt: new Date(Date.now() + 86_400_000),
    },
  });

  const jwt = app.get(JwtService);
  const accessToken = await jwt.signAsync(
    { sub: user.id, email: user.email, role: user.role, sid: session.id },
    { secret: process.env.JWT_ACCESS_SECRET, expiresIn: "15m" }
  );

  return {
    Authorization: `Bearer ${accessToken}`,
    ...(orgId ? { "X-Org-Id": orgId } : {}),
  };
}
