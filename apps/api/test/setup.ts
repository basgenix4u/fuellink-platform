/** Point the app at the test database for every integration test file. */
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET ??= "test-access-secret-0123456789abcdef0123456789abcdef";
process.env.JWT_REFRESH_SECRET ??= "test-refresh-secret-fedcba9876543210fedcba9876543210";
process.env.COOKIE_SECURE ??= "false";
process.env.COOKIE_DOMAIN ??= "localhost";
process.env.CORS_ORIGINS ??= "http://localhost:3000";
// Keep lockout tests fast and deterministic.
process.env.MAX_FAILED_LOGINS ??= "5";
process.env.LOCKOUT_MINUTES ??= "15";
process.env.RATE_LIMIT_FACTOR ??= "10000";
