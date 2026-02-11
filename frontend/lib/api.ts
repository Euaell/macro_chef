import { logger } from "@/lib/logger";

const apiLogger = logger.createModuleLogger("api");

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body: unknown
  ) {
    super(`API error: ${status} ${statusText}`);
  }
}

function convertKeysToCamelCase<T>(obj: unknown): T {
  if (obj === null || obj === undefined) return obj as T;

  if (Array.isArray(obj)) {
    return obj.map((item) => convertKeysToCamelCase(item)) as T;
  }

  if (typeof obj === "object" && obj.constructor === Object) {
    const converted: Record<string, unknown> = {};
    for (const key in obj as Record<string, unknown>) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
        converted[camelKey] = convertKeysToCamelCase(
          (obj as Record<string, unknown>)[key]
        );
      }
    }
    return converted as T;
  }

  return obj as T;
}

function safeJsonParse(text: string): unknown | undefined {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

interface ApiRequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  requireAuth?: boolean;
}

async function request<T>(
  baseUrl: string,
  path: string,
  token: string | null,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { method = "GET", body, headers: extraHeaders, requireAuth = true } = options;

  if (requireAuth && !token) {
    throw new ApiError(401, "Unauthorized", { error: "Missing token" });
  }

  const url = `${baseUrl}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };

  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const rawBody = await response.text().catch(() => "");
      const parsed = rawBody ? safeJsonParse(rawBody) ?? { raw: rawBody } : {};

      apiLogger.error("Request failed", {
        path,
        status: response.status,
        duration,
      });

      throw new ApiError(response.status, response.statusText, parsed);
    }

    apiLogger.debug("Request successful", { path, status: response.status, duration });

    if (response.status === 204) return undefined as T;

    const raw = await response.text();
    const data = safeJsonParse(raw) ?? (raw as unknown);
    return convertKeysToCamelCase<T>(data);
  } catch (error) {
    if (error instanceof ApiError) throw error;

    const duration = Date.now() - startTime;
    apiLogger.error("Request exception", {
      path,
      error: error instanceof Error ? error.message : String(error),
      duration,
    });
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Server-side API client (for Server Components, Server Actions, Route Handlers)
// ---------------------------------------------------------------------------

export async function serverApi<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { headers: headersFn } = await import("next/headers");
  const { auth } = await import("@/lib/auth");

  const requestHeaders = await headersFn();
  const session = await auth.api.getSession({ headers: requestHeaders });
  const requireAuth = options.requireAuth !== false;

  if (requireAuth && !session?.user?.id) {
    throw new ApiError(401, "Unauthorized", { error: "Not authenticated" });
  }

  const baseUrl =
    process.env.API_URL || process.env.BACKEND_API_URL || "http://backend:8080";
  const token = await getServerToken(requestHeaders);

  return request<T>(baseUrl, path, token, options);
}

async function getServerToken(headers: Headers): Promise<string | null> {
  const baseUrl =
    process.env.BETTER_AUTH_URL || buildBaseUrlFromHeaders(headers);
  if (!baseUrl) {
    apiLogger.error("Unable to determine BetterAuth base URL for token");
    return null;
  }

  try {
    const response = await fetch(`${baseUrl}/api/auth/token`, {
      method: "GET",
      headers: { cookie: headers.get("cookie") ?? "" },
    });

    if (!response.ok) {
      apiLogger.warn("Failed to fetch server API token", {
        status: response.status,
      });
      return null;
    }

    const data = await response.json().catch(() => null);
    return data?.token ?? null;
  } catch (error) {
    apiLogger.error("Server API token fetch failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

function buildBaseUrlFromHeaders(headers: Headers): string | null {
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (!host) return null;
  const protocol = headers.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}

// ---------------------------------------------------------------------------
// Client-side API client (for Client Components)
// ---------------------------------------------------------------------------

let cachedToken: { token: string; expiresAt: number } | null = null;

function decodeJwtExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload));
    return decoded?.exp ? decoded.exp * 1000 : null;
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
      apiLogger.warn("Failed to fetch API token", { status: response.status });
      return null;
    }

    const data = await response.json().catch(() => null);
    const token = data?.token;
    if (!token) {
      apiLogger.warn("API token missing in response");
      return null;
    }

    const expiresAt = decodeJwtExpiry(token) ?? Date.now() + 10 * 60 * 1000;
    cachedToken = { token, expiresAt };
    return token;
  } catch (error) {
    apiLogger.error("API token fetch failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

async function handleSessionExpired(): Promise<void> {
  if (typeof window === "undefined") return;

  const currentPath = window.location.pathname;
  apiLogger.warn("Session expired", { currentPath });

  try {
    const { authClient } = await import("@/lib/auth-client");
    await authClient.signOut({ fetchOptions: { onSuccess: () => {} } });
  } catch (error) {
    apiLogger.error("Error signing out", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  if (currentPath !== "/login" && currentPath !== "/signup") {
    window.location.href = `/login?error=session_expired&redirect=${encodeURIComponent(currentPath)}`;
  }
}

export async function clientApi<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const apiUrl = process.env["NEXT_PUBLIC_API_URL"]!;
  const token = await getApiToken();

  try {
    return await request<T>(apiUrl, path, token, options);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      await handleSessionExpired();
      throw new Error("Session expired. Please log in again.");
    }
    throw error;
  }
}
