import "server-only";

/**
 * Validates critical environment variables at application startup.
 * Throws an error if any required configuration is missing.
 *
 * This prevents the application from starting in a broken state where
 * it appears healthy but fails on first authenticated request.
 */
export function validateStartupConfig(): void {
  const errors: string[] = [];

  if (!process.env.BFF_TRUSTED_SECRET) {
    errors.push("BFF_TRUSTED_SECRET environment variable is required");
  }

  if (!process.env.DATABASE_URL) {
    errors.push("DATABASE_URL environment variable is required");
  }

  if (!process.env.BETTER_AUTH_SECRET) {
    errors.push("BETTER_AUTH_SECRET environment variable is required");
  }

  // Production-specific checks
  if (process.env.NODE_ENV === "production") {
    if (!process.env.BETTER_AUTH_URL) {
      errors.push("BETTER_AUTH_URL environment variable is required in production");
    }
    if (process.env.BETTER_AUTH_TRUST_HOST !== "true") {
      errors.push("BETTER_AUTH_TRUST_HOST=true is required in production");
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `CRITICAL STARTUP FAILURE - Missing required environment variables:\n${errors.map(e => `  - ${e}`).join('\n')}\n\nThe application cannot start without these variables.`
    );
  }
}
