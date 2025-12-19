# MacroChef Architecture

## Overview

MacroChef is a full-stack meal planning and nutrition tracking application built with a modern, scalable architecture.

**Tech Stack:**
- **Frontend:** Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS
- **Backend:** ASP.NET Core 10 (Web API) + Clean Architecture + C#
- **Database:** PostgreSQL 18
- **Cache:** Redis 7 (SignalR backplane + application caching)
- **Authentication:** BetterAuth (JWT-based)
- **Deployment:** Docker + Docker Compose (self-hosted)

---

## Architecture Principles

### 1. Hybrid Pragmatic Approach

We accept **intentional schema separation** while automating the critical validation layer:

- **Backend owns business logic schema** (Recipes, Foods, Meals, etc.) via EF Core
- **Frontend owns auth schema** (Users, Sessions, JWKS) via Drizzle (BetterAuth requirement)
- **Validation is synchronized** via OpenAPI → Zod schema generation
- **Types are synchronized** via OpenAPI → TypeScript type generation
- **Case conversion** automatic (PascalCase ↔ camelCase) in API client

### 2. Schema Boundaries

#### Frontend Schema Zone (Drizzle ORM)
**Owner:** BetterAuth (authentication system)
**Tables:**
- `users` - User accounts
- `accounts` - OAuth provider accounts
- `sessions` - Active user sessions
- `jwks` - JWT signing keys
- `verification` - Email verification tokens

**Why separate?**
BetterAuth requires ORM control for auth schema management. Drizzle provides the flexibility needed for auth flows while maintaining type safety.

#### Backend Schema Zone (EF Core)
**Owner:** Business logic (Clean Architecture)
**Tables:**
- `foods` - Ingredient database
- `recipes` - User recipes
- `recipe_ingredients` - Recipe-food relationships
- `meal_plans` - Weekly meal plans
- `food_diary_entries` - Daily nutrition logs
- `workouts` - Workout logs
- `body_measurements` - Body composition tracking
- `achievements` - Gamification system
- `households` - Multi-user groups
- `trainers` - Trainer-client relationships

**Why backend?**
Complex business logic, validation rules, and domain-driven design are best expressed in C# with EF Core. Backend serves as the source of truth for business data.

#### Shared Boundary
**Table:** `households` (linked by both frontend and backend)
**Constraint:** Backend is the source of truth. Frontend references via user associations.

---

## Data Flow Architecture

### Request Flow

```
Browser → Next.js (proxy) → Backend API → PostgreSQL
   ↓          ↓                    ↓           ↓
  JWT    Validation           EF Core    Business Data
         (Zod)                  ↓
                           Redis Cache
```

### Authentication Flow

```
1. User submits login → BetterAuth (Next.js)
2. BetterAuth validates → Creates session + JWT
3. JWT sent to frontend → Stored in httpOnly cookie
4. API requests → JWT in Authorization header
5. Backend validates JWT → Uses JWKS from BetterAuth endpoint
6. JWKS cached in Redis → 1-minute TTL
```

### Type Safety Flow

```
Backend (C# DTOs)
    ↓
OpenAPI spec (with FluentValidation metadata)
    ↓
┌─────────────────┬──────────────────┐
│                 │                  │
TypeScript Types  Zod Schemas     (Code generation)
    ↓                 ↓
Frontend Components  Form Validation
```

---

## API Routing

### Next.js Proxy Configuration

**Handled by Next.js:**
- `/api/auth/*` - BetterAuth endpoints
- `/api/health` - Frontend health check
- `/api/csrf` - CSRF token management

**Proxied to Backend:**
- `/api/Users/*` → `http://backend:8080/api/Users/*`
- `/api/Foods/*` → `http://backend:8080/api/Foods/*`
- `/api/Recipes/*` → `http://backend:8080/api/Recipes/*`
- `/api/MealPlans/*` → `http://backend:8080/api/MealPlans/*`
- `/api/Workouts/*` → `http://backend:8080/api/Workouts/*`
- `/api/Goals/*` → `http://backend:8080/api/Goals/*`
- `/hubs/*` → `http://backend:8080/hubs/*` (SignalR)

**Network Topology:**
- **Client → Frontend (browser):** `http://localhost:3000`
- **Frontend → Backend (server-side):** `http://mizan-backend:8080` (Docker network)
- **Frontend → Backend (client-side):** `http://localhost:3000` (proxied via rewrites)

---

## Security Architecture

### Authentication
- **JWT Tokens:** ES256 algorithm (ECDSA P-256)
- **Token Expiry:** 15 minutes (JWT), 7 days (session)
- **JWKS Caching:** Redis with 1-minute TTL + in-memory fallback
- **Cookie Security:**
  - `httpOnly: true` (no JavaScript access)
  - `sameSite: "lax"` (CSRF protection)
  - `secure: true` (production only, HTTPS)

### CSRF Protection
- **Package:** `csrf-csrf`
- **Token Generation:** `/api/csrf` endpoint
- **Validation:** Double-submit cookie pattern
- **Ignored Methods:** GET, HEAD, OPTIONS

### Data Validation
- **Backend:** FluentValidation (command pipeline)
- **Frontend:** Zod schemas (generated from OpenAPI)
- **Sync Mechanism:** OpenAPI spec includes validation metadata

### Case Conversion
- **Automatic:** Backend DTOs (PascalCase) → Frontend types (camelCase)
- **Implementation:** `convertKeysToCamelCase()` in `apiClient()`
- **Prevents:** Property mismatch errors between C# and TypeScript

---

## Caching Strategy

### Redis Cache Layers

**1. JWKS Cache**
- **TTL:** 1 minute
- **Fallback:** In-memory cache
- **Purpose:** Reduce calls to BetterAuth JWKS endpoint

**2. Ingredient Search Cache**
- **TTL:** 1 hour
- **Key Pattern:** `foods:search:{term}:{barcode}:{limit}`
- **Invalidation:** On food creation/update (via prefix removal)

**3. Recipe Cache (planned)**
- **TTL:** 5 minutes
- **Key Pattern:** `recipes:{id}` or `recipes:user:{userId}`
- **Invalidation:** On recipe update/delete

**4. Meal Plan Cache (planned)**
- **TTL:** 5 minutes
- **Key Pattern:** `mealplans:week:{userId}:{weekStart}`
- **Invalidation:** On meal plan changes

### Cache-Aside Pattern
1. Check Redis cache first
2. If miss, query PostgreSQL
3. Store result in Redis with TTL
4. Return data

---

## Backend Architecture (Clean Architecture)

### Layers

```
┌─────────────────────────────────────────┐
│          API Layer (Controllers)        │
│  - HTTP endpoints                       │
│  - Swagger/OpenAPI                      │
│  - JWT authentication                   │
│  - CORS configuration                   │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Application Layer (CQRS)           │
│  - Commands (write operations)          │
│  - Queries (read operations)            │
│  - DTOs                                 │
│  - FluentValidation (ValidationBehavior)│
│  - MediatR pipeline                     │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│        Domain Layer (Core)              │
│  - Entities (Food, Recipe, User, etc.)  │
│  - Value Objects                        │
│  - Domain Events                        │
│  - Business Rules                       │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│     Infrastructure Layer (I/O)          │
│  - EF Core (PostgreSQL)                 │
│  - Redis cache service                  │
│  - External APIs (OpenAI)               │
│  - Email service                        │
└─────────────────────────────────────────┘
```

### Key Patterns
- **CQRS:** Commands (CUD) and Queries (R) separated
- **MediatR Pipeline:** Validation → Logging → Handler execution
- **Repository Pattern:** Abstracted via `IMizanDbContext`
- **Dependency Injection:** Constructor injection throughout

---

## Frontend Architecture

### Directory Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── api/               # Next.js API routes
│   │   ├── auth/          # BetterAuth handlers
│   │   ├── csrf/          # CSRF token management
│   │   └── health/        # Health check
│   ├── profile/           # Profile page
│   ├── recipes/           # Recipe management
│   └── meals/             # Meal planning
├── components/            # Reusable React components
├── db/                    # Drizzle schema + client
│   ├── schema.ts          # BetterAuth tables
│   └── client.ts          # PostgreSQL connection
├── lib/                   # Utilities and services
│   ├── auth.ts            # BetterAuth configuration
│   ├── auth-client.ts     # Client-side auth + apiClient
│   ├── hooks/             # Custom React hooks
│   │   ├── useFormValidation.ts  # Zod validation hook
│   │   └── useCsrfToken.ts       # CSRF hook
│   ├── utils/             # Utility functions
│   │   └── case-converter.ts     # PascalCase ↔ camelCase
│   └── validations/       # Zod schemas
│       └── api.generated.ts   # Generated from OpenAPI
├── types/                 # TypeScript types
│   ├── api.generated.ts   # Generated from OpenAPI
│   └── ...                # Custom types
└── scripts/               # Code generation
    └── generate-zod-schemas.mjs
```

### Key Patterns
- **Server Components:** Default for pages (SSR)
- **Client Components:** Forms, interactive UI
- **Custom Hooks:** Validation, CSRF, session management
- **API Client:** Centralized fetch wrapper with JWT injection

---

## Code Generation Workflow

### Setup
```bash
npm run codegen
```

### Process
1. **Fetch OpenAPI Spec:** From `http://localhost:5000/swagger/v1/swagger.json`
2. **Generate Types:** `openapi-typescript` → `types/api.generated.ts`
3. **Generate Zod Schemas:** `openapi-zod-client` → `lib/validations/api.generated.ts`

### Usage

**TypeScript Types:**
```typescript
import type { FoodDto } from "@/types/api.generated";
```

**Zod Validation:**
```typescript
import { FoodDtoSchema } from "@/lib/validations/api.generated";
import { useFormValidation } from "@/lib/hooks/useFormValidation";

const { errors, validate } = useFormValidation(FoodDtoSchema);
```

---

## Testing Strategy

### Preference Order
**E2E (Playwright) > Integration (Vitest) > Unit (Vitest)**

### Coverage
- **E2E Tests:** User flows (login, recipe creation, meal planning)
- **Integration Tests:** API endpoints, database queries
- **Unit Tests:** Pure functions, complex domain logic

### Test Database
- **Name:** `mizan_test`
- **Isolation:** Separate from dev database
- **Reset:** Before each test run

---

## Deployment

### Docker Compose Services

```yaml
services:
  postgres:    # PostgreSQL 18
  redis:       # Redis 7
  frontend:    # Next.js (port 3000)
  backend:     # ASP.NET Core (port 5000 → 8080 internal)
  test:        # Backend tests (profile: test)
```

### Environment Variables

**Frontend:**
- `DATABASE_URL` - PostgreSQL connection (for BetterAuth)
- `BETTER_AUTH_SECRET` - JWT signing secret
- `BETTER_AUTH_URL` - Auth base URL
- `API_URL` - Backend URL (server-side)
- `NEXT_PUBLIC_API_URL` - Backend URL (client-side)

**Backend:**
- `ConnectionStrings__PostgreSQL` - PostgreSQL connection
- `ConnectionStrings__Redis` - Redis connection
- `BetterAuth__JwksUrl` - JWKS endpoint
- `BetterAuth__Issuer` - JWT issuer
- `BetterAuth__Audience` - JWT audience

---

## Monitoring & Health Checks

### Endpoints
- `/api/health` (Frontend) - Next.js health + DB connection
- `/health` (Backend) - ASP.NET health + PostgreSQL + Redis

### Health Checks
- **PostgreSQL:** Connection test + simple query
- **Redis:** Ping test
- **SignalR:** Hub connection test

---

## Migration Strategy

### Schema Changes

**Backend (EF Core):**
```bash
cd backend
dotnet ef migrations add MigrationName
dotnet ef database update
```

**Frontend (Drizzle):**
```bash
cd frontend
npm run db:generate
npm run db:migrate
```

**IMPORTANT:** Changes to shared tables (e.g., `households`) must be coordinated between both ORMs.

---

## Future Enhancements

### Short-term
- [ ] Schema drift detection CI script
- [ ] Add Redis caching to more queries (recipes, meal plans)
- [ ] Implement Redis task queue for AI suggestions (BullMQ)

### Long-term
- [ ] Consider GraphQL for flexible frontend queries
- [ ] Add observability (OpenTelemetry, Serilog → Seq)
- [ ] Implement event sourcing for audit trails
- [ ] Add CDC (Change Data Capture) for real-time sync

---

## Troubleshooting

### Common Issues

**Q: Frontend can't connect to backend**
A: Check `API_URL` env var. Server-side should use `http://mizan-backend:8080` (Docker network).

**Q: Authentication fails with 401**
A: Verify JWKS endpoint is accessible. Check Redis cache. Ensure JWT issuer/audience match.

**Q: Type mismatch errors**
A: Run `npm run codegen` to regenerate types/schemas from latest OpenAPI spec.

**Q: Ingredient dropdown not showing**
A: Check `.card` CSS has `overflow-visible` on ingredients card.

**Q: CSRF validation fails**
A: Ensure CSRF token is fetched before form submission. Check cookie configuration.

---

## Contacts & Resources

- **Documentation:** This file (`ARCHITECTURE.md`)
- **API Documentation:** `http://localhost:5000/swagger` (when running)
- **Database Schema:** `backend/Mizan.Infrastructure/Data/MizanDbContext.cs`
- **Frontend Schema:** `frontend/db/schema.ts`
