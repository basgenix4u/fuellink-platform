import { KycDocumentType, OrgRole, VerificationStatus } from "@prisma/client";
import { z } from "zod";
import { NIGERIAN_STATES } from "../common/constants";
import { nigerianPhone } from "../auth/dto";

export const updateOrganizationSchema = z
  .object({
    name: z.string().trim().min(2).max(160),
    rcNumber: z.string().trim().max(40).nullable(),
    tin: z.string().trim().max(40).nullable(),
    licenseNumber: z.string().trim().max(80).nullable(),
    licenseExpiry: z.coerce.date().nullable(),
    phone: nigerianPhone.nullable(),
    email: z.string().trim().toLowerCase().email().max(254).nullable(),
    addressLine: z.string().trim().max(300).nullable(),
    state: z.enum(NIGERIAN_STATES).nullable(),
    lga: z.string().trim().max(120).nullable(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "Provide at least one field to update");

/**
 * Metadata for a document upload. The file itself arrives as multipart;
 * this validates the descriptive fields that accompany it.
 */
export const uploadKycDocumentSchema = z.object({
  type: z.nativeEnum(KycDocumentType),
  documentNumber: z.string().trim().max(80).optional(),
  expiresAt: z.coerce.date().optional(),
});

export const reviewOrganizationSchema = z
  .object({
    decision: z.enum([
      VerificationStatus.VERIFIED,
      VerificationStatus.REJECTED,
      VerificationStatus.SUSPENDED,
    ]),
    notes: z.string().trim().max(2000).optional(),
  })
  .refine(
    (v) => v.decision === VerificationStatus.VERIFIED || (v.notes && v.notes.length >= 10),
    "A rejection or suspension must explain why (at least 10 characters)"
  );

export const reviewDocumentSchema = z
  .object({
    approve: z.boolean(),
    rejectionReason: z.string().trim().max(500).optional(),
  })
  .refine(
    (v) => v.approve || (v.rejectionReason && v.rejectionReason.length >= 5),
    "A rejected document must have a reason"
  );

export const inviteMemberSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  role: z.nativeEnum(OrgRole),
});

export const updateMemberRoleSchema = z.object({
  role: z.nativeEnum(OrgRole),
});

export const listOrganizationsSchema = z.object({
  status: z.nativeEnum(VerificationStatus).optional(),
  type: z.enum(["DEPOT", "MARKETER", "PLATFORM"]).optional(),
  search: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const addBankAccountSchema = z.object({
  bankName: z.string().trim().min(2).max(120),
  /** CBN bank codes are 3 digits. */
  bankCode: z.string().trim().regex(/^\d{3}$/, "Bank code must be 3 digits"),
  accountNumber: z.string().trim().regex(/^\d{10}$/, "NUBAN account numbers are 10 digits"),
  accountName: z.string().trim().min(2).max(160),
  isPrimary: z.boolean().default(false),
});

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type UploadKycDocumentInput = z.infer<typeof uploadKycDocumentSchema>;
export type ReviewOrganizationInput = z.infer<typeof reviewOrganizationSchema>;
export type ReviewDocumentInput = z.infer<typeof reviewDocumentSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type ListOrganizationsQuery = z.infer<typeof listOrganizationsSchema>;
export type AddBankAccountInput = z.infer<typeof addBankAccountSchema>;
