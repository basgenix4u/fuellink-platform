import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import cookieParser from "cookie-parser";
import { PrismaClient } from "@prisma/client";
import { AppModule } from "../src/app.module";
import { AllExceptionsFilter } from "../src/common/all-exceptions.filter";
import { SerializationInterceptor } from "../src/common/serialization.interceptor";

export const prisma = new PrismaClient({
  datasources: { db: { url: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL } },
});

/**
 * Boots the real application graph (real guards, real filters, real database)
 * so integration tests exercise the same wiring as production.
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

  const app = moduleRef.createNestApplication({ logger: false });
  app.use(cookieParser());
  app.setGlobalPrefix("api/v1");
  app.useGlobalInterceptors(new SerializationInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.init();
  return app;
}

/**
 * Truncates all business tables between tests.
 *
 * ledger_entries carries an immutability trigger that blocks DELETE, so a
 * plain deleteMany cannot clear it — TRUNCATE ... CASCADE is used instead,
 * with the trigger disabled for the duration of the statement.
 */
export async function resetDatabase(): Promise<void> {
  const tables: string[] = await prisma
    .$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
    `
    .then((rows) => rows.map((r) => r.tablename));

  if (tables.length === 0) return;
  const list = tables.map((t) => `"public"."${t}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
}

export const validPassword = "Str0ngPassphrase!";

export function registrationPayload(overrides: Record<string, unknown> = {}) {
  const unique = Math.random().toString(36).slice(2, 10);
  return {
    email: `user-${unique}@example.com`,
    password: validPassword,
    name: "Test User",
    phone: `+23480${Math.floor(10_000_000 + Math.random() * 89_999_999)}`,
    role: "MARKETER",
    organizationName: `Test Org ${unique}`,
    ...overrides,
  };
}

/** Extracts a cookie value from a supertest response. */
export function readCookie(res: { headers: Record<string, unknown> }, name: string): string | undefined {
  const raw = res.headers["set-cookie"];
  const cookies = Array.isArray(raw) ? raw : raw ? [String(raw)] : [];
  for (const c of cookies) {
    const match = new RegExp(`${name}=([^;]+)`).exec(c);
    if (match) return match[1];
  }
  return undefined;
}
