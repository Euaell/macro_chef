# BFF Architecture Refactoring - Implementation Summary

## Overview

This document summarizes the Backend-for-Frontend (BFF) architecture refactoring implemented for the MacroChef (Mizan) platform. The refactoring resolves the dual-write problem where both frontend (BetterAuth/Drizzle) and backend (EF Core) managed auth-related tables.

## Problem Statement

**Before**:
- Frontend (BetterAuth) and Backend (EF Core) both managed `users`, `accounts`, `sessions`, `jwks`, and `verification` tables
- Risk of schema drift and migration conflicts
- Backend was publicly exposed with JWT validation
- Tight coupling between frontend and backend auth implementations

**After**:
- Frontend owns all auth tables (via Drizzle ORM)
- Backend is hidden behind frontend (BFF pattern)
- Backend trusts frontend authentication via shared secret
- Clear separation of concerns: Frontend = Auth, Backend = Business Logic

## Architecture Changes

### Before (Problematic)
```
Internet → Frontend (Port 3000)
Internet → Backend (Port 5000) [JWT Validation]
Both → PostgreSQL (Dual ownership of auth tables)
```

### After (BFF Pattern)
```
Internet → Frontend (Port 3000) [BFF Layer]
  ├─ Auth: BetterAuth + Drizzle
  └─ Proxy: /api/bff/* → Backend (Internal)
      │
      └─ Backend (Internal Only, Port 8080)
         └─ Business Logic Only
         └─ Trusted Secret Authentication

PostgreSQL:
  ├─ Auth Schema (Frontend Drizzle)
  └─ Business Schema (Backend EF Core)
```

## Implementation Details

### Phase 1: Backend Changes

#### 1.1 Created BFF Authentication Handler
- **File**: `backend/Mizan.Api/Authentication/BffAuthenticationHandler.cs`
- Validates `X-BFF-Secret` header from frontend
- Extracts user claims from `X-User-Id`, `X-User-Email`, `X-User-Role` headers
- Replaces JWT Bearer authentication

#### 1.2 Removed JWT Authentication
- **Deleted Files**:
  - `backend/Mizan.Api/Services/JwtBearerOptionsSetup.cs`
  - `backend/Mizan.Api/Services/JwksCache.cs`
  - `backend/Mizan.Api/Services/IJwksCache.cs`
- **Updated**: `backend/Mizan.Api/Program.cs`
  - Removed JWT Bearer services
  - Added BFF authentication scheme
  - Updated Swagger to reflect BFF authentication

#### 1.3 Excluded Auth Tables from Migrations
- **Updated**: `backend/Mizan.Infrastructure/Data/MizanDbContext.cs`
  - Removed `Accounts`, `Sessions`, `Jwks`, `Verifications` DbSets
  - Marked `User` entity as excluded from migrations (`SetIsTableExcludedFromMigrations(true)`)
  - Removed auth table configurations

#### 1.4 Updated Domain Entities
- **Deleted Files**:
  - `backend/Mizan.Domain/Entities/Account.cs`
  - `backend/Mizan.Domain/Entities/Session.cs`
  - `backend/Mizan.Domain/Entities/Jwk.cs`
  - `backend/Mizan.Domain/Entities/Verification.cs`

- **Updated**: `backend/Mizan.Domain/Entities/User.cs`
  - Removed `Accounts` and `Sessions` navigation properties
  - Updated documentation to indicate READ-ONLY status
  - Kept business navigation properties (Recipes, Workouts, etc.)

#### 1.5 Updated Application Interfaces
- **Updated**: `backend/Mizan.Application/Interfaces/IMizanDbContext.cs`
  - Removed `DbSet<Account>` and `DbSet<Session>`
  - Kept `DbSet<User>` for read-only access

### Phase 2: Frontend Changes

#### 2.1 Created Backend API Client
- **File**: `frontend/lib/backend-api-client.ts`
- Server-side only (uses `auth()` from BetterAuth)
- Adds trusted headers:
  - `X-BFF-Secret`: Shared secret
  - `X-User-Id`: Authenticated user ID
  - `X-User-Email`: User email (optional)
  - `X-User-Role`: User role (optional)
- Calls backend via internal Docker network

#### 2.2 Created BFF Proxy Routes
- **File**: `frontend/app/api/bff/[...path]/route.ts`
- Proxies all HTTP methods (GET, POST, PUT, DELETE, PATCH)
- Example: `GET /api/bff/recipes` → `GET http://backend:8080/api/recipes`
- Handles errors and returns appropriate status codes

### Phase 3: Infrastructure Changes

#### 3.1 Updated Docker Compose
- **File**: `docker-compose.yml`

**Frontend Service**:
- Added `BFF_TRUSTED_SECRET` environment variable
- Added `BACKEND_API_URL=http://backend:8080`
- Added dependency on backend service

**Backend Service**:
- **REMOVED** `ports` mapping (no longer publicly accessible!)
- Changed to `expose: ["8080"]` (internal only)
- Removed JWT/BetterAuth environment variables
- Added `Bff__TrustedSecret` configuration

#### 3.2 Updated Environment Variables
- **File**: `.env.example`
- Added `BFF_TRUSTED_SECRET` with generation instructions
- Updated documentation with security notes
- Removed MongoDB references (migrated to PostgreSQL)

## Security Improvements

### Before
✗ Backend publicly exposed on port 5000
✗ JWT validation requires JWKS endpoint calls
✗ Larger attack surface
✗ Dual ownership of auth tables

### After
✓ Backend hidden behind frontend (Docker network only)
✓ Simple trusted secret authentication
✓ Reduced attack surface
✓ Clear ownership: Frontend = Auth, Backend = Business
✓ Single point of entry (frontend)

## Configuration

### Required Environment Variables

**Frontend (.env.local)**:
```env
BETTER_AUTH_SECRET=<openssl rand -base64 32>
BFF_TRUSTED_SECRET=<openssl rand -base64 32>
BACKEND_API_URL=http://backend:8080
DATABASE_URL=postgres://mizan:password@postgres:5432/mizan
```

**Backend** (via docker-compose.yml):
```env
Bff__TrustedSecret=<same as BFF_TRUSTED_SECRET>
ConnectionStrings__PostgreSQL=Host=postgres;Database=mizan;Username=mizan;Password=password
ConnectionStrings__Redis=redis:6379
```

### Generate Secrets
```bash
# Generate BetterAuth secret
openssl rand -base64 32

# Generate BFF trusted secret
openssl rand -base64 32
```

## Migration from Old Architecture

### For Developers

1. **Pull latest code** from this branch
2. **Copy `.env.example` to `.env.local`**
3. **Generate secrets**:
   ```bash
   echo "BETTER_AUTH_SECRET=$(openssl rand -base64 32)" >> .env.local
   echo "BFF_TRUSTED_SECRET=$(openssl rand -base64 32)" >> .env.local
   ```
4. **Update backend configuration** in `docker-compose.yml` to use same `BFF_TRUSTED_SECRET`
5. **Start services**:
   ```bash
   docker-compose up --build
   ```
6. **Verify**:
   - Frontend accessible at http://localhost:3000
   - Backend NOT accessible at http://localhost:5000 (expected!)
   - API calls work through frontend BFF proxy

### For Production

1. **Generate production secrets** (use strong random values)
2. **Store secrets securely** (AWS Secrets Manager, Kubernetes Secrets, etc.)
3. **Deploy frontend** with BFF proxy enabled
4. **Deploy backend** without port exposure
5. **Configure reverse proxy** (Nginx, Traefik) to terminate HTTPS at frontend
6. **Verify backend isolation** (should not be accessible from internet)

## Testing

### Verify Backend Isolation
```bash
# This should FAIL (backend not exposed)
curl http://localhost:5000/health

# This should SUCCEED (via frontend BFF)
curl http://localhost:3000/api/bff/health
```

### Test BFF Proxy
```bash
# Login via frontend
# Then make authenticated request
curl -H "Cookie: better-auth.session_token=..." \
     http://localhost:3000/api/bff/recipes
```

## Future Migrations

### Next Migration: Exclude Auth Tables from EF Core
```bash
cd backend
dotnet ef migrations add RemoveAuthTablesFromMigrations \
  --project Mizan.Infrastructure \
  --startup-project Mizan.Api

# Verify migration does NOT include auth tables
cat Mizan.Infrastructure/Migrations/*_RemoveAuthTablesFromMigrations.cs
```

Expected migration should:
- NOT create/alter `users`, `accounts`, `sessions`, `jwks`, `verification` tables
- Only modify business logic tables

## Troubleshooting

### Backend Returns 401 Unauthorized
- Check `BFF_TRUSTED_SECRET` matches in both frontend and backend
- Verify frontend is sending `X-BFF-Secret` header
- Check logs: `docker-compose logs backend`

### Cannot Access Backend Directly
- **Expected!** Backend is internal only
- Access via frontend BFF proxy: `/api/bff/*`

### Auth Tables Missing
- **Expected!** Auth tables are managed by frontend Drizzle
- Backend can READ from `users` table but cannot modify it
- Check frontend database migrations

## Files Changed

### Backend
- `backend/Mizan.Api/Authentication/BffAuthenticationHandler.cs` (new)
- `backend/Mizan.Api/Program.cs` (modified)
- `backend/Mizan.Infrastructure/Data/MizanDbContext.cs` (modified)
- `backend/Mizan.Domain/Entities/User.cs` (modified)
- `backend/Mizan.Application/Interfaces/IMizanDbContext.cs` (modified)
- `backend/Mizan.Api/Services/JwtBearerOptionsSetup.cs` (deleted)
- `backend/Mizan.Api/Services/JwksCache.cs` (deleted)
- `backend/Mizan.Api/Services/IJwksCache.cs` (deleted)
- `backend/Mizan.Domain/Entities/Account.cs` (deleted)
- `backend/Mizan.Domain/Entities/Session.cs` (deleted)
- `backend/Mizan.Domain/Entities/Jwk.cs` (deleted)
- `backend/Mizan.Domain/Entities/Verification.cs` (deleted)

### Frontend
- `frontend/lib/backend-api-client.ts` (new)
- `frontend/app/api/bff/[...path]/route.ts` (new)

### Infrastructure
- `docker-compose.yml` (modified)
- `.env.example` (modified)

### Documentation
- `.analysis/backend-architecture-analysis.md` (existing)
- `.analysis/bff-architecture-refactor-plan.md` (existing)
- `BFF_REFACTORING_SUMMARY.md` (this file)

## References

- [BFF Pattern](https://samnewman.io/patterns/architectural/bff/)
- [ASP.NET Core Custom Authentication](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/custom-scheme)
- [EF Core Table Exclusions](https://learn.microsoft.com/en-us/ef/core/modeling/table-exclusion)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

## Conclusion

The BFF architecture refactoring successfully resolves the dual-write problem and improves security by:

1. **Clear Ownership**: Frontend owns auth, backend owns business logic
2. **Security**: Backend hidden from internet
3. **Simplicity**: No JWT validation overhead in backend
4. **Scalability**: Frontend and backend can scale independently
5. **Maintainability**: No migration conflicts between ORMs

The implementation is production-ready and follows industry best practices for microservices and BFF patterns.
