# Authentication & JWT Setup Guide

## Overview

Mizan uses a hybrid authentication system:
- **Better Auth** for user authentication (frontend)
- **JWT tokens** for backend API authentication
- **PostgreSQL** for session and user data storage

## Architecture

```
┌──────────────┐
│    User      │
└──────┬───────┘
       │ 1. Login
       ▼
┌──────────────────────────────────────┐
│         Better Auth                  │
│  - Validates credentials             │
│  - Creates session                   │
│  - Sets secure cookie                │
└──────────┬───────────────────────────┘
           │ 2. Session established
           ▼
┌──────────────────────────────────────┐
│      Frontend (Client-Side)          │
│  - GET /api/auth/token               │
│  - Receives JWT                      │
└──────────┬───────────────────────────┘
           │ 3. API calls with JWT
           ▼
┌──────────────────────────────────────┐
│      .NET Backend API                │
│  - Validates JWT signature           │
│  - Checks issuer & audience          │
│  - Extracts user claims              │
│  - Processes request                 │
└──────────────────────────────────────┘
```

## Better Auth Configuration

### File: `frontend/lib/auth.ts`

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { jwt, organization } from "better-auth/plugins";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...schema,
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      jwks: schema.jwks,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  plugins: [
    jwt({
      jwt: {
        issuer: process.env.BETTER_AUTH_URL || "http://localhost:3000",
        audience: "mizan-api",
        expirationTime: "15m",
      },
    }),
    organization({
      allowUserToCreateOrganization: true,
      organizationLimit: 5,
    }),
  ],
});
```

### Key Configuration Options

1. **`issuer`**: The URL of your frontend application
   - Development: `http://localhost:3000`
   - Production: Your domain (e.g., `https://mizan.app`)

2. **`audience`**: Identifier for your backend API
   - Set to `"mizan-api"`
   - Must match the audience validation in .NET backend

3. **`expirationTime`**: Token validity period
   - Default: `"15m"` (15 minutes)
   - Balance between security and UX

## Database Schema

### Required Tables

Better Auth requires these tables in PostgreSQL:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  email_verified BOOLEAN DEFAULT FALSE,
  name VARCHAR(255),
  image TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Accounts table (for OAuth and passwords)
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  id_token TEXT,
  access_token_expires_at TIMESTAMP,
  refresh_token_expires_at TIMESTAMP,
  scope TEXT,
  password TEXT,  -- hashed password
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- JWKS table (for JWT signing keys)
CREATE TABLE jwks (
  id TEXT PRIMARY KEY,
  public_key TEXT NOT NULL,
  private_key TEXT NOT NULL,  -- encrypted
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

## Frontend Implementation

### 1. Auth Client Setup

**File:** `frontend/lib/auth-client.ts`

```typescript
import { createAuthClient } from "better-auth/react";
import { jwtClient, organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [
    jwtClient(),
    organizationClient(),
  ],
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;

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
```

### 2. API Client with JWT

```typescript
// API client with automatic JWT injection
export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Only get token on client-side
  const token = typeof window !== 'undefined' ? await getApiToken() : null;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const response = await fetch(`${apiUrl}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}
```

### 3. Client-Side Data Fetching

**Important:** API calls that require authentication should happen on the client-side:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/auth-client';

export function DashboardStats() {
  const [data, setData] = useState(null);

  useEffect(() => {
    apiClient('/api/meals/today')
      .then(setData)
      .catch(console.error);
  }, []);

  return <div>{/* Render data */}</div>;
}
```

## Backend (.NET) Implementation

### 1. JWT Configuration

**File:** `backend/Program.cs`

```csharp
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"], // http://localhost:3000
            ValidAudience = builder.Configuration["Jwt:Audience"], // mizan-api
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"])
            ),
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();
```

### 2. Environment Variables

**File:** `backend/.env` or `appsettings.Development.json`

```json
{
  "Jwt": {
    "Issuer": "http://localhost:3000",
    "Audience": "mizan-api",
    "Secret": "your-secret-key-min-32-characters-long"
  }
}
```

**Important:** The JWT secret must match the secret used by Better Auth. Better Auth generates keys automatically in the `jwks` table, but for symmetric signing (HS256), you need a shared secret.

### 3. Protected Endpoints

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
[Authorize]  // Requires valid JWT
public class MealsController : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetMeals()
    {
        // Get user ID from JWT claims
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        // Fetch user's meals
        // ...

        return Ok(meals);
    }
}
```

### 4. Extracting User Information

```csharp
// Get user ID
var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
var userId = User.FindFirst("sub")?.Value;

// Get email
var email = User.FindFirst(ClaimTypes.Email)?.Value;
var email = User.FindFirst("email")?.Value;

// Get all claims
foreach (var claim in User.Claims)
{
    Console.WriteLine($"{claim.Type}: {claim.Value}");
}
```

## JWT Token Structure

### Claims

```json
{
  "sub": "user-uuid",           // Subject (user ID)
  "email": "user@example.com",   // User email
  "iat": 1234567890,            // Issued at
  "exp": 1234568790,            // Expiration
  "iss": "http://localhost:3000", // Issuer
  "aud": "mizan-api"            // Audience
}
```

### Header

```json
{
  "alg": "HS256",
  "typ": "JWT",
  "kid": "key-id"
}
```

## JWKS Endpoint

Better Auth provides a JWKS endpoint for public key verification:

```
GET http://localhost:3000/api/auth/jwks
```

Response:
```json
{
  "keys": [
    {
      "kty": "oct",
      "kid": "key-id",
      "alg": "HS256",
      "k": "base64-encoded-key"
    }
  ]
}
```

## Security Best Practices

### 1. **Token Storage**
- ✅ Store session cookies with `HttpOnly`, `Secure`, `SameSite=Strict`
- ✅ Short-lived JWT tokens (15 minutes)
- ❌ Do not store JWT in localStorage (XSS vulnerability)

### 2. **Secret Management**
- ✅ Use environment variables for secrets
- ✅ Different secrets for dev/prod
- ✅ Rotate keys periodically
- ❌ Never commit secrets to version control

### 3. **Token Validation**
- ✅ Validate issuer
- ✅ Validate audience
- ✅ Check expiration
- ✅ Verify signature

### 4. **HTTPS**
- ✅ Use HTTPS in production
- ✅ Set `Secure` flag on cookies
- ❌ Never send tokens over HTTP

## Troubleshooting

### Problem: JWT Returns 401

**Symptoms:**
- `/api/auth/token` returns 401
- `Failed to get API token` in console

**Causes:**
1. No active session (user not logged in)
2. Session expired
3. Session cookie not being sent

**Solution:**
```typescript
// Check if user is authenticated
const { data: session } = useSession();
if (!session) {
  // Redirect to login
  router.push('/login');
}
```

### Problem: Backend Returns 401

**Symptoms:**
- Backend API returns 401 even with JWT
- "Unauthorized" error

**Causes:**
1. JWT expired
2. Invalid signature
3. Issuer/audience mismatch
4. Missing Authorization header

**Solution:**
```typescript
// Verify JWT is being sent
const token = await getApiToken();
console.log('Token:', token);

// Check expiration
const decoded = JSON.parse(atob(token.split('.')[1]));
console.log('Expires:', new Date(decoded.exp * 1000));
```

### Problem: Server-Side API Calls Fail

**Symptoms:**
- API calls in Server Components return 401
- Data not loading on page refresh

**Cause:**
- JWT tokens are only available on client-side
- Server Components can't access Better Auth session directly

**Solution:**
Move API calls to Client Components:

```typescript
// ❌ Don't do this in Server Components
export default async function Page() {
  const data = await apiClient('/api/meals'); // Will fail!
  return <div>{data}</div>;
}

// ✅ Do this instead
'use client';
export default function Page() {
  const [data, setData] = useState(null);

  useEffect(() => {
    apiClient('/api/meals').then(setData);
  }, []);

  return <div>{data}</div>;
}
```

## Testing

### 1. Test JWT Generation

```bash
# Login first
curl -X POST http://localhost:3000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"password"}' \
  -c cookies.txt

# Get JWT token
curl http://localhost:3000/api/auth/token \
  -b cookies.txt
```

### 2. Test Backend API

```bash
# Get token
TOKEN=$(curl -b cookies.txt http://localhost:3000/api/auth/token | jq -r '.token')

# Call backend API
curl http://localhost:5000/api/meals \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Decode JWT

```bash
# Install jq
echo $TOKEN | cut -d'.' -f2 | base64 -d | jq
```

## References

- [Better Auth Documentation](https://www.better-auth.com)
- [JWT Plugin Docs](https://www.better-auth.com/docs/plugins/jwt)
- [JWT.io](https://jwt.io/) - JWT debugger
- [.NET JWT Authentication](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/)

---

**Last Updated:** December 12, 2025
