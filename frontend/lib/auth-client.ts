"use client";

import { createAuthClient } from "better-auth/react";
import { jwtClient, organizationClient, adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [
    jwtClient(),
    organizationClient(),
    adminClient(),
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
    console.error("Failed to get API token");
    return null;
  }
}

// API client with automatic token injection and case conversion
export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = (typeof window === 'undefined' ? process.env.API_URL : process.env.NEXT_PUBLIC_API_URL) || "http://localhost:5000";
  const apiUrl = baseUrl;

  let headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Get token from BetterAuth
  const token = await getApiToken();
  if (token) {
    headers = {
      ...headers,
      Authorization: `Bearer ${token}`,
    };
  }

  const response = await fetch(`${apiUrl}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`[apiClient] Request failed: ${endpoint} - Status: ${response.status}`);
    throw new Error(error || `API error: ${response.status}`);
  }

  const data = await response.json();

  // Convert PascalCase keys from backend to camelCase for frontend
  // This ensures compatibility between C# DTOs and TypeScript types
  return convertKeysToCamelCase<T>(data);
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
