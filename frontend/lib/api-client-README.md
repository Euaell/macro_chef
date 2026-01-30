# API Client Architecture

This directory contains two specialized API clients for different contexts:

## 1. auth-client.ts (Client-Side)

**Use in:** Client Components ("use client")
**Exports:**
- `authClient` - Better Auth client for authentication
- `apiClient()` - HTTP client for backend API calls
- `getApiToken()` - Get JWT token for API calls
- `validateSession()` - Check if session is valid

**Example:**
```typescript
"use client";
import { apiClient } from "@/lib/auth-client";

const data = await apiClient("/api/Foods");
```

## 2. backend-api-client.ts (Server-Side)

**Use in:** Server Components, Server Actions, API Routes
**Exports:**
- `callBackendApi()` - Server-side HTTP client
- `BackendApiError` - Error class for backend API errors

**Example:**
```typescript
import { callBackendApi } from "@/lib/backend-api-client";

const data = await callBackendApi("/api/Foods");
```

## Key Differences

| Aspect | auth-client.ts | backend-api-client.ts |
|--------|----------------|----------------------|
| Context | Client-side | Server-side |
| Directive | "use client" | "server-only" |
| Token Source | /api/auth/token endpoint | Session cookie via headers() |
| Case Conversion | PascalCase → camelCase | No conversion |
| Error Handling | Redirects on 401 | Throws BackendApiError |

## Environment Variables

### Client-Side (NEXT_PUBLIC_*)
- `NEXT_PUBLIC_APP_URL` - Primary URL for Better Auth
- `NEXT_PUBLIC_API_URL` - Backend API URL for browser requests

### Server-Side
- `API_URL` - Backend API URL for server-side requests
- `BETTER_AUTH_URL` - Better Auth server URL

## Migration Guide

When moving code between client and server:
1. **Client → Server:** Replace `apiClient` with `callBackendApi`
2. **Server → Client:** Replace `callBackendApi` with `apiClient`
3. Update imports accordingly
4. Handle errors appropriately (redirects vs throws)
