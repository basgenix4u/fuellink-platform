import { PaymentProviderKind } from "@prisma/client";

/**
 * Payment provider abstraction.
 *
 * The exchange must be able to take money today, before any bank API access
 * exists, and must not be rewritten when it arrives. Every provider —
 * manual bank transfer now, Providus/Paystack later — implements this
 * interface, and the rest of the system never learns which one is in use.
 */

export interface InitiatePaymentParams {
  paymentId: string;
  reference: string;
  amountKobo: bigint;
  /** Payer organisation, for provider-side naming/metadata. */
  orgId: string;
  orgName: string;
  purpose: "ESCROW_FUNDING" | "SUBSCRIPTION";
  orderRef?: string | null;
}

/**
 * What the payer must do next. For a manual transfer this is the escrow
 * account plus a unique narration; for a PSP it would be a checkout URL or a
 * dedicated virtual account.
 */
export interface PaymentInstructions {
  /** Human-readable summary the UI can display verbatim. */
  summary: string;
  /** Structured fields for rendering a payment panel. */
  fields: { label: string; value: string; copyable?: boolean }[];
  /** Where to send the payer, if the provider hosts a checkout. */
  redirectUrl?: string;
  /** When these instructions stop being valid. */
  expiresAt: Date;
}

export interface InitiatePaymentResult {
  providerRef: string | null;
  instructions: PaymentInstructions;
  /**
   * True when the provider confirms asynchronously (webhook or human
   * reconciliation) rather than inline.
   */
  requiresConfirmation: boolean;
}

export interface VerifyPaymentResult {
  status: "PENDING" | "SUCCEEDED" | "FAILED";
  /** Amount the provider actually received, when known. */
  paidAmountKobo?: bigint;
  providerRef?: string | null;
  failureReason?: string | null;
  /** Raw provider payload, with secrets stripped, for the attempt log. */
  raw?: Record<string, unknown>;
}

export interface PayoutParams {
  payoutId: string;
  reference: string;
  amountKobo: bigint;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  narration: string;
}

export interface PayoutResult {
  status: "PENDING" | "PROCESSING" | "PAID" | "FAILED";
  providerRef?: string | null;
  failureReason?: string | null;
}

export interface PaymentProvider {
  readonly kind: PaymentProviderKind;

  /** Whether this provider can run with the current configuration. */
  isConfigured(): boolean;

  initiate(params: InitiatePaymentParams): Promise<InitiatePaymentResult>;

  /** Polls the provider for the current state of a payment. */
  verify(paymentId: string, providerRef: string | null): Promise<VerifyPaymentResult>;

  /** Sends money out. Manual providers return PENDING for operator action. */
  payout(params: PayoutParams): Promise<PayoutResult>;
}

export const PAYMENT_PROVIDER_TOKEN = Symbol("PAYMENT_PROVIDER");
