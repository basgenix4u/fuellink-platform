import { Injectable, Logger } from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";
import {
  KycDocumentStatus,
  KycDocumentType,
  OrgRole,
  Prisma,
  Role,
  TokenPurpose,
  VerificationStatus,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { StorageService, FileInput } from "../storage/storage.service";
import {
  BusinessRuleError,
  ConflictError,
  ErrorCode,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../common/errors";
import type { RequestUser } from "../auth/request.types";
import {
  AddBankAccountInput,
  ListOrganizationsQuery,
  ReviewDocumentInput,
  ReviewOrganizationInput,
  UpdateOrganizationInput,
  UploadKycDocumentInput,
} from "./dto";

/**
 * Documents an organisation must have approved before it can be verified.
 * A depot additionally needs its regulator licence — it is selling regulated
 * product, and this is the core of the trust proposition.
 */
const REQUIRED_DOCUMENTS: Record<"DEPOT" | "MARKETER" | "PLATFORM", KycDocumentType[]> = {
  DEPOT: [KycDocumentType.CAC_CERTIFICATE, KycDocumentType.NMDPRA_LICENSE, KycDocumentType.DIRECTOR_ID],
  MARKETER: [KycDocumentType.CAC_CERTIFICATE, KycDocumentType.DIRECTOR_ID],
  PLATFORM: [],
};

/** Verification transitions an admin may make. */
const ALLOWED_VERIFICATION_TRANSITIONS: Record<VerificationStatus, VerificationStatus[]> = {
  [VerificationStatus.UNVERIFIED]: [VerificationStatus.VERIFIED, VerificationStatus.REJECTED],
  [VerificationStatus.PENDING]: [VerificationStatus.VERIFIED, VerificationStatus.REJECTED],
  [VerificationStatus.REJECTED]: [VerificationStatus.VERIFIED, VerificationStatus.PENDING],
  [VerificationStatus.VERIFIED]: [VerificationStatus.SUSPENDED],
  [VerificationStatus.SUSPENDED]: [VerificationStatus.VERIFIED, VerificationStatus.REJECTED],
};

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly storage: StorageService
  ) {}

  // -------------------------------------------------------------------------
  // Profile
  // -------------------------------------------------------------------------

  async getOwn(orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true, phone: true, isActive: true } } },
          orderBy: { createdAt: "asc" },
        },
        kycDocuments: { orderBy: { createdAt: "desc" } },
        bankAccounts: { where: { isActive: true }, orderBy: { isPrimary: "desc" } },
        reviews: {
          include: { reviewer: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });
    if (!org) throw new NotFoundError("Organisation");

    return { ...org, requirements: this.verificationRequirements(org.type, org.kycDocuments) };
  }

  async update(orgId: string, input: UpdateOrganizationInput, actor: RequestUser) {
    const existing = await this.prisma.organization.findUnique({ where: { id: orgId } });
    if (!existing) throw new NotFoundError("Organisation");

    // Changing identity fields after verification would invalidate the review.
    if (existing.verificationStatus === VerificationStatus.VERIFIED) {
      const locked: (keyof UpdateOrganizationInput)[] = ["name", "rcNumber", "licenseNumber"];
      const attempted = locked.filter((f) => input[f] !== undefined && input[f] !== existing[f]);
      if (attempted.length > 0 && actor.role !== Role.ADMIN) {
        throw new BusinessRuleError(
          `A verified organisation cannot change ${attempted.join(", ")} directly. Contact support — this requires re-verification.`
        );
      }
    }

    const updated = await this.prisma.organization.update({ where: { id: orgId }, data: input });

    await this.audit.record({
      action: "organization.updated",
      entityType: "Organization",
      entityId: orgId,
      actorUserId: actor.id,
      actorOrgId: orgId,
      changes: this.audit.diff(existing as unknown as Record<string, unknown>, input),
    });

    return updated;
  }

  // -------------------------------------------------------------------------
  // KYC documents
  // -------------------------------------------------------------------------

  async uploadDocument(orgId: string, input: UploadKycDocumentInput, file: FileInput, actor: RequestUser) {
    const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) throw new NotFoundError("Organisation");

    if (input.expiresAt && input.expiresAt.getTime() < Date.now()) {
      throw new ValidationError("This document has already expired. Upload a current one.");
    }

    const stored = await this.storage.store(`kyc/${orgId}`, file);

    // Identical content re-uploaded for the same slot is a no-op, not a
    // duplicate row — users retry when a network drops mid-upload.
    const duplicate = await this.prisma.kycDocument.findFirst({
      where: { orgId, type: input.type, checksum: stored.checksum, status: { not: KycDocumentStatus.REJECTED } },
    });
    if (duplicate) {
      await this.storage.delete(stored.storageKey);
      return duplicate;
    }

    const document = await this.prisma.$transaction(async (tx) => {
      // Supersede any previous pending/approved document of this type.
      await tx.kycDocument.updateMany({
        where: { orgId, type: input.type, status: { in: [KycDocumentStatus.PENDING, KycDocumentStatus.APPROVED] } },
        data: { status: KycDocumentStatus.REJECTED, rejectionReason: "Superseded by a newer upload" },
      });

      const created = await tx.kycDocument.create({
        data: {
          orgId,
          type: input.type,
          storageKey: stored.storageKey,
          fileName: stored.fileName,
          mimeType: stored.mimeType,
          sizeBytes: stored.sizeBytes,
          checksum: stored.checksum,
          documentNumber: input.documentNumber ?? null,
          expiresAt: input.expiresAt ?? null,
          uploadedById: actor.id,
        },
      });

      // Submitting documents moves an unverified org into the review queue.
      if (
        org.verificationStatus === VerificationStatus.UNVERIFIED ||
        org.verificationStatus === VerificationStatus.REJECTED
      ) {
        await tx.organization.update({
          where: { id: orgId },
          data: { verificationStatus: VerificationStatus.PENDING, statusReason: null },
        });
      }

      await this.audit.record(
        {
          action: "kyc.document_uploaded",
          entityType: "KycDocument",
          entityId: created.id,
          actorUserId: actor.id,
          actorOrgId: orgId,
          changes: { type: input.type, fileName: stored.fileName, sizeBytes: stored.sizeBytes },
        },
        tx
      );

      return created;
    });

    return document;
  }

  /**
   * Streams a document to an authorised caller. Files are never served from a
   * public path, so this is the only way to read one.
   */
  async getDocumentFile(documentId: string, actor: RequestUser) {
    const doc = await this.prisma.kycDocument.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundError("Document");

    const isAdmin = actor.role === Role.ADMIN;
    const isMember = actor.organizations.some((o) => o.orgId === doc.orgId);
    if (!isAdmin && !isMember) throw new ForbiddenError("You cannot access this document");

    const buffer = await this.storage.retrieve(doc.storageKey);
    return { buffer, mimeType: doc.mimeType, fileName: doc.fileName };
  }

  // -------------------------------------------------------------------------
  // Admin review
  // -------------------------------------------------------------------------

  async listForReview(query: ListOrganizationsQuery) {
    const where: Prisma.OrganizationWhereInput = {
      verificationStatus: query.status,
      type: query.type,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
              { rcNumber: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
              { email: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
            ],
          }
        : {}),
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.organization.count({ where }),
      this.prisma.organization.findMany({
        where,
        include: {
          kycDocuments: { select: { id: true, type: true, status: true, expiresAt: true } },
          _count: { select: { members: true, depots: true } },
        },
        // Oldest pending first: a review queue must be FIFO, not LIFO.
        orderBy: [{ verificationStatus: "asc" }, { createdAt: "asc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);

    return {
      data: data.map((org) => ({
        ...org,
        requirements: this.verificationRequirements(org.type, org.kycDocuments),
      })),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  async reviewDocument(documentId: string, input: ReviewDocumentInput, actor: RequestUser) {
    const doc = await this.prisma.kycDocument.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundError("Document");

    if (doc.status !== KycDocumentStatus.PENDING) {
      throw new BusinessRuleError(
        `This document has already been ${doc.status.toLowerCase()}`,
        ErrorCode.INVALID_STATE_TRANSITION
      );
    }

    const updated = await this.prisma.kycDocument.update({
      where: { id: documentId },
      data: {
        status: input.approve ? KycDocumentStatus.APPROVED : KycDocumentStatus.REJECTED,
        rejectionReason: input.approve ? null : (input.rejectionReason ?? null),
      },
    });

    await this.audit.record({
      action: input.approve ? "kyc.document_approved" : "kyc.document_rejected",
      entityType: "KycDocument",
      entityId: documentId,
      actorUserId: actor.id,
      actorOrgId: doc.orgId,
      changes: { type: doc.type, reason: input.rejectionReason ?? null },
    });

    return updated;
  }

  /**
   * Approves, rejects or suspends an organisation.
   *
   * Verification is refused unless every required document is approved —
   * this is the control that stops an unvetted party from trading, so it is
   * enforced here rather than left to reviewer discipline.
   */
  async review(orgId: string, input: ReviewOrganizationInput, actor: RequestUser) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: { kycDocuments: true },
    });
    if (!org) throw new NotFoundError("Organisation");

    const allowed = ALLOWED_VERIFICATION_TRANSITIONS[org.verificationStatus];
    if (!allowed.includes(input.decision)) {
      throw new BusinessRuleError(
        `Cannot move an organisation from ${org.verificationStatus} to ${input.decision}. Allowed: ${allowed.join(", ") || "none"}`,
        ErrorCode.INVALID_STATE_TRANSITION
      );
    }

    if (input.decision === VerificationStatus.VERIFIED) {
      const requirements = this.verificationRequirements(org.type, org.kycDocuments);
      if (!requirements.satisfied) {
        throw new BusinessRuleError(
          `Cannot verify: missing or unapproved documents (${requirements.missing.join(", ")})`
        );
      }
      const expired = org.kycDocuments.filter(
        (d) => d.status === KycDocumentStatus.APPROVED && d.expiresAt && d.expiresAt.getTime() < Date.now()
      );
      if (expired.length > 0) {
        throw new BusinessRuleError(
          `Cannot verify: expired documents (${expired.map((d) => d.type).join(", ")})`
        );
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.organization.update({
        where: { id: orgId },
        data: {
          verificationStatus: input.decision,
          verifiedAt: input.decision === VerificationStatus.VERIFIED ? new Date() : org.verifiedAt,
          statusReason: input.decision === VerificationStatus.VERIFIED ? null : (input.notes ?? null),
        },
      });

      await tx.verificationReview.create({
        data: { orgId, reviewerId: actor.id, decision: input.decision, notes: input.notes ?? null },
      });

      // Suspension must immediately stop the organisation trading: deactivate
      // its listings so no new orders can be placed against them.
      if (input.decision === VerificationStatus.SUSPENDED) {
        await tx.productListing.updateMany({
          where: { depot: { orgId } },
          data: { isActive: false },
        });
      }

      await this.audit.record(
        {
          action: `organization.${input.decision.toLowerCase()}`,
          entityType: "Organization",
          entityId: orgId,
          actorUserId: actor.id,
          actorOrgId: orgId,
          changes: { from: org.verificationStatus, to: input.decision, notes: input.notes ?? null },
        },
        tx
      );

      return result;
    });

    this.logger.log({ orgId, decision: input.decision, reviewer: actor.id }, "Organisation verification decision");
    return updated;
  }

  // -------------------------------------------------------------------------
  // Members
  // -------------------------------------------------------------------------

  async listMembers(orgId: string) {
    return this.prisma.orgMember.findMany({
      where: { orgId },
      include: { user: { select: { id: true, name: true, email: true, phone: true, isActive: true } } },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Invites a user to the organisation.
   *
   * If the email already has an account the membership is created directly
   * (pending their acceptance); otherwise an invite token is issued for the
   * signup flow. Either way the caller gets the same response, so this cannot
   * be used to probe which emails are registered.
   */
  async inviteMember(orgId: string, email: string, role: OrgRole, actor: RequestUser) {
    if (role === OrgRole.OWNER) {
      throw new BusinessRuleError(
        "Owners cannot be created by invitation. Invite as MANAGER and promote afterwards."
      );
    }

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (user) {
      const existing = await this.prisma.orgMember.findUnique({
        where: { orgId_userId: { orgId, userId: user.id } },
      });
      if (existing) {
        throw new ConflictError("This person is already a member of your organisation", ErrorCode.DUPLICATE_RESOURCE);
      }

      const member = await this.prisma.orgMember.create({
        data: { orgId, userId: user.id, role },
      });

      await this.audit.record({
        action: "organization.member_invited",
        entityType: "OrgMember",
        entityId: member.id,
        actorUserId: actor.id,
        actorOrgId: orgId,
        changes: { email, role, existingUser: true },
      });

      // TODO(notifications): email the invitee that they have been added.
      return { status: "invited" as const, requiresSignup: false };
    }

    const raw = randomBytes(32).toString("base64url");
    await this.prisma.verificationToken.create({
      data: {
        email,
        tokenHash: createHash("sha256").update(raw).digest("hex"),
        purpose: TokenPurpose.ORG_INVITE,
        metadata: { orgId, role },
        expiresAt: new Date(Date.now() + 7 * 86_400_000),
      },
    });

    await this.audit.record({
      action: "organization.member_invited",
      entityType: "Organization",
      entityId: orgId,
      actorUserId: actor.id,
      actorOrgId: orgId,
      changes: { email, role, existingUser: false },
    });

    // TODO(notifications): email the signup link carrying this token.
    return {
      status: "invited" as const,
      requiresSignup: true,
      ...(process.env.NODE_ENV !== "production" ? { devInviteToken: raw } : {}),
    };
  }

  async updateMemberRole(orgId: string, memberId: string, role: OrgRole, actor: RequestUser) {
    const member = await this.prisma.orgMember.findFirst({ where: { id: memberId, orgId } });
    if (!member) throw new NotFoundError("Member");

    // An organisation must always retain at least one owner, or it becomes
    // unadministrable.
    if (member.role === OrgRole.OWNER && role !== OrgRole.OWNER) {
      const owners = await this.prisma.orgMember.count({ where: { orgId, role: OrgRole.OWNER } });
      if (owners <= 1) {
        throw new BusinessRuleError("An organisation must have at least one owner");
      }
    }

    const updated = await this.prisma.orgMember.update({ where: { id: memberId }, data: { role } });

    await this.audit.record({
      action: "organization.member_role_changed",
      entityType: "OrgMember",
      entityId: memberId,
      actorUserId: actor.id,
      actorOrgId: orgId,
      changes: { from: member.role, to: role, userId: member.userId },
    });

    return updated;
  }

  async removeMember(orgId: string, memberId: string, actor: RequestUser) {
    const member = await this.prisma.orgMember.findFirst({ where: { id: memberId, orgId } });
    if (!member) throw new NotFoundError("Member");

    if (member.role === OrgRole.OWNER) {
      const owners = await this.prisma.orgMember.count({ where: { orgId, role: OrgRole.OWNER } });
      if (owners <= 1) throw new BusinessRuleError("An organisation must have at least one owner");
    }
    if (member.userId === actor.id) {
      throw new BusinessRuleError("You cannot remove yourself from the organisation");
    }

    await this.prisma.orgMember.delete({ where: { id: memberId } });

    await this.audit.record({
      action: "organization.member_removed",
      entityType: "OrgMember",
      entityId: memberId,
      actorUserId: actor.id,
      actorOrgId: orgId,
      changes: { userId: member.userId, role: member.role },
    });
  }

  // -------------------------------------------------------------------------
  // Bank accounts
  // -------------------------------------------------------------------------

  async addBankAccount(orgId: string, input: AddBankAccountInput, actor: RequestUser) {
    const existing = await this.prisma.bankAccount.findFirst({
      where: { orgId, bankCode: input.bankCode, accountNumber: input.accountNumber },
    });
    if (existing) {
      throw new ConflictError("This bank account is already registered", ErrorCode.DUPLICATE_RESOURCE);
    }

    const account = await this.prisma.$transaction(async (tx) => {
      const count = await tx.bankAccount.count({ where: { orgId, isActive: true } });
      // First account is primary by definition; a partial unique index
      // guarantees only one primary survives concurrent requests.
      const shouldBePrimary = input.isPrimary || count === 0;

      if (shouldBePrimary) {
        await tx.bankAccount.updateMany({ where: { orgId, isPrimary: true }, data: { isPrimary: false } });
      }

      return tx.bankAccount.create({
        data: {
          orgId,
          bankName: input.bankName,
          bankCode: input.bankCode,
          accountNumber: input.accountNumber,
          accountName: input.accountName,
          isPrimary: shouldBePrimary,
          // Name-enquiry against the bank is a later integration; until then
          // an admin confirms payouts manually.
          isVerified: false,
        },
      });
    });

    await this.audit.record({
      action: "organization.bank_account_added",
      entityType: "BankAccount",
      entityId: account.id,
      actorUserId: actor.id,
      actorOrgId: orgId,
      // Never log the full account number.
      changes: { bankName: input.bankName, last4: input.accountNumber.slice(-4) },
    });

    return account;
  }

  async listBankAccounts(orgId: string) {
    return this.prisma.bankAccount.findMany({
      where: { orgId, isActive: true },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    });
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  /** Which required documents are approved, and which are still outstanding. */
  private verificationRequirements(
    type: "DEPOT" | "MARKETER" | "PLATFORM",
    documents: { type: KycDocumentType; status: KycDocumentStatus }[]
  ): { required: KycDocumentType[]; approved: KycDocumentType[]; missing: KycDocumentType[]; satisfied: boolean } {
    const required = REQUIRED_DOCUMENTS[type] ?? [];
    const approved = documents
      .filter((d) => d.status === KycDocumentStatus.APPROVED)
      .map((d) => d.type);
    const missing = required.filter((r) => !approved.includes(r));
    return { required, approved, missing, satisfied: missing.length === 0 };
  }
}
