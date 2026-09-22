import { z } from "zod";

export const fundOrderSchema = z.object({
  orderId: z.string().cuid(),
});

export const confirmPaymentSchema = z.object({
  /** Bank's own reference for the credit, recorded for reconciliation. */
  bankReference: z.string().trim().min(3).max(120),
  /**
   * Amount the bank actually credited, in kobo. Compared against what was
   * expected — a mismatch must never be silently accepted.
   */
  receivedAmountKobo: z.string().regex(/^\d+$/, "Amount must be whole kobo"),
  notes: z.string().trim().max(500).optional(),
});

export const rejectPaymentSchema = z.object({
  reason: z.string().trim().min(5, "Explain why this payment is rejected").max(500),
});

export const releaseEscrowSchema = z.object({
  note: z.string().trim().max(500).optional(),
});

export const refundEscrowSchema = z.object({
  /** Partial refunds settle short deliveries; omit to refund in full. */
  amountKobo: z.string().regex(/^\d+$/).optional(),
  reason: z.string().trim().min(5, "Explain the refund").max(500),
});

export const requestPayoutSchema = z.object({
  bankAccountId: z.string().cuid(),
  amountKobo: z.string().regex(/^\d+$/, "Amount must be whole kobo"),
});

export const completePayoutSchema = z.object({
  providerRef: z.string().trim().min(3).max(120),
  notes: z.string().trim().max(500).optional(),
});

export const listStatementSchema = z.object({
  type: z.enum(["ESCROW", "PAYABLE", "FEE_REVENUE", "BANK_SETTLEMENT", "RECEIVABLE"]).optional(),
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

export type FundOrderInput = z.infer<typeof fundOrderSchema>;
export type ConfirmPaymentInput = z.infer<typeof confirmPaymentSchema>;
export type RejectPaymentInput = z.infer<typeof rejectPaymentSchema>;
export type ReleaseEscrowInput = z.infer<typeof releaseEscrowSchema>;
export type RefundEscrowInput = z.infer<typeof refundEscrowSchema>;
export type RequestPayoutInput = z.infer<typeof requestPayoutSchema>;
export type CompletePayoutInput = z.infer<typeof completePayoutSchema>;
export type ListStatementQuery = z.infer<typeof listStatementSchema>;
