import { Injectable } from "@nestjs/common";
import { PaymentProviderKind } from "@prisma/client";
import { koboToNairaString } from "../common/money";
import {
  InitiatePaymentParams,
  InitiatePaymentResult,
  PaymentProvider,
  PayoutParams,
  PayoutResult,
  VerifyPaymentResult,
} from "./provider.interface";

/**
 * Manual bank transfer.
 *
 * The buyer transfers to the escrow account using a unique narration; an
 * operator matches the credit against the payment and confirms it. This is
 * how a great deal of Nigerian B2B trade already settles, it needs no
 * third-party integration, and it is legally straightforward.
 *
 * It is a real provider, not a placeholder: confirmation is an explicit,
 * audited, admin-only action, and the ledger entries it produces are
 * identical to those a bank API would produce.
 */
@Injectable()
export class ManualTransferProvider implements PaymentProvider {
  readonly kind = PaymentProviderKind.MANUAL_BANK_TRANSFER;

  /** How long a set of transfer instructions stands. */
  private static readonly VALIDITY_HOURS = 48;

  isConfigured(): boolean {
    // Escrow account details are configuration, not secrets.
    return Boolean(this.accountNumber && this.bankName && this.accountName);
  }

  private get bankName(): string {
    return process.env.ESCROW_BANK_NAME ?? "";
  }

  private get accountName(): string {
    return process.env.ESCROW_ACCOUNT_NAME ?? "";
  }

  private get accountNumber(): string {
    return process.env.ESCROW_ACCOUNT_NUMBER ?? "";
  }

  async initiate(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    const expiresAt = new Date(Date.now() + ManualTransferProvider.VALIDITY_HOURS * 3600_000);
    const amount = koboToNairaString(params.amountKobo);

    return {
      providerRef: null,
      requiresConfirmation: true,
      instructions: {
        summary:
          `Transfer ₦${amount} to the FuelLink escrow account using the narration ` +
          `${params.reference}. Funds are held by the bank and released to the supplier ` +
          `only after you confirm delivery.`,
        fields: [
          { label: "Bank", value: this.bankName, copyable: false },
          { label: "Account name", value: this.accountName, copyable: true },
          { label: "Account number", value: this.accountNumber, copyable: true },
          { label: "Amount", value: `₦${amount}`, copyable: true },
          // The narration is how the operator matches the credit to the order.
          { label: "Narration (must match exactly)", value: params.reference, copyable: true },
        ],
        expiresAt,
      },
    };
  }

  /**
   * There is no API to poll: a human confirms the credit. The payment stays
   * PENDING until an operator records it, so this never invents a result.
   */
  async verify(_paymentId: string, _providerRef: string | null): Promise<VerifyPaymentResult> {
    return { status: "PENDING", failureReason: null };
  }

  /**
   * Payouts are executed by an operator in the bank's own portal; this
   * records the intent and leaves the payout awaiting that action.
   */
  async payout(_params: PayoutParams): Promise<PayoutResult> {
    return { status: "PENDING", providerRef: null };
  }
}
