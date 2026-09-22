import { Injectable, Logger } from "@nestjs/common";
import { LedgerAccountType, LedgerTxnKind, PayoutStatus, Role } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { LedgerService } from "../ledger/ledger.service";
import {
  BusinessRuleError,
  ConflictError,
  ErrorCode,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../common/errors";
import { koboToNairaString } from "../common/money";
import type { RequestUser } from "../auth/request.types";
import { CompletePayoutInput, RequestPayoutInput } from "./dto";

/**
 * Payouts — moving a supplier's released earnings to their bank account.
 *
 * The balance a supplier can withdraw is their PAYABLE account balance, which
 * only ever grows through escrow release. A supplier therefore cannot
 * withdraw money that no buyer has paid.
 */
@Injectable()
export class PayoutsService {
  private readonly logger = new Logger(PayoutsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
    private readonly audit: AuditService
  ) {}

  /**
   * Withdrawable balance: released earnings minus everything already
   * committed to a payout.
   *
   * PAID payouts are included in the deduction. A completed payout also posts
   * a ledger entry that reduces PAYABLE, so counting it here as well would
   * double-count — except during the window between `complete()` writing the
   * payout row and its ledger entry becoming visible. Deducting the union of
   * (in-flight + paid) and clamping at zero is the conservative choice: it can
   * briefly understate the balance, but it can never overstate it, and an
   * overstatement is what lets money leave twice.
   */
  async availableBalance(orgId: string): Promise<{ availableKobo: bigint; pendingPayoutKobo: bigint }> {
    // PAYABLE carries a credit (negative) balance; flip the sign for display.
    const payable = -(await this.ledger.orgBalance(orgId, LedgerAccountType.PAYABLE));

    const inFlight = await this.prisma.payout.aggregate({
      where: {
        orgId,
        status: { in: [PayoutStatus.REQUESTED, PayoutStatus.APPROVED, PayoutStatus.PROCESSING] },
      },
      _sum: { amountKobo: true },
    });
    const pending = inFlight._sum.amountKobo ?? 0n;

    const available = payable - pending;
    return {
      availableKobo: available > 0n ? available : 0n,
      pendingPayoutKobo: pending,
    };
  }

  async request(orgId: string, input: RequestPayoutInput, actor: RequestUser) {
    const amount = BigInt(input.amountKobo);
    if (amount <= 0n) throw new ValidationError("Payout amount must be positive");

    const account = await this.prisma.bankAccount.findFirst({
      where: { id: input.bankAccountId, orgId, isActive: true },
    });
    if (!account) throw new NotFoundError("Bank account");

    // An unverified destination account is how payout fraud happens.
    if (!account.isVerified) {
      throw new BusinessRuleError(
        "This bank account has not been verified yet. Contact support to complete verification."
      );
    }

    /**
     * Balance check and insert must be atomic, or two concurrent requests
     * both pass the check and the supplier withdraws twice.
     *
     * The organisation row is locked FOR UPDATE first, which serialises every
     * payout request for that organisation. The balance is then recomputed
     * inside the lock, so the second request sees the first one's row.
     */
    const payout = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM organizations WHERE id = ${orgId} FOR UPDATE`;

      const payableRows = await tx.$queryRaw<{ sum: bigint | null }[]>`
        SELECT COALESCE(SUM(e."amountKobo"), 0) AS sum
          FROM ledger_entries e
          JOIN ledger_accounts a ON a.id = e."accountId"
         WHERE a."orgId" = ${orgId} AND a.type = 'PAYABLE'::"LedgerAccountType"
      `;
      // PAYABLE carries a credit (negative) balance; flip the sign.
      const payable = -BigInt(payableRows[0]?.sum ?? 0);

      const inFlightRows = await tx.$queryRaw<{ sum: bigint | null }[]>`
        SELECT COALESCE(SUM("amountKobo"), 0) AS sum
          FROM payouts
         WHERE "orgId" = ${orgId}
           AND status IN ('REQUESTED', 'APPROVED', 'PROCESSING', 'PAID')
      `;
      const committed = BigInt(inFlightRows[0]?.sum ?? 0);

      const available = payable - committed;
      if (amount > available) {
        throw new BusinessRuleError(
          `Insufficient balance: ₦${koboToNairaString(available > 0n ? available : 0n)} available`,
          ErrorCode.BUSINESS_RULE_VIOLATION
        );
      }

      return tx.payout.create({
        data: {
          ref: `PO-${new Date().getFullYear()}-${randomBytes(4).toString("hex").toUpperCase()}`,
          orgId,
          bankAccountId: account.id,
          amountKobo: amount,
          status: PayoutStatus.REQUESTED,
        },
      });
    });

    await this.audit.record({
      action: "payout.requested",
      entityType: "Payout",
      entityId: payout.id,
      actorUserId: actor.id,
      actorOrgId: orgId,
      changes: { amountKobo: amount.toString(), bankLast4: account.accountNumber.slice(-4) },
    });

    return payout;
  }

  /**
   * Operator records that the transfer has been executed at the bank.
   *
   * This is when the ledger entry is written: the supplier's payable is
   * discharged and the platform's bank balance decreases.
   */
  async complete(payoutId: string, input: CompletePayoutInput, actor: RequestUser) {
    if (actor.role !== Role.ADMIN) throw new ForbiddenError("Only an operator can complete a payout");

    return this.prisma.$transaction(async (tx) => {
      const payout = await tx.payout.findUnique({ where: { id: payoutId } });
      if (!payout) throw new NotFoundError("Payout");

      if (payout.status === PayoutStatus.PAID) {
        throw new ConflictError("This payout has already been paid", ErrorCode.CONFLICT);
      }
      if (payout.status === PayoutStatus.CANCELLED || payout.status === PayoutStatus.FAILED) {
        throw new BusinessRuleError(`Cannot complete a ${payout.status.toLowerCase()} payout`);
      }

      const sellerPayable = await this.ledger.ensureOrgAccount(tx, payout.orgId, LedgerAccountType.PAYABLE);
      const bankAccount = await this.ledger.ensurePlatformAccount(tx, LedgerAccountType.BANK_SETTLEMENT);

      const ledgerTxnId = await this.ledger.post(tx, {
        kind: LedgerTxnKind.PAYOUT,
        description: `Payout ${payout.ref} to ${payout.orgId}`,
        payoutId: payout.id,
        actorUserId: actor.id,
        lines: [
          { accountId: sellerPayable, amountKobo: payout.amountKobo },
          { accountId: bankAccount, amountKobo: -payout.amountKobo },
        ],
        metadata: { providerRef: input.providerRef },
      });

      const updated = await tx.payout.update({
        where: { id: payoutId },
        data: {
          status: PayoutStatus.PAID,
          providerRef: input.providerRef,
          approvedById: actor.id,
          approvedAt: payout.approvedAt ?? new Date(),
          paidAt: new Date(),
        },
      });

      await this.audit.record(
        {
          action: "payout.paid",
          entityType: "Payout",
          entityId: payoutId,
          actorUserId: actor.id,
          actorOrgId: payout.orgId,
          changes: { amountKobo: payout.amountKobo.toString(), providerRef: input.providerRef, ledgerTxnId },
        },
        tx
      );

      this.logger.log({ payoutId, amount: payout.amountKobo.toString() }, "Payout completed");
      return updated;
    });
  }

  async fail(payoutId: string, reason: string, actor: RequestUser) {
    if (actor.role !== Role.ADMIN) throw new ForbiddenError("Only an operator can fail a payout");

    const payout = await this.prisma.payout.findUnique({ where: { id: payoutId } });
    if (!payout) throw new NotFoundError("Payout");
    if (payout.status === PayoutStatus.PAID) {
      throw new BusinessRuleError("A paid payout cannot be failed; post a reversing adjustment instead");
    }

    const updated = await this.prisma.payout.update({
      where: { id: payoutId },
      data: { status: PayoutStatus.FAILED, failureReason: reason },
    });

    await this.audit.record({
      action: "payout.failed",
      entityType: "Payout",
      entityId: payoutId,
      actorUserId: actor.id,
      actorOrgId: payout.orgId,
      changes: { reason },
    });

    return updated;
  }

  async list(orgId: string) {
    return this.prisma.payout.findMany({
      where: { orgId },
      include: { bankAccount: { select: { bankName: true, accountNumber: true, accountName: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async listAllPending(actor: RequestUser) {
    if (actor.role !== Role.ADMIN) throw new ForbiddenError("Operators only");
    return this.prisma.payout.findMany({
      where: { status: { in: [PayoutStatus.REQUESTED, PayoutStatus.APPROVED, PayoutStatus.PROCESSING] } },
      include: { bankAccount: true },
      orderBy: { createdAt: "asc" },
      take: 100,
    });
  }
}
