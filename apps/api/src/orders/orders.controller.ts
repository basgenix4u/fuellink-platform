import { Body, Controller, Get, Headers, Param, Post, Query, UseGuards } from "@nestjs/common";
import { OrgRole } from "@prisma/client";
import { zodPipe } from "../common/zod-validation.pipe";
import { IdempotencyService } from "../common/idempotency.service";
import { ActiveOrg, CurrentUser, OrgRoles, RequireVerifiedOrg } from "../auth/decorators";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import type { RequestOrg, RequestUser } from "../auth/request.types";
import { OrdersService } from "./orders.service";
import {
  allocateOrderSchema,
  cancelOrderSchema,
  confirmDeliverySchema,
  createOrderSchema,
  dispatchOrderSchema,
  listOrdersSchema,
} from "./dto";

@Controller("orders")
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(
    private readonly orders: OrdersService,
    private readonly idempotency: IdempotencyService
  ) {}

  /**
   * Places an order.
   *
   * Idempotency-Key is honoured here because a retry on a flaky mobile
   * connection must not create a second truck-load of fuel.
   */
  @Post()
  @OrgRoles(OrgRole.OWNER, OrgRole.MANAGER, OrgRole.STAFF)
  @RequireVerifiedOrg()
  create(
    @ActiveOrg() org: RequestOrg,
    @Body(zodPipe(createOrderSchema)) body: Record<string, unknown>,
    @CurrentUser() user: RequestUser,
    @Headers("idempotency-key") idempotencyKey: string | undefined
  ) {
    return this.idempotency.execute({
      key: idempotencyKey,
      userId: user.id,
      endpoint: "POST /orders",
      requestBody: body,
      work: () => this.orders.create(org.orgId, body as never, user),
    });
  }

  @Get()
  list(
    @CurrentUser() user: RequestUser,
    @Query(zodPipe(listOrdersSchema)) query: Record<string, unknown>
  ) {
    return this.orders.list(user, user.activeOrg?.orgId ?? null, query as never);
  }

  @Get(":id")
  get(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.orders.get(id, user);
  }

  @Post(":id/cancel")
  @OrgRoles(OrgRole.OWNER, OrgRole.MANAGER, OrgRole.STAFF)
  cancel(
    @Param("id") id: string,
    @Body(zodPipe(cancelOrderSchema)) body: { reason: string },
    @CurrentUser() user: RequestUser
  ) {
    return this.orders.cancel(id, body, user);
  }

  @Post(":id/allocate")
  @OrgRoles(OrgRole.OWNER, OrgRole.MANAGER, OrgRole.STAFF)
  allocate(
    @Param("id") id: string,
    @Body(zodPipe(allocateOrderSchema)) body: Record<string, unknown>,
    @CurrentUser() user: RequestUser
  ) {
    return this.orders.allocate(id, body as never, user);
  }

  @Post(":id/dispatch")
  @OrgRoles(OrgRole.OWNER, OrgRole.MANAGER, OrgRole.STAFF)
  dispatch(
    @Param("id") id: string,
    @Body(zodPipe(dispatchOrderSchema)) body: Record<string, unknown>,
    @CurrentUser() user: RequestUser
  ) {
    return this.orders.dispatch(id, body as never, user);
  }

  @Post(":id/confirm-delivery")
  @OrgRoles(OrgRole.OWNER, OrgRole.MANAGER, OrgRole.STAFF)
  confirmDelivery(
    @Param("id") id: string,
    @Body(zodPipe(confirmDeliverySchema)) body: Record<string, unknown>,
    @CurrentUser() user: RequestUser
  ) {
    return this.orders.confirmDelivery(id, body as never, user);
  }

  @Post(":id/complete")
  @OrgRoles(OrgRole.OWNER, OrgRole.MANAGER, OrgRole.STAFF)
  complete(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.orders.complete(id, user);
  }
}
