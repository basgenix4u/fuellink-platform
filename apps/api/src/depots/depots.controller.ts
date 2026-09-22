import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { OrgRole } from "@prisma/client";
import { zodPipe } from "../common/zod-validation.pipe";
import { ActiveOrg, CurrentUser, OrgRoles, Public, RequireVerifiedOrg } from "../auth/decorators";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import type { RequestOrg, RequestUser } from "../auth/request.types";
import { DepotsService } from "./depots.service";
import {
  createDepotSchema,
  createListingSchema,
  createTankSchema,
  listDepotsSchema,
  listListingsSchema,
  updateDepotSchema,
  updateListingSchema,
  updateTankLevelSchema,
} from "./dto";

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepotsController {
  constructor(private readonly depots: DepotsService) {}

  // ---- Public marketplace ----

  @Public()
  @Get("depots")
  list(@Query(zodPipe(listDepotsSchema)) query: Record<string, unknown>) {
    return this.depots.listPublic(query as never);
  }

  @Public()
  @Get("listings")
  listListings(@Query(zodPipe(listListingsSchema)) query: Record<string, unknown>) {
    return this.depots.listListings(query as never);
  }

  @Public()
  @Get("listings/:id")
  getListing(@Param("id") id: string) {
    return this.depots.getListing(id);
  }

  // NOTE: declared after the more specific /depots/mine route below would be
  // shadowed by this one, so ordering matters — see the mine() route first.
  @Public()
  @Get("depots/:idOrSlug")
  get(@Param("idOrSlug") idOrSlug: string) {
    return this.depots.getPublic(idOrSlug);
  }

  // ---- Depot management ----

  @Get("my/depots")
  listOwn(@ActiveOrg() org: RequestOrg) {
    return this.depots.listOwn(org.orgId);
  }

  @Post("my/depots")
  @OrgRoles(OrgRole.OWNER, OrgRole.MANAGER)
  @RequireVerifiedOrg()
  create(
    @ActiveOrg() org: RequestOrg,
    @Body(zodPipe(createDepotSchema)) body: Record<string, unknown>,
    @CurrentUser() user: RequestUser
  ) {
    return this.depots.create(org.orgId, body as never, user);
  }

  @Patch("my/depots/:id")
  @OrgRoles(OrgRole.OWNER, OrgRole.MANAGER)
  update(
    @Param("id") id: string,
    @Body(zodPipe(updateDepotSchema)) body: Record<string, unknown>,
    @CurrentUser() user: RequestUser
  ) {
    return this.depots.update(id, body as never, user);
  }

  @Delete("my/depots/:id")
  @OrgRoles(OrgRole.OWNER, OrgRole.MANAGER)
  deactivate(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.depots.deactivate(id, user);
  }

  // ---- Tanks ----

  @Post("my/depots/:id/tanks")
  @OrgRoles(OrgRole.OWNER, OrgRole.MANAGER, OrgRole.STAFF)
  addTank(
    @Param("id") depotId: string,
    @Body(zodPipe(createTankSchema)) body: Record<string, unknown>,
    @CurrentUser() user: RequestUser
  ) {
    return this.depots.addTank(depotId, body as never, user);
  }

  @Patch("my/tanks/:id/level")
  @OrgRoles(OrgRole.OWNER, OrgRole.MANAGER, OrgRole.STAFF)
  updateTankLevel(
    @Param("id") tankId: string,
    @Body(zodPipe(updateTankLevelSchema)) body: Record<string, unknown>,
    @CurrentUser() user: RequestUser
  ) {
    return this.depots.updateTankLevel(tankId, body as never, user);
  }

  // ---- Listings ----

  @Post("my/listings")
  @OrgRoles(OrgRole.OWNER, OrgRole.MANAGER, OrgRole.STAFF)
  @RequireVerifiedOrg()
  createListing(
    @Body(zodPipe(createListingSchema)) body: Record<string, unknown>,
    @CurrentUser() user: RequestUser
  ) {
    return this.depots.createListing(body as never, user);
  }

  @Patch("my/listings/:id")
  @OrgRoles(OrgRole.OWNER, OrgRole.MANAGER, OrgRole.STAFF)
  updateListing(
    @Param("id") id: string,
    @Body(zodPipe(updateListingSchema)) body: Record<string, unknown>,
    @CurrentUser() user: RequestUser
  ) {
    return this.depots.updateListing(id, body as never, user);
  }
}
