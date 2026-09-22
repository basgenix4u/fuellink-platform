import { Injectable, Logger } from "@nestjs/common";
import {
  LedgerAccountType,
  LedgerTxnKind,
  OrderStatus,
  PaymentPurpose,
  PaymentStatus,
  Prisma,
  Role,
} from "@prisma/client";
import { randomBytes } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { LedgerService } from "../ledger/ledger.service";
import { ManualTransferProvider } from "./manual-transfer.provider";
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
import { ConfirmPaymentInput, RefundEscrowInput, RejectPaymentInput } from "./dto";

/**
 * Bank-held escrow.
 *
 * Money flow, expressed as double-entry postings:
 *
 *   FUND     buyer pays into the escrow account
 *            DR platform bank settlement   (asset increases)
 *            CR buyer escrow               (liability to the buyer)
 *
 *   RELEASE  buyer confirms delivery
 *            DR buyer escrow               (liability discharged)
 *            CR seller payable             (now owed to the supplier)
 *            CR platform fee revenue       (commission earned)
 *
 *   REFUND   order unwound
 *            DR buyer escrow
 *            CR platform bank settlement
 *
 *   PAYOUT   supplier withdraws
 *            DR seller payable
 *            CR platform bank settlement
 *
 * FuelLink never takes ownership of the buyer's funds: the escrow balance is
 * a liability, and the invariant that matters is that a seller can never be
 * paid more than was actually funded for that order.
 */
@Injectable()
export class EscrowService {
  private readonly logger = new Logger(EscrowService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
    private readonly audit: AuditService,
    private readonly provider: ManualTransferProvider
  ) {}

  // -------------------------------------------------------------------------
  // Funding
  // -------------------------------------------------------------------------

  /**
   * Starts funding for an order and returns payment instructions.
   *
   * Idempotent by design: an order with a live pending payment returns the
   * same payment rather than creating a second one, so a buyer refreshing
   * the page never ends up with two transfers to make.
   */
  async initiateFunding(orderId: string, actor: RequestUser) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { buyerOrg: { select: { id: true, name: true } } },
    });
    if (!order) throw new NotFoundError("Order");

    if (!actor.organizations.some((o) => o.orgId === order.buyerOrgId) && actor.role !== Role.ADMIN) {
      throw new ForbiddenError("Only the buyer can fund this order");
    }
    if (order.status !== OrderStatus.AWAITING_PAYMENT) {
      throw new BusinessRuleError(
        `This order is ${order.status} and cannot be funded`,
        ErrorCode.INVALID_STATE_TRANSITION
      );
    }

    const existing = await this.prisma.payment.findFirst({
      where: {
        orderId,
        status: { in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING] },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
    if (existing) {
      return { payment: existing, instructions: existing.instructions, reused: true };
    }

    if (!this.provider.isConfigured()) {
      // Refuse rather than hand the buyer half-complete transfer details.
      throw new BusinessRuleError(
        "Payments are not currently configured. Contact support.",
        ErrorCode.SERVICE_UNAVAILABLE
      );
    }

    const reference = this.generatePaymentRef(order.ref);
    const result = await this.provider.initiate({
      paymentId: reference,
      reference,
      amountKobo: order.totalKobo,
      orgId: order.buyerOrgId,
      orgName: order.buyerOrg.name,
      purpose: "ESCROW_FUNDING",
      orderRef: order.ref,
    });

    const payment = await this.prisma.payment.create({
      data: {
        ref: reference,
        orgId: order.buyerOrgId,
        orderId: order.id,
        purpose: PaymentPurpose.ESCROW_FUNDING,
        provider: this.provider.kind,
        amountKobo: order.totalKobo,
        status: PaymentStatus.PENDING,
        providerRef: result.providerRef,
        instructions: result.instructions as unknown as Prisma.InputJsonValue,
        expiresAt: result.instructions.expiresAt,
      },
    });

    await this.audit.record({
      action: "payment.initiated",
      entityType: "Payment",
      entityId: payment.id,
      actorUserId: actor.id,
      actorOrgId: order.buyerOrgId,
      changes: { orderRef: order.ref, amountKobo: order.totalKobo.toString(), provider: this.provider.kind },
    });

    return { payment, instructions: result.instructions, reused: false };
  }

  /**
   * Operator confirms a bank credit.
   *
   * This is the moment money becomes real in the system, so it is the most
   * carefully guarded action in the codebase:
   *  - admin only;
   *  - the received amount must match what was expected (no silent shortfalls);
   *  - the bank reference must be globally unique (the same credit cannot be
   *    applied to two orders);
   *  - ledger posting and order transition happen in one transaction.
   */
  async confirmPayment(paymentId: string, input: ConfirmPaymentInput, actor: RequestUser) {
    if (actor.role !== Role.ADMIN) {
      throw new ForbiddenError("Only an operator can confirm a bank credit");
    }

    const received = BigInt(input.receivedAmountKobo);
    if (received <= 0n) throw new ValidationError("Received amount must be positive");

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: { order: true },
      });
      if (!payment) throw new NotFoundError("Payment");

      if (payment.status === PaymentStatus.SUCCEEDED) {
        throw new ConflictError("This payment has already been confirmed", ErrorCode.CONFLICT);
      }
      if (payment.status !== PaymentStatus.PENDING && payment.status !== PaymentStatus.PROCESSING) {
        throw new BusinessRuleError(
          `Cannot confirm a payment in status ${payment.status}`,
          ErrorCode.INVALID_STATE_TRANSITION
        );
      }

      // The same bank credit must never fund two payments.
      const duplicate = await tx.payment.findFirst({
        where: { providerRef: input.bankReference, status: PaymentStatus.SUCCEEDED, id: { not: paymentId } },
        select: { id: true, ref: true },
      });
      if (duplicate) {
        throw new ConflictError(
          `Bank reference ${input.bankReference} has already been applied to payment ${duplicate.ref}`,
          ErrorCode.DUPLICATE_RESOURCE
        );
      }

      // Underpayment must not fund the order; overpayment needs a human decision.
      if (received !== payment.amountKobo) {
        throw new BusinessRuleError(
          `Amount mismatch: expected ₦${koboToNairaString(payment.amountKobo)}, ` +
            `received ₦${koboToNairaString(received)}. Resolve with the payer before confirming.`
        );
      }

      // --- Ledger: money enters the platform's bank, held for the buyer ---
      const bankAccount = await this.ledger.ensurePlatformAccount(tx, LedgerAccountType.BANK_SETTLEMENT);
      const buyerEscrow = await this.ledger.ensureOrgAccount(tx, payment.orgId, LedgerAccountType.ESCROW);

      const ledgerTxnId = await this.ledger.post(tx, {
        kind: LedgerTxnKind.ESCROW_FUND,
        description: `Escrow funded for ${payment.order?.ref ?? payment.ref}`,
        orderId: payment.orderId,
        paymentId: payment.id,
        actorUserId: actor.id,
        lines: [
          { accountId: bankAccount, amountKobo: received },
          { accountId: buyerEscrow, amountKobo: -received },
        ],
        metadata: { bankReference: input.bankReference },
      });

      const updated = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.SUCCEEDED,
          providerRef: input.bankReference,
          confirmedById: actor.id,
          confirmedAt: new Date(),
        },
      });

      await tx.paymentAttempt.create({
        data: {
          paymentId,
          status: PaymentStatus.SUCCEEDED,
          providerPayload: {
            bankReference: input.bankReference,
            receivedAmountKobo: received.toString(),
            notes: input.notes ?? null,
          },
        },
      });

      // --- Move the order forward, under its optimistic lock ---
      if (payment.order && payment.order.status === OrderStatus.AWAITING_PAYMENT) {
        const moved = await tx.order.updateMany({
          where: { id: payment.orderId as string, version: payment.order.version },
          data: { status: OrderStatus.ESCROW_FUNDED, version: { increment: 1 } },
        });
        if (moved.count === 0) throw new ConflictError("The order changed while confirming payment");

        await tx.orderEvent.create({
          data: {
            orderId: payment.orderId as string,
            fromStatus: OrderStatus.AWAITING_PAYMENT,
            toStatus: OrderStatus.ESCROW_FUNDED,
            note: `Escrow funded (bank ref ${input.bankReference})`,
            actorUserId: actor.id,
            metadata: { ledgerTxnId },
          },
        });
      }

      await this.audit.record(
        {
          action: "payment.confirmed",
          entityType: "Payment",
          entityId: paymentId,
          actorUserId: actor.id,
          actorOrgId: payment.orgId,
          changes: {
            bankReference: input.bankReference,
            amountKobo: received.toString(),
            ledgerTxnId,
          },
        },
        tx
      );

      this.logger.log(
        { paymentId, orderId: payment.orderId, amountKobo: received.toString() },
        "Escrow funded"
      );

      return updated;
    });
  }

  async rejectPayment(paymentId: string, input: RejectPaymentInput, actor: RequestUser) {
    if (actor.role !== Role.ADMIN) throw new ForbiddenError("Only an operator can reject a payment");

    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundError("Payment");
    if (payment.status === PaymentStatus.SUCCEEDED) {
      throw new BusinessRuleError("A confirmed payment cannot be rejected; issue a refund instead");
    }

    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.FAILED, failureReason: input.reason },
    });

    await this.audit.record({
      action: "payment.rejected",
      entityType: "Payment",
      entityId: paymentId,
      actorUserId: actor.id,
      actorOrgId: payment.orgId,
      changes: { reason: input.reason },
    });

    return updated;
  }

  // -------------------------------------------------------------------------
  // Release
  // -------------------------------------------------------------------------

  /**
   * Releases escrow to the seller and books the platform fee.
   *
   * Called when a buyer completes a delivered order, or by the auto-release
   * job. Refuses to release more than was actually funded for the order —
   * the invariant that protects the platform's float.
   */
  async release(orderId: string, actor: RequestUser | null, note?: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { delivery: true, dispute: true },
      });
      if (!order) throw new NotFoundError("Order");

      if (order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.COMPLETED) {
        throw new BusinessRuleError(
          `Escrow can only be released for a delivered order (this one is ${order.status})`,
          ErrorCode.INVALID_STATE_TRANSITION
        );
      }
      if (order.dispute && order.dispute.status !== "RESOLVED" && order.dispute.status !== "CLOSED") {
        throw new BusinessRuleError("Escrow is frozen while a dispute is open on this order");
      }
      if (order.delivery?.varianceFlagged && actor?.role !== Role.ADMIN) {
        throw new BusinessRuleError(
          "This delivery is outside the agreed tolerance; an operator must settle it"
        );
      }

      // Guard against a double release.
      const alreadyReleased = await tx.ledgerTransaction.findFirst({
        where: { orderId, kind: LedgerTxnKind.ESCROW_RELEASE },
        select: { id: true },
      });
      if (alreadyReleased) {
        throw new ConflictError("Escrow has already been released for this order", ErrorCode.CONFLICT);
      }

      // Only release what was genuinely funded.
      const funded = await tx.payment.aggregate({
        where: { orderId, status: PaymentStatus.SUCCEEDED, purpose: PaymentPurpose.ESCROW_FUNDING },
        _sum: { amountKobo: true },
      });
      const fundedKobo = funded._sum.amountKobo ?? 0n;
      if (fundedKobo === 0n) {
        throw new BusinessRuleError("No confirmed funding exists for this order");
      }
      if (fundedKobo < order.totalKobo) {
        throw new BusinessRuleError(
          `Only ₦${koboToNairaString(fundedKobo)} of ₦${koboToNairaString(order.totalKobo)} has been funded`
        );
      }

      const sellerAmount = order.subtotalKobo;
      const feeAmount = order.feeKobo;
      if (sellerAmount + feeAmount !== fundedKobo) {
        // Arithmetic must reconcile exactly or nothing moves.
        throw new BusinessRuleError(
          `Release does not reconcile: funded ${fundedKobo.toString()} kobo, ` +
            `seller ${sellerAmount.toString()} + fee ${feeAmount.toString()}`
        );
      }

      const buyerEscrow = await this.ledger.ensureOrgAccount(tx, order.buyerOrgId, LedgerAccountType.ESCROW);
      const sellerPayable = await this.ledger.ensureOrgAccount(tx, order.sellerOrgId, LedgerAccountType.PAYABLE);
      const feeRevenue = await this.ledger.ensurePlatformAccount(tx, LedgerAccountType.FEE_REVENUE);

      const lines = [
        { accountId: buyerEscrow, amountKobo: fundedKobo },
        { accountId: sellerPayable, amountKobo: -sellerAmount },
      ];
      // A zero fee must not create a zero-amount entry.
      if (feeAmount > 0n) lines.push({ accountId: feeRevenue, amountKobo: -feeAmount });

      const ledgerTxnId = await this.ledger.post(tx, {
        kind: LedgerTxnKind.ESCROW_RELEASE,
        description: `Escrow released for ${order.ref}`,
        orderId: order.id,
        actorUserId: actor?.id ?? null,
        lines,
        metadata: { note: note ?? null, autoReleased: actor === null },
      });

      if (order.status !== OrderStatus.COMPLETED) {
        const moved = await tx.order.updateMany({
          where: { id: orderId, version: order.version },
          data: {
            status: OrderStatus.COMPLETED,
            completedAt: new Date(),
            autoCompleteAt: null,
            version: { increment: 1 },
          },
        });
        if (moved.count === 0) throw new ConflictError("The order changed during release");

        await tx.orderEvent.create({
          data: {
            orderId,
            fromStatus: order.status,
            toStatus: OrderStatus.COMPLETED,
            note: note ?? (actor ? "Escrow released" : "Auto-released after the confirmation window"),
            actorUserId: actor?.id ?? null,
            metadata: { ledgerTxnId },
          },
        });
      }

      await this.audit.record(
        {
          action: "escrow.released",
          entityType: "Order",
          entityId: orderId,
          actorUserId: actor?.id ?? null,
          changes: {
            sellerAmountKobo: sellerAmount.toString(),
            feeKobo: feeAmount.toString(),
            ledgerTxnId,
            automatic: actor === null,
          },
        },
        tx
      );

      this.logger.log(
        { orderId, sellerAmount: sellerAmount.toString(), fee: feeAmount.toString() },
        "Escrow released"
      );

      return tx.order.findUniqueOrThrow({ where: { id: orderId } });
    });
  }

  /**
   * Refunds escrow to the buyer, in full or in part.
   *
   * Partial refunds settle short deliveries: the buyer is made whole for the
   * missing volume and the seller is paid for what actually arrived.
   */
  async refund(orderId: string, input: RefundEscrowInput, actor: RequestUser) {
    if (actor.role !== Role.ADMIN) {
      throw new ForbiddenError("Only an operator can refund escrow");
    }

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw new NotFoundError("Order");

      const funded = await tx.payment.aggregate({
        where: { orderId, status: PaymentStatus.SUCCEEDED, purpose: PaymentPurpose.ESCROW_FUNDING },
        _sum: { amountKobo: true },
      });
      const fundedKobo = funded._sum.amountKobo ?? 0n;
      if (fundedKobo === 0n) throw new BusinessRuleError("Nothing has been funded for this order");

      const alreadyRefunded = await tx.ledgerTransaction.aggregate({
        where: { orderId, kind: LedgerTxnKind.ESCROW_REFUND },
        _count: true,
      });

      const released = await tx.ledgerTransaction.findFirst({
        where: { orderId, kind: LedgerTxnKind.ESCROW_RELEASE },
        select: { id: true },
      });
      if (released) {
        throw new BusinessRuleError(
          "Escrow has already been released to the seller; a refund now requires a reversing adjustment"
        );
      }

      const amount = input.amountKobo ? BigInt(input.amountKobo) : fundedKobo;
      if (amount <= 0n) throw new ValidationError("Refund amount must be positive");
      if (amount > fundedKobo) {
        throw new BusinessRuleError(
          `Cannot refund ₦${koboToNairaString(amount)}; only ₦${koboToNairaString(fundedKobo)} was funded`
        );
      }
      if (alreadyRefunded._count > 0) {
        throw new ConflictError("This order has already been refunded", ErrorCode.CONFLICT);
      }

      const buyerEscrow = await this.ledger.ensureOrgAccount(tx, order.buyerOrgId, LedgerAccountType.ESCROW);
      const bankAccount = await this.ledger.ensurePlatformAccount(tx, LedgerAccountType.BANK_SETTLEMENT);

      const ledgerTxnId = await this.ledger.post(tx, {
        kind: LedgerTxnKind.ESCROW_REFUND,
        description: `Escrow refunded for ${order.ref}: ${input.reason}`,
        orderId,
        actorUserId: actor.id,
        lines: [
          { accountId: buyerEscrow, amountKobo: amount },
          { accountId: bankAccount, amountKobo: -amount },
        ],
        metadata: { reason: input.reason, partial: amount < fundedKobo },
      });

      // A full refund terminates the order; a partial one settles it.
      const partial = amount < fundedKobo;
      const nextStatus = partial ? OrderStatus.COMPLETED : OrderStatus.REFUNDED;

      const moved = await tx.order.updateMany({
        where: { id: orderId, version: order.version },
        data: {
          status: nextStatus,
          version: { increment: 1 },
          ...(partial ? { completedAt: new Date() } : { cancelReason: input.reason }),
          autoCompleteAt: null,
        },
      });
      if (moved.count === 0) throw new ConflictError("The order changed during the refund");

      await tx.orderEvent.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: nextStatus,
          note: `Refund of ₦${koboToNairaString(amount)}: ${input.reason}`,
          actorUserId: actor.id,
          metadata: { ledgerTxnId, amountKobo: amount.toString() },
        },
      });

      await this.audit.record(
        {
          action: "escrow.refunded",
          entityType: "Order",
          entityId: orderId,
          actorUserId: actor.id,
          changes: { amountKobo: amount.toString(), reason: input.reason, ledgerTxnId },
        },
        tx
      );

      return tx.order.findUniqueOrThrow({ where: { id: orderId } });
    });
  }

  // -------------------------------------------------------------------------
  // Reads
  // -------------------------------------------------------------------------

  async getPayment(paymentId: string, actor: RequestUser) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { attempts: { orderBy: { createdAt: "desc" }, take: 20 } },
    });
    if (!payment) throw new NotFoundError("Payment");

    const isParty = actor.organizations.some((o) => o.orgId === payment.orgId);
    if (!isParty && actor.role !== Role.ADMIN) throw new NotFoundError("Payment");

    return payment;
  }

  async listPendingConfirmations(actor: RequestUser) {
    if (actor.role !== Role.ADMIN) throw new ForbiddenError("Operators only");

    return this.prisma.payment.findMany({
      where: { status: { in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING] } },
      include: {
        org: { select: { id: true, name: true } },
        order: { select: { id: true, ref: true, totalKobo: true, status: true } },
      },
      // Oldest first: a buyer waiting on confirmation cannot trade.
      orderBy: { createdAt: "asc" },
      take: 100,
    });
  }

  private generatePaymentRef(orderRef: string): string {
    // Short, human-transcribable narration derived from the order.
    const suffix = randomBytes(2).toString("hex").toUpperCase();
    return `${orderRef}-${suffix}`;
  }
}
