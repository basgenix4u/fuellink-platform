import { z } from "zod";

/**
 * Fail-fast environment validation. The process refuses to boot with an
 * invalid or incomplete environment — no half-configured services.
 */
const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .refine((v) => v.startsWith("postgresql://") || v.startsWith("postgres://"), "DATABASE_URL must be a Postgres connection string"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters (openssl rand -hex 32)"),
  JWT_EXPIRES_IN: z.string().default("12h"),
  CORS_ORIGINS: z.string().default("https://fuellink.ng")
});

export type Env = z.infer<typeof EnvSchema>;

export const env: Env = EnvSchema.parse(process.env);
