import { Controller, Get } from "@nestjs/common";
import { Public } from "../auth/decorators";
import { PrismaService } from "../prisma/prisma.service";

interface HealthResponse {
  status: "ok" | "degraded";
  db: "up" | "down";
  uptimeSec: number;
  version: string;
  timestamp: string;
}

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /** Liveness + dependency probe. Used by the platform health check. */
  @Public()
  @Get()
  async health(): Promise<HealthResponse> {
    let db: "up" | "down" = "up";
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      db = "down";
    }
    return {
      status: db === "up" ? "ok" : "degraded",
      db,
      uptimeSec: Math.round(process.uptime()),
      version: process.env.npm_package_version ?? "0.0.0",
      timestamp: new Date().toISOString(),
    };
  }
}
