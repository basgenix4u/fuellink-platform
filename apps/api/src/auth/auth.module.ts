import { Global, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuditModule } from "../audit/audit.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { PasswordService } from "./password.service";
import { RolesGuard } from "./roles.guard";
import { TokenService } from "./token.service";

/**
 * Global so every feature module can apply @UseGuards(JwtAuthGuard,
 * RolesGuard) without importing auth: Nest resolves guard dependencies from
 * the module context of the consumer.
 */
@Global()
@Module({
  imports: [JwtModule.register({}), AuditModule],
  controllers: [AuthController],
  providers: [AuthService, PasswordService, TokenService, JwtAuthGuard, RolesGuard],
  exports: [AuthService, PasswordService, TokenService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
