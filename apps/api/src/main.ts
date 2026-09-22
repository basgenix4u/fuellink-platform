import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { AppModule } from "./app.module";
import { corsOrigins, env } from "./config/env";
import { AllExceptionsFilter } from "./common/all-exceptions.filter";
import { SerializationInterceptor } from "./common/serialization.interceptor";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: env.NODE_ENV === "production" ? ["log", "warn", "error"] : ["log", "warn", "error", "debug"],
    // We terminate JSON parsing ourselves so we can bound the body size.
    bodyParser: true,
  });

  const logger = new Logger("Bootstrap");

  // Trust the proxy so req.ip is the real client address behind Railway/Vercel.
  app.set("trust proxy", 1);

  // Correlation id on every request, echoed to the client and into logs.
  app.use((req: Request & { id?: string }, res: Response, next: NextFunction) => {
    const incoming = req.headers["x-request-id"];
    req.id = (Array.isArray(incoming) ? incoming[0] : incoming) ?? randomUUID();
    res.setHeader("X-Request-Id", req.id);
    next();
  });

  app.use(
    helmet({
      // The API serves JSON only; a strict CSP costs nothing here.
      contentSecurityPolicy: {
        directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
      },
      hsts: env.NODE_ENV === "production" ? { maxAge: 31_536_000, includeSubDomains: true, preload: true } : false,
      referrerPolicy: { policy: "no-referrer" },
      crossOriginResourcePolicy: { policy: "same-site" },
    })
  );

  app.use(cookieParser());

  // Bound request bodies. Uploads go through a dedicated multipart route with
  // its own, larger limit.
  app.useBodyParser("json", { limit: "256kb" });
  app.useBodyParser("urlencoded", { limit: "256kb", extended: true });

  app.setGlobalPrefix("api/v1");

  app.enableCors({
    origin: (origin, callback) => {
      // Same-origin/server-to-server requests have no Origin header.
      if (!origin) return callback(null, true);
      if (corsOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} is not allowed`), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Org-Id", "Idempotency-Key", "X-Request-Id"],
    exposedHeaders: ["X-Request-Id"],
    maxAge: 86_400,
  });

  app.useGlobalInterceptors(new SerializationInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  // Give in-flight requests a chance to finish on SIGTERM (rolling deploys).
  app.enableShutdownHooks();

  await app.listen(env.PORT, "0.0.0.0");
  logger.log(`FuelLink API listening on :${env.PORT} (${env.NODE_ENV})`);
}

void bootstrap();
