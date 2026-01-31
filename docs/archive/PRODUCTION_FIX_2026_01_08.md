# Production Deployment Fixes - January 8, 2026

## Overview

Fixed critical production deployment issues related to authentication flow, API routing, and environment variable management.

## Issues Fixed

### 1. BFF Proxy Authentication Not Working

**Problem**: Client-side components were calling `/api/bff/*` routes, but requests were being sent to the backend URL instead of the frontend's BFF proxy routes, resulting in 404 errors.

**Root Cause**: The `apiClient` function in `frontend/lib/auth-client.ts` was prepending `NEXT_PUBLIC_API_URL` (which points to the backend) to ALL endpoints, including BFF routes that should be relative to the frontend.

**Solution**:
- Modified `apiClient` to detect BFF routes (`/api/bff/*`, `/api/auth/*`, `/api/*`) and use relative URLs (no base URL)
- Added `credentials: 'include'` for BFF routes to ensure session cookies are sent
- Removed unnecessary JWT token warning for BFF routes (session cookies handle authentication)

**Files Changed**:
- `frontend/lib/auth-client.ts` (lines 70-112)

```typescript
// Before
const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const response = await fetch(`${baseUrl}${endpoint}`, ...);

// After
const isBffRoute = endpoint.startsWith('/api/bff/') || endpoint.startsWith('/api/auth/') || endpoint.startsWith('/api/');
const baseUrl = isBffRoute ? '' : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000");
const response = await fetch(`${baseUrl}${endpoint}`, {
  ...options,
  credentials: isBffRoute ? 'include' : options.credentials,
});
```

### 2. Backend Returning 404 for Empty Results

**Problem**: `GoalsController.GetCurrentGoal()` was returning `NotFound` (404) when the user had no active goal. This is incorrect—404 should only be used for non-existent endpoints, not empty results.

**Solution**:
- Changed `GetCurrentGoal()` to return `Ok(null)` when no goal exists
- Updated return type to `ActionResult<UserGoalDto?>` to indicate nullable result
- Frontend already handles null responses correctly

**Files Changed**:
- `backend/Mizan.Api/Controllers/GoalsController.cs` (lines 21-28)

```csharp
// Before
public async Task<ActionResult<UserGoalDto>> GetCurrentGoal()
{
    var result = await _mediator.Send(new GetUserGoalQuery());
    if (result == null)
        return NotFound("No active goal found");
    return Ok(result);
}

// After
public async Task<ActionResult<UserGoalDto?>> GetCurrentGoal()
{
    var result = await _mediator.Send(new GetUserGoalQuery());
    // Return 200 with null if no goal exists
    // 404 should only be used for non-existent endpoints, not empty results
    return Ok(result);
}
```

### 3. Docker Compose Environment Variable Management

**Problem**: Production `docker-compose.yml` had all environment variables defined inline, making it difficult to manage secrets and configuration.

**Solution**:
- Refactored to use `.env` file injection via `env_file` directive
- Only production-specific overrides remain inline (`NODE_ENV`, `ASPNETCORE_ENVIRONMENT`, etc.)
- Updated `.env.example` with comprehensive documentation

**Files Changed**:
- `docker-compose.prod.yml` (simplified environment configuration)
- `.env.example` (comprehensive documentation added)

**Before**:
```yaml
frontend:
  environment:
    - DATABASE_URL=${DATABASE_URL}
    - BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
    - BFF_TRUSTED_SECRET=${BFF_TRUSTED_SECRET}
    # ... 30+ lines of env vars
```

**After**:
```yaml
frontend:
  env_file:
    - .env
  environment:
    # Only production-specific overrides
    - NODE_ENV=production
    - BACKEND_API_URL=http://backend:8080
    - BETTER_AUTH_TRUST_HOST=true
    - NEXT_TELEMETRY_DISABLED=1
```

## Environment Variable Types (Next.js)

### Build-Time Variables (NEXT_PUBLIC_*)

- **Behavior**: Baked into JavaScript bundle during `next build`
- **When to Use**: Client-side values that don't change between environments with the same build
- **Examples**: `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_API_KEY`
- **Changing**: Requires Docker image rebuild
- **Set in**: `frontend/Dockerfile.prod` as ARG/ENV

### Runtime Variables (Server-Side)

- **Behavior**: Evaluated at runtime when server code executes
- **When to Use**: Secrets, connection strings, configuration that changes per environment
- **Examples**: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BFF_TRUSTED_SECRET`
- **Changing**: Update `.env` file, restart container (no rebuild needed)
- **Set in**: `.env` file loaded via `docker-compose.yml`

## Testing Checklist

- [ ] Login/signup flow works
- [ ] Email verification works (correct URL in email)
- [ ] Dashboard loads without 404 errors
- [ ] `/api/bff/Goals` returns `200 null` for users without goals
- [ ] `/api/bff/Meals` returns `200 { entries: [], totals: {...} }` for empty days
- [ ] `/api/bff/Recipes` returns `200 { recipes: [], ... }` for no recipes
- [ ] Session cookies are sent with BFF requests
- [ ] No "No token available" warnings in browser console for BFF routes
- [ ] Environment variables loaded from `.env` file
- [ ] Changing `.env` values takes effect after container restart (no rebuild)

## Deployment Instructions

1. **Create `.env` file** in `/opt/mizan/`:
   ```bash
   cd /opt/mizan
   cp .env.example .env
   nano .env  # Fill in your actual values
   ```

2. **Update `docker-compose.yml`** to use the simplified version:
   ```bash
   # Copy the new docker-compose.prod.yml
   cp docker-compose.prod.yml docker-compose.yml
   ```

3. **Pull latest images**:
   ```bash
   docker-compose pull
   ```

4. **Restart services**:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

5. **Verify logs**:
   ```bash
   docker-compose logs -f frontend
   docker-compose logs -f backend
   ```

## Key Learnings

1. **BFF Routing**: Client-side code must use relative URLs for frontend API routes. Prepending a base URL breaks the BFF proxy pattern.

2. **HTTP Status Codes**: 404 means "endpoint not found," not "no data." Use `200 OK` with null/empty array for legitimate "no data" responses.

3. **Next.js Environment Variables**:
   - `NEXT_PUBLIC_*` → Build-time (baked into bundle)
   - Server-side → Runtime (evaluated when server code runs)
   - Use server-side vars for secrets and per-environment config

4. **Docker Environment Management**: Use `.env` file injection instead of inline variables for better secret management and easier configuration changes.

## Related Documentation

- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Better Auth Session Handling](https://www.better-auth.com/docs/integrations/next)
- [Docker Compose env_file](https://docs.docker.com/compose/environment-variables/set-environment-variables/)

## Files Modified

```
frontend/lib/auth-client.ts
backend/Mizan.Api/Controllers/GoalsController.cs
docker-compose.prod.yml
.env.example
```

## Testing Results

**Expected Behavior After Fixes**:
- ✅ Login creates session cookie
- ✅ Dashboard loads and fetches user data via BFF proxy
- ✅ Empty goal returns `200 null` instead of `404`
- ✅ BFF routes use relative URLs and include credentials
- ✅ No JWT token warnings for BFF requests
- ✅ Environment variables loaded from `.env` file

**Breaking Changes**: None. Changes are backward-compatible.

**Migration Required**: No code changes needed in existing deployments. Just update `.env` file and `docker-compose.yml`.
