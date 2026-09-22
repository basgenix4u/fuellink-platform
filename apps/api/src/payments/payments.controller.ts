import { Body, Controller, Get, Headers, Param, Post, Query, UseGuards } from "@nestjs/common";
import { LedgerAccountType, OrgRole, Role } from "@prisma/client";
import { zodPipe } from "../common/zod-validation.pipe";
import { IdempotencyService } from "../common/idempotency.service";
import { ActiveOrg, CurrentUser, OrgRoles, Roles, RequireVerifiedOrg } from "../auth/decorators";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import type { RequestOrg, RequestUser } from "../auth/request.types";
import { LedgerService } from "../ledger/ledger.service";
import { EscrowService } from "./escrow.service";
import { PayoutsService } from "./payouts.service";
import {
  completePayoutSchema,
  confirmPaymentSchema,
  fundOrderSchema,
  listStatementSchema,
  refundEscrowSchema,
  rejectPaymentSchema,
  releaseEscrowSchema,
  requestPayoutSchema,
} from "./dto";

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(
    private readonly escrow: EscrowService,
    private readonly payouts: PayoutsService,
    private readonly ledger: LedgerService,
    private readonly idempotency: IdempotencyService
  ) {}

  // ---- Buyer: fund an order ----

  @Post("payments/fund")
  @OrgRoles(OrgRole.OWNER, OrgRole.MANAGER, OrgRole.STAFF, OrgRole.FINANCE)
  @RequireVerifiedOrg()
  fund(
    @Body(zodPipe(fundOrderSchema)) body: { orderId: string },
    @CurrentUser() user: RequestUser,
    @Headers("idempotency-key") key: string | undefined
  ) {
    return this.idempotency.execute({
      key,
      userId: user.id,
      endpoint: "POST /payments/fund",
      requestBody: body,
      work: () => this.escrow.initiateFunding(body.orderId, user),
    });
  }

  @Get("payments/:id")
  getPayment(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.escrow.getPayment(id, user);
  }

  // ---- Buyer: release escrow by completing a delivered order ----

  @Post("orders/:id/release-escrow")
  @OrgRoles(OrgRole.OWNER, OrgRole.MANAGER, OrgRole.STAFF)
  release(
    @Param("id") orderId: string,
    @Body(zodPipe(releaseEscrowSchema)) body: { note?: string },
    @CurrentUser() user: RequestUser
  ) {
    return this.escrow.release(orderId, user, body.note);
  }

  // ---- Supplier: balance and payouts ----

  @Get("my/balance")
  @OrgRoles(OrgRole.OWNER, OrgRole.FINANCE, OrgRole.MANAGER)
  async balance(@ActiveOrg() org: RequestOrg) {
    const { availableKobo, pendingPayoutKobo } = await this.payouts.availableBalance(org.orgId);
    const escrowHeld = -(await this.ledger.orgBalance(org.orgId, LedgerAccountType.ESCROW));
    return {
      availableKobo: availableKobo.toString(),
      pendingPayoutKobo: pendingPayoutKobo.toString(),
      // Funds this organisation has placed in escrow as a buyer.
      escrowHeldKobo: escrowHeld.toString(),
    };
  }

  @Get("my/statement")
  @OrgRoles(OrgRole.OWNER, OrgRole.FINANCE, OrgRole.MANAGER)
  statement(
    @ActiveOrg() org: RequestOrg,
    @Query(zodPipe(listStatementSchema)) query: Record<string, unknown>
  ) {
    const q = query as { page: number; pageSize: number; type?: LedgerAccountType };
    return this.ledger.statement(org.orgId, q);
  }

  @Get("my/payouts")
  @OrgRoles(OrgRole.OWNER, OrgRole.FINANCE)
  listPayouts(@ActiveOrg() org: RequestOrg) {
    return this.payouts.list(org.orgId);
  }

  @Post("my/payouts")
  @OrgRoles(OrgRole.OWNER, OrgRole.FINANCE)
  @RequireVerifiedOrg()
  requestPayout(
    @ActiveOrg() org: RequestOrg,
    @Body(zodPipe(requestPayoutSchema)) body: Record<string, unknown>,
    @CurrentUser() user: RequestUser,
    @Headers("idempotency-key") key: string | undefined
  ) {
    return this.idempotency.execute({
      key,
      userId: user.id,
      endpoint: "POST /my/payouts",
      requestBody: body,
      work: () => this.payouts.request(org.orgId, body as never, user),
    });
  }

  // ---- Operator: reconciliation ----

  @Get("admin/payments/pending")
  @Roles(Role.ADMIN)
  pendingPayments(@CurrentUser() user: RequestUser) {
    return this.escrow.listPendingConfirmations(user);
  }

  @Post("admin/payments/:id/confirm")
  @Roles(Role.ADMIN)
  confirmPayment(
    @Param("id") id: string,
    @Body(zodPipe(confirmPaymentSchema)) body: Record<string, unknown>,
    @CurrentUser() user: RequestUser
  ) {
    return this.escrow.confirmPayment(id, body as never, user);
  }

  @Post("admin/payments/:id/reject")
  @Roles(Role.ADMIN)
  rejectPayment(
    @Param("id") id: string,
    @Body(zodPipe(rejectPaymentSchema)) body: { reason: string },
    @CurrentUser() user: RequestUser
  ) {
    return this.escrow.rejectPayment(id, body, user);
  }

  @Post("admin/orders/:id/refund")
  @Roles(Role.ADMIN)
  refund(
    @Param("id") orderId: string,
    @Body(zodPipe(refundEscrowSchema)) body: Record<string, unknown>,
    @CurrentUser() user: RequestUser
  ) {
    return this.escrow.refund(orderId, body as never, user);
  }

  @Get("admin/payouts/pending")
  @Roles(Role.ADMIN)
  pendingPayouts(@CurrentUser() user: RequestUser) {
    return this.payouts.listAllPending(user);
  }

  @Post("admin/payouts/:id/complete")
  @Roles(Role.ADMIN)
  completePayout(
    @Param("id") id: string,
    @Body(zodPipe(completePayoutSchema)) body: Record<string, unknown>,
    @CurrentUser() user: RequestUser
  ) {
    return this.payouts.complete(id, body as never, user);
  }

  /** Whole-ledger integrity probe. Operators only. */
  @Get("admin/ledger/integrity")
  @Roles(Role.ADMIN)
  async integrity() {
    const result = await this.ledger.verifyIntegrity();
    return {
      balanced: result.balanced,
      grandTotalKobo: result.grandTotalKobo.toString(),
      unbalancedTransactions: result.unbalancedTransactions.map((u) => ({
        ...u,
        sumKobo: u.sumKobo.toString(),
      })),
    };
  }
}
