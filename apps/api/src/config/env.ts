import { z } from "zod";

/**
 * Fail-fast environment validation. The process refuses to boot with an
 * invalid or incomplete environment — no half-configured services in
 * production, no silent fallback to insecure defaults.
 */
const EnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(4000),

    DATABASE_URL: z
      .string()
      .min(1, "DATABASE_URL is required")
      .refine(
        (v) => v.startsWith("postgresql://") || v.startsWith("postgres://"),
        "DATABASE_URL must be a PostgreSQL connection string"
      ),

    /** Separate secrets: a leaked access secret must not mint refresh tokens. */
    JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be >= 32 chars (openssl rand -hex 32)"),
    JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be >= 32 chars (openssl rand -hex 32)"),
    ACCESS_TOKEN_TTL: z.string().default("15m"),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().max(365).default(30),

    CORS_ORIGINS: z.string().default("http://localhost:3000"),
    COOKIE_DOMAIN: z.string().default("localhost"),
    COOKIE_SECURE: z
      .enum(["true", "false"])
      .default("true")
      .transform((v) => v === "true"),

    /** Account lockout policy. */
    MAX_FAILED_LOGINS: z.coerce.number().int().positive().default(5),
    LOCKOUT_MINUTES: z.coerce.number().int().positive().default(15),

    /** Hours a buyer has to confirm delivery before escrow auto-releases. */
    DELIVERY_AUTO_CONFIRM_HOURS: z.coerce.number().int().positive().default(72),

    /**
     * Short-delivery tolerance in basis points of ordered volume (50 = 0.5%).
     * Variance beyond this is flagged and blocks auto-release.
     */
    DELIVERY_VARIANCE_TOLERANCE_BPS: z.coerce.number().int().min(0).max(10_000).default(50),

    /** Default platform commission if no FeePolicy row matches. */
    DEFAULT_FEE_BPS: z.coerce.number().int().min(0).max(10_000).default(100),

    /** Max upload size for KYC/waybill documents. */
    MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(10 * 1024 * 1024),

    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),

    /**
     * Scales every rate limit. 1 = production limits. Integration tests set a
     * large value so the suite is not throttled by its own traffic; it is
     * pinned to 1 in production by the superRefine below.
     */
    RATE_LIMIT_FACTOR: z.coerce.number().int().min(1).max(100_000).default(1),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== "production") return;

    // Production-only hardening that cannot be expressed per-field.
    if (!env.COOKIE_SECURE) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["COOKIE_SECURE"],
        message: "COOKIE_SECURE must be true in production",
      });
    }
    if (env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["JWT_REFRESH_SECRET"],
        message: "JWT_REFRESH_SECRET must differ from JWT_ACCESS_SECRET",
      });
    }
    if (/dev-only|change-me|secret123/i.test(env.JWT_ACCESS_SECRET + env.JWT_REFRESH_SECRET)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["JWT_ACCESS_SECRET"],
        message: "Placeholder JWT secrets must not be used in production",
      });
    }
    if (env.RATE_LIMIT_FACTOR !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["RATE_LIMIT_FACTOR"],
        message: "RATE_LIMIT_FACTOR must be 1 in production",
      });
    }
    if (env.CORS_ORIGINS.includes("localhost")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["CORS_ORIGINS"],
        message: "CORS_ORIGINS must not include localhost in production",
      });
    }
  });

export type Env = z.infer<typeof EnvSchema>;

function loadEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    // Thrown, not logged — the process must not continue.
    throw new Error(`Invalid environment configuration:\n${details}`);
  }
  return parsed.data;
}

export const env: Env = loadEnv();

export const corsOrigins: string[] = env.CORS_ORIGINS.split(",")
  .map((o) => o.trim())
  .filter(Boolean);
