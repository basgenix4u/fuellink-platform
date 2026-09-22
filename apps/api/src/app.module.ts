import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AuditModule } from "./audit/audit.module";
import { AuthModule } from "./auth/auth.module";
import { CommonModule } from "./common/common.module";
import { HealthController } from "./health/health.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { env } from "./config/env";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // Baseline abuse protection: 100 requests/minute/IP. Sensitive routes
    // tighten this with @Throttle.
    ThrottlerModule.forRoot([{ name: "default", ttl: 60_000, limit: 100 * env.RATE_LIMIT_FACTOR }]),

    PrismaModule,
    CommonModule,
    AuditModule,
    AuthModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
