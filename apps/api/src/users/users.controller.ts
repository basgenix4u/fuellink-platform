import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { listUsersSchema, ListUsersQuery, setRoleSchema, SetRoleInput, setStatusSchema, SetStatusInput } from "./dto";
import { UsersService } from "./users.service";

@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @Roles(Role.ADMIN)
  list(@Query(new ZodValidationPipe(listUsersSchema)) query: ListUsersQuery) {
    return this.users.list(query);
  }

  @Get(":id")
  @Roles(Role.ADMIN)
  get(@Param("id") id: string) {
    return this.users.get(id);
  }

  @Patch(":id/role")
  @Roles(Role.ADMIN)
  setRole(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(setRoleSchema)) body: SetRoleInput
  ) {
    return this.users.setRole(id, body);
  }

  @Patch(":id/status")
  @Roles(Role.ADMIN)
  setStatus(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(setStatusSchema)) body: SetStatusInput
  ) {
    return this.users.setStatus(id, body);
  }
}
