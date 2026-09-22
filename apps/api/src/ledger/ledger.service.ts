import { Injectable, Logger } from "@nestjs/common";
import { LedgerAccountType, LedgerTxnKind, Prisma } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import { BusinessRuleError, ValidationError } from "../common/errors";

/**
 * Double-entry ledger.
 *
 * Every movement of money is a transaction containing at least two entries
 * that sum to zero. Debits are positive, credits negative. The database
 * enforces both rules with a deferred constraint trigger, so a bug here
 * fails loudly at COMMIT instead of quietly corrupting the books.
 *
 * Accounts are never mutated: a balance is always the sum of its entries.
 * That makes every figure reconstructible and auditable, which is the point.
 */

export interface PostingLine {
  accountId: string;
  /** Positive = debit, negative = credit. Must not be zero. */
  amountKobo: bigint;
}

export interface PostTransactionInput {
  kind: LedgerTxnKind;
  description: string;
  lines: PostingLine[];
  orderId?: string | null;
  paymentId?: string | null;
  payoutId?: string | null;
  actorUserId?: string | null;
  metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);

  constructor(private readonly prisma: PrismaService) {}

  // -------------------------------------------------------------------------
  // Accounts
  // -------------------------------------------------------------------------

  /**
   * Returns an organisation's account of a given type, creating it on first
   * use. Account codes are deterministic so the chart of accounts is
   * predictable and greppable in production.
   */
  async ensureOrgAccount(
    tx: Prisma.TransactionClient,
    orgId: string,
    type: LedgerAccountType
  ): Promise<string> {
    const code = `${type}:${orgId}`;
    const existing = await tx.ledgerAccount.findUnique({ where: { code }, select: { id: true } });
    if (existing) return existing.id;

    const created = await tx.ledgerAccount.create({ data: { orgId, type, code } });
    return created.id;
  }

  /** Platform-level accounts (escrow float, fee revenue, bank settlement). */
  async ensurePlatformAccount(tx: Prisma.TransactionClient, type: LedgerAccountType): Promise<string> {
    const code = `PLATFORM:${type}`;
    const existing = await tx.ledgerAccount.findUnique({ where: { code }, select: { id: true } });
    if (existing) return existing.id;

    const created = await tx.ledgerAccount.create({ data: { orgId: null, type, code } });
    return created.id;
  }

  // -------------------------------------------------------------------------
  // Posting
  // -------------------------------------------------------------------------

  /**
   * Posts a balanced transaction.
   *
   * Must be called inside an existing transaction: money movements are always
   * part of a larger business operation (funding an order, releasing escrow),
   * and the two must commit or fail together.
   */
  async post(tx: Prisma.TransactionClient, input: PostTransactionInput): Promise<string> {
    if (input.lines.length < 2) {
      throw new ValidationError("A ledger transaction needs at least two entries");
    }

    const total = input.lines.reduce((sum, line) => sum + line.amountKobo, 0n);
    if (total !== 0n) {
      // Caught here with a useful message; the DB trigger is the backstop.
      throw new BusinessRuleError(
        `Ledger transaction does not balance: entries sum to ${total.toString()} kobo`
      );
    }
    if (input.lines.some((l) => l.amountKobo === 0n)) {
      throw new ValidationError("A ledger entry cannot be zero");
    }

    const transaction = await tx.ledgerTransaction.create({
      data: {
        ref: this.generateRef(),
        kind: input.kind,
        description: input.description,
        orderId: input.orderId ?? null,
        paymentId: input.paymentId ?? null,
        payoutId: input.payoutId ?? null,
        actorUserId: input.actorUserId ?? null,
        metadata: input.metadata,
      },
    });

    await tx.ledgerEntry.createMany({
      data: input.lines.map((line) => ({
        transactionId: transaction.id,
        accountId: line.accountId,
        amountKobo: line.amountKobo,
      })),
    });

    return transaction.id;
  }

  // -------------------------------------------------------------------------
  // Balances & reporting
  // -------------------------------------------------------------------------

  /**
   * Balance of an account, as the signed sum of its entries.
   *
   * Positive means the account holds a debit balance (an asset, or money owed
   * to us); negative means a credit balance (a liability, or money we owe).
   */
  async balance(accountId: string, client: Prisma.TransactionClient | PrismaService = this.prisma): Promise<bigint> {
    const result = await client.ledgerEntry.aggregate({
      where: { accountId },
      _sum: { amountKobo: true },
    });
    return result._sum.amountKobo ?? 0n;
  }

  /** Balance of an organisation's account of a given type (0 if none yet). */
  async orgBalance(orgId: string, type: LedgerAccountType): Promise<bigint> {
    const account = await this.prisma.ledgerAccount.findUnique({
      where: { code: `${type}:${orgId}` },
      select: { id: true },
    });
    if (!account) return 0n;
    return this.balance(account.id);
  }

  /**
   * Statement for an organisation: every entry across its accounts, newest
   * first, with a running description of what caused each movement.
   */
  async statement(
    orgId: string,
    options: { page: number; pageSize: number; type?: LedgerAccountType }
  ) {
    const where: Prisma.LedgerEntryWhereInput = {
      account: { orgId, ...(options.type ? { type: options.type } : {}) },
    };

    const [total, entries] = await this.prisma.$transaction([
      this.prisma.ledgerEntry.count({ where }),
      this.prisma.ledgerEntry.findMany({
        where,
        include: {
          account: { select: { code: true, type: true } },
          transaction: {
            select: { ref: true, kind: true, description: true, orderId: true, createdAt: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (options.page - 1) * options.pageSize,
        take: options.pageSize,
      }),
    ]);

    return {
      data: entries,
      page: options.page,
      pageSize: options.pageSize,
      total,
      totalPages: Math.ceil(total / options.pageSize),
    };
  }

  /**
   * Whole-ledger integrity check.
   *
   * Two invariants must always hold:
   *  1. every transaction sums to zero;
   *  2. the sum of *all* entries is zero.
   *
   * Run by the reconciliation job and asserted in tests. A non-empty result
   * means money has been created or destroyed, which is a stop-the-world bug.
   */
  async verifyIntegrity(): Promise<{
    balanced: boolean;
    grandTotalKobo: bigint;
    unbalancedTransactions: { transactionId: string; ref: string; sumKobo: bigint }[];
  }> {
    const unbalanced = await this.prisma.$queryRaw<
      { transactionId: string; ref: string; sum: bigint }[]
    >`
      SELECT e."transactionId" AS "transactionId",
             t.ref             AS ref,
             SUM(e."amountKobo") AS sum
        FROM ledger_entries e
        JOIN ledger_transactions t ON t.id = e."transactionId"
    GROUP BY e."transactionId", t.ref
      HAVING SUM(e."amountKobo") <> 0
    `;

    const grand = await this.prisma.ledgerEntry.aggregate({ _sum: { amountKobo: true } });
    const grandTotal = grand._sum.amountKobo ?? 0n;

    if (unbalanced.length > 0 || grandTotal !== 0n) {
      this.logger.error(
        { unbalancedCount: unbalanced.length, grandTotal: grandTotal.toString() },
        "LEDGER INTEGRITY FAILURE"
      );
    }

    return {
      balanced: unbalanced.length === 0 && grandTotal === 0n,
      grandTotalKobo: grandTotal,
      unbalancedTransactions: unbalanced.map((u) => ({
        transactionId: u.transactionId,
        ref: u.ref,
        sumKobo: BigInt(u.sum),
      })),
    };
  }

  private generateRef(): string {
    return `LT-${new Date().getFullYear()}-${randomBytes(5).toString("hex").toUpperCase()}`;
  }
}
