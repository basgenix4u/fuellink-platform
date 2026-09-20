import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { env } from "./config/env";
import { BigIntSerializerInterceptor } from "./common/bigint-serializer.interceptor";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: ["log", "warn", "error"]
  });

  // All routes are namespaced: /api/v1/health, /api/v1/auth/login, ...
  app.setGlobalPrefix("api/v1");

  app.enableCors({
    origin: env.CORS_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean),
    credentials: true
  });

  // Prisma BigInt (kobo amounts) would crash JSON.stringify — serialize to strings.
  app.useGlobalInterceptors(new BigIntSerializerInterceptor());

  await app.listen(env.PORT);
}

void bootstrap();
