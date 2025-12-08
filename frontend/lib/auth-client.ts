import { createAuthClient } from "better-auth/react";
import { jwtClient, organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [
    jwtClient(),
    organizationClient(),
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

// Get JWT token for API calls
export async function getApiToken(): Promise<string | null> {
  try {
    const { data } = await authClient.token();
    return data?.token || null;
  } catch (error) {
    console.error("Failed to get API token:", error);
    return null;
  }
}

// API client with automatic token injection
export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getApiToken();

  const baseUrl = (typeof window === 'undefined' ? process.env.API_URL : process.env.NEXT_PUBLIC_API_URL) || "http://localhost:5000";
  const apiUrl = baseUrl;

  const response = await fetch(`${apiUrl}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `API error: ${response.status}`);
  }

  return response.json();
}
