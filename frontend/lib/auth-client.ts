"use client";

import { createAuthClient } from "better-auth/react";
import { organizationClient, adminClient } from "better-auth/client/plugins";
import { ac, adminRole, trainerRole, userRole } from "@/lib/permissions";
import { logger } from "@/lib/logger";

const authLogger = logger.createModuleLogger("auth-client");

export const authClient = createAuthClient({
  baseURL: (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_APP_URL) ? process.env.NEXT_PUBLIC_APP_URL : (() => { throw new Error("BETTER_AUTH_URL is not defined"); })(),
  plugins: [
    organizationClient(),
    adminClient({
      ac,
      roles: {
        user: userRole,
        trainer: trainerRole,
        admin: adminRole,
      },
    }),
  ],
});

// Export typed hooks and utilities
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
  organization,
} = authClient;

let cachedToken: { token: string; expiresAt: number } | null = null;

function decodeJwtExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload));
    if (!decoded?.exp) return null;
    return decoded.exp * 1000;
  } catch {
    return null;
  }
}

export async function getApiToken(): Promise<string | null> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30000) {
    return cachedToken.token;
  }

  try {
    const response = await fetch("/api/auth/token", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      authLogger.warn("Failed to fetch API token", {
        status: response.status,
        statusText: response.statusText,
      });
      return null;
    }

    const data = await response.json().catch(() => null);
    const token = data?.token;
    if (!token) {
      authLogger.warn("API token missing in response");
      return null;
    }

    const expiresAt = decodeJwtExpiry(token) ?? Date.now() + 10 * 60 * 1000;
    cachedToken = { token, expiresAt };

    return token;
  } catch (error) {
    authLogger.error("API token fetch failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

// Handle expired or invalid session
async function handleSessionExpired(): Promise<void> {
  if (typeof window === 'undefined') return;

  const currentPath = window.location.pathname;
  authLogger.warn("Session expired", { currentPath });

  try {
    await authClient.signOut({ fetchOptions: { onSuccess: () => { } } });
    authLogger.info("Sign out successful");
  } catch (error) {
    authLogger.error("Error signing out", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  if (currentPath !== '/login' && currentPath !== '/signup') {
    const redirectUrl = `/login?error=session_expired&redirect=${encodeURIComponent(currentPath)}`;
    authLogger.info("Redirecting to login", { from: currentPath, to: redirectUrl });
    window.location.href = redirectUrl;
  }
}

// API client with automatic token injection and case conversion
export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const normalizedEndpoint = endpoint.startsWith("/api/bff/")
    ? `/api/${endpoint.slice("/api/bff/".length)}`
    : endpoint;
  const apiUrl = typeof window === "undefined"
    ? process.env.API_URL!
    : process.env["NEXT_PUBLIC_API_URL"]!;

  authLogger.debug("API request starting", {
    endpoint: normalizedEndpoint,
    method: options.method || "GET",
    apiUrl,
    isServer: typeof window === "undefined",
  });

  let headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const token = await getApiToken();
  if (token) {
    headers = {
      ...headers,
      Authorization: `Bearer ${token}`,
    };
    authLogger.debug("Token attached to request");
  } else {
    authLogger.debug("No token for request", { endpoint: normalizedEndpoint });
  }

  const startTime = Date.now();

  try {
    const response = await fetch(`${apiUrl}${normalizedEndpoint}`, {
      ...options,
      headers,
      credentials: options.credentials,
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      if (response.status === 401) {
        authLogger.error("Unauthorized request", {
          endpoint,
          status: response.status,
          duration,
        });
        await handleSessionExpired();
        throw new Error("Session expired. Please log in again.");
      }

      const error = await response.text();
      authLogger.error("API request failed", {
        endpoint,
        status: response.status,
        statusText: response.statusText,
        error,
        duration,
      });
      throw new Error(error || `API error: ${response.status}`);
    }

    const data = await response.json();
    authLogger.debug("API request successful", {
      endpoint,
      status: response.status,
      duration,
    });

    return convertKeysToCamelCase<T>(data);
  } catch (error) {
    const duration = Date.now() - startTime;
    authLogger.error("API request exception", {
      endpoint,
      error: error instanceof Error ? error.message : String(error),
      duration,
    });
    throw error;
  }
}

// Validate current session and handle expiry
export async function validateSession(): Promise<boolean> {
  try {
    authLogger.debug("Validating session");

    const { data, error } = await authClient.getSession();

    if (error || !data?.session) {
      authLogger.warn("Session validation failed", {
        hasError: !!error,
        hasSession: !!data?.session,
      });
      await handleSessionExpired();
      return false;
    }

    authLogger.debug("Session validated successfully", {
      userId: data.session.userId,
    });
    return true;
  } catch (error) {
    authLogger.error("Session validation exception", {
      error: error instanceof Error ? error.message : String(error),
    });
    await handleSessionExpired();
    return false;
  }
}

// Helper function to convert PascalCase to camelCase recursively
function convertKeysToCamelCase<T>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => convertKeysToCamelCase(item)) as T;
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const converted: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
        converted[camelKey] = convertKeysToCamelCase(obj[key]);
      }
    }
    return converted as T;
  }

  return obj;
}
