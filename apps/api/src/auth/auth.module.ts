import { Global, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import type { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { RolesGuard } from "./roles.guard";

/**
 * Global so every module can use @UseGuards(JwtAuthGuard, RolesGuard):
 * Nest resolves guard classes (and their JwtService dependency) from the
 * module context, and JwtService only exists where JwtModule is registered.
 */
@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: env.JWT_SECRET,
      // env values are free-form strings; ms-compatible values (12h, 2d…) are documented in .env.example
      signOptions: { expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"] }
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, RolesGuard],
  exports: [AuthService, JwtAuthGuard, RolesGuard, JwtModule]
})
export class AuthModule {}
