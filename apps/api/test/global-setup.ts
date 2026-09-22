import { execSync } from "node:child_process";

/**
 * Applies migrations to the test database once, before the suite runs.
 * Using `migrate deploy` (not `db push`) means the tests exercise exactly the
 * SQL that will run in production — including the ledger triggers and check
 * constraints, which `db push` would also create but which we want verified
 * through the real migration path.
 */
export default async function globalSetup(): Promise<void> {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error(
      "TEST_DATABASE_URL is not set. Run ./scripts/dev-db.sh and export it, e.g.\n" +
        "  export TEST_DATABASE_URL=postgresql://fuellink:fuellink@127.0.0.1:5432/fuellink_test?schema=public"
    );
  }

  execSync("npx prisma migrate reset --force --skip-seed --skip-generate", {
    env: { ...process.env, DATABASE_URL: url },
    stdio: "pipe",
  });
}
