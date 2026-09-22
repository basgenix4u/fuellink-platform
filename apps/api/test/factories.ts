import { KycDocumentStatus, KycDocumentType, OrgRole, Prisma, Role, VerificationStatus } from "@prisma/client";
import { hash } from "@node-rs/argon2";
import { prisma } from "./helpers";

let counter = 0;
const uid = () => `${Date.now().toString(36)}${(counter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const TEST_PASSWORD = "Str0ngPassphrase!";

/** Pre-computed so factories do not pay the argon2 cost on every call. */
let cachedHash: string | null = null;
async function passwordHash(): Promise<string> {
  cachedHash ??= await hash(TEST_PASSWORD, { memoryCost: 19456, timeCost: 2, parallelism: 1 });
  return cachedHash;
}

export interface SeededOrg {
  orgId: string;
  userId: string;
  email: string;
  memberId: string;
}

/**
 * Creates a user + organisation + OWNER membership directly in the database.
 * Verified by default: most tests are about what happens *after* onboarding.
 */
export async function seedOrg(options: {
  type: "DEPOT" | "MARKETER" | "PLATFORM";
  role?: Role;
  orgRole?: OrgRole;
  verification?: VerificationStatus;
  name?: string;
}): Promise<SeededOrg> {
  const id = uid();
  const user = await prisma.user.create({
    data: {
      email: `${options.type.toLowerCase()}-${id}@example.com`,
      phone: `+23480${String(10_000_000 + Math.floor(Math.random() * 89_999_999))}`,
      passwordHash: await passwordHash(),
      name: `${options.type} User ${id}`,
      role: options.role ?? (options.type === "DEPOT" ? Role.DEPOT : Role.MARKETER),
    },
  });

  const org = await prisma.organization.create({
    data: {
      name: options.name ?? `${options.type} Org ${id}`,
      slug: `${options.type.toLowerCase()}-org-${id}`,
      type: options.type,
      verificationStatus: options.verification ?? VerificationStatus.VERIFIED,
      verifiedAt: (options.verification ?? VerificationStatus.VERIFIED) === VerificationStatus.VERIFIED ? new Date() : null,
    },
  });

  const member = await prisma.orgMember.create({
    data: { orgId: org.id, userId: user.id, role: options.orgRole ?? OrgRole.OWNER, acceptedAt: new Date() },
  });

  return { orgId: org.id, userId: user.id, email: user.email, memberId: member.id };
}

export async function seedAdmin(): Promise<{ userId: string; email: string }> {
  const id = uid();
  const user = await prisma.user.create({
    data: {
      email: `admin-${id}@fuellink.ng`,
      phone: `+23481${String(10_000_000 + Math.floor(Math.random() * 89_999_999))}`,
      passwordHash: await passwordHash(),
      name: "Platform Admin",
      role: Role.ADMIN,
    },
  });
  return { userId: user.id, email: user.email };
}

export async function seedDepot(orgId: string, overrides: Partial<{ name: string; state: string }> = {}) {
  const id = uid();
  return prisma.depot.create({
    data: {
      orgId,
      name: overrides.name ?? `Depot ${id}`,
      slug: `depot-${id}`,
      state: overrides.state ?? "Lagos",
      gantryActive: true,
    },
  });
}

export async function seedListing(
  depotId: string,
  overrides: Partial<{
    product: "PMS" | "AGO" | "ATK" | "LPG" | "DPK";
    pricePerLitreKobo: bigint;
    availableLitres: number;
    reservedLitres: number;
    minOrderLitres: number;
    validUntil: Date;
    isActive: boolean;
  }> = {}
) {
  const validUntil = overrides.validUntil ?? new Date(Date.now() + 86_400_000);
  // The DB enforces validUntil > validFrom. To seed an *expired* listing the
  // window must open before it closes, exactly as a real one that has aged out.
  const validFrom = validUntil.getTime() <= Date.now() ? new Date(validUntil.getTime() - 86_400_000) : new Date();

  return prisma.productListing.create({
    data: {
      depotId,
      product: overrides.product ?? "PMS",
      pricePerLitreKobo: overrides.pricePerLitreKobo ?? 114_000n,
      availableLitres: new Prisma.Decimal(overrides.availableLitres ?? 100_000),
      reservedLitres: new Prisma.Decimal(overrides.reservedLitres ?? 0),
      minOrderLitres: new Prisma.Decimal(overrides.minOrderLitres ?? 0),
      validFrom,
      validUntil,
      isActive: overrides.isActive ?? true,
    },
  });
}

export async function seedApprovedKyc(orgId: string, types: KycDocumentType[]): Promise<void> {
  for (const type of types) {
    await prisma.kycDocument.create({
      data: {
        orgId,
        type,
        status: KycDocumentStatus.APPROVED,
        storageKey: `kyc/${orgId}/${uid()}.pdf`,
        fileName: `${type}.pdf`,
        mimeType: "application/pdf",
        sizeBytes: 1024,
        checksum: uid().padEnd(64, "0"),
      },
    });
  }
}

/** Minimal valid PDF, used to exercise the real upload path. */
export function fakePdf(): Buffer {
  return Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n", "utf8");
}

export function fakePng(): Buffer {
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.alloc(64, 1),
  ]);
}
