import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async health(): Promise<{ status: "ok" | "degraded"; db: "up" | "down"; uptimeSec: number; timestamp: string }> {
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
      timestamp: new Date().toISOString()
    };
  }
}
