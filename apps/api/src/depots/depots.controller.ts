import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { AuthRequest } from "../auth/request.types";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { CreateDepotInput, createDepotSchema, ListDepotsQuery, listDepotsSchema, UpdateDepotInput, updateDepotSchema } from "./dto";
import { Actor, DepotsService } from "./depots.service";

@Controller("depots")
export class DepotsController {
  constructor(private readonly depots: DepotsService) {}

  private actor(req: AuthRequest): Actor {
    if (!req.user) throw new Error("actor() called without an authenticated user");
    return { id: req.user.id, role: req.user.role };
  }

  // ---- Public ----

  @Get()
  list(@Query(new ZodValidationPipe(listDepotsSchema)) query: ListDepotsQuery) {
    return this.depots.list(query);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.depots.getPublic(id);
  }

  // ---- Authenticated: depot owners + admins ----

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  @Roles(Role.DEPOT, Role.ADMIN)
  create(
    @Req() req: AuthRequest,
    @Body(new ZodValidationPipe(createDepotSchema)) body: CreateDepotInput
  ) {
    return this.depots.create(this.actor(req), body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(":id")
  @Roles(Role.DEPOT, Role.ADMIN)
  update(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateDepotSchema)) body: UpdateDepotInput
  ) {
    return this.depots.update(this.actor(req), id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(":id")
  @Roles(Role.DEPOT, Role.ADMIN)
  deactivate(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.depots.deactivate(this.actor(req), id);
  }
}
