import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AuthRequest } from "../auth/request.types";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { Actor } from "../depots/depots.service";
import { CreateEscrowInput, createEscrowSchema, ListEscrowQuery, listEscrowSchema, TransitionEscrowInput, transitionEscrowSchema } from "./dto";
import { EscrowService } from "./escrow.service";

@Controller("escrow")
@UseGuards(JwtAuthGuard)
export class EscrowController {
  constructor(private readonly escrow: EscrowService) {}

  @Post()
  create(
    @Req() req: AuthRequest,
    @Body(new ZodValidationPipe(createEscrowSchema)) body: CreateEscrowInput
  ) {
    return this.escrow.create(this.actor(req), body);
  }

  @Get()
  list(
    @Req() req: AuthRequest,
    @Query(new ZodValidationPipe(listEscrowSchema)) query: ListEscrowQuery
  ) {
    return this.escrow.list(this.actor(req), query);
  }

  @Get(":id")
  get(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.escrow.get(this.actor(req), id);
  }

  @Patch(":id")
  transition(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(transitionEscrowSchema)) body: TransitionEscrowInput
  ) {
    return this.escrow.transition(this.actor(req), id, body);
  }

  private actor(req: AuthRequest): Actor {
    if (!req.user) throw new Error("actor() called without an authenticated user");
    return { id: req.user.id, role: req.user.role };
  }
}
