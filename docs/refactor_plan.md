# MacroChef Full Refactor & Feature Implementation Plan

**Date:** 2026-02-11
**Status:** In Progress

## Context

The MacroChef codebase has a functioning backend (ASP.NET Core 10, Clean Architecture, CQRS) with most endpoints implemented, but the frontend (Next.js 16, React 19, Bun) has architectural inconsistencies, incomplete feature integrations, and code that needs cleanup. Goals:

- Remove BFF architecture in favor of direct JWT-based API calls
- Clean up CSS, unify design system around custom brand/accent colors
- Complete all frontend feature integrations with existing backend endpoints
- Fix logging, types, server actions organization, and proxy.ts

## Execution Phases

7 phases, each independently deployable. Phases 1-3 are foundation work. Phases 4-7 are feature implementations.

---

## Phase 1: API Client & BFF Removal

**Goal:** Single unified API client pattern, remove all BFF code.

- Create `frontend/lib/api.ts` with `serverApiClient` (reads JWT from session cookies, calls `API_URL`) and `clientApiClient` (gets JWT via `/api/auth/token`, calls `NEXT_PUBLIC_API_URL`)
- Both share: error handling, PascalCase-to-camelCase conversion, retry logic
- Migrate all `callBackendApi` usages in `data/*.ts` and `actions/meal.ts`
- Migrate all 19 client-side `apiClient` usages from `auth-client.ts`
- Keep `auth-client.ts` for auth-only exports (signIn, signUp, signOut, useSession)
- Delete `app/api/bff/[...path]/route.ts` and `lib/backend-api-client.ts`

## Phase 2: CSS & Design System Cleanup

**Goal:** Single source of truth for styles, unified color scheme.

- Deduplicate globals.css (lines 225-281 duplicate lines 48-104)
- Remap shadcn CSS variables: `--color-primary` to brand green, `--color-accent` to brand orange
- Fix shadcn components (button, badge, alert, sonner) to use brand colors
- Keep custom `cn()`/`cva()` using tailwind-merge (no clsx/cva packages)
- Audit and remove unused CSS utilities (.glass, .text-gradient, .animate-in)

## Phase 3: Infrastructure Fixes

- **Logging:** Replace custom logger with pino (basic pino works with Bun). Same API surface. Client-side fallback to console.
- **proxy.ts:** Implement auth protection for protected routes. Check session cookie, redirect to `/login?redirect=<path>`.
- **Server actions:** Move `actions/meal.ts` into `data/meal.ts`, `actions/audit.ts` into `data/audit.ts`. Delete `actions/` directory.
- **Types:** Single source of truth from `types/api.generated.ts`. Remove manual interfaces from data files.
- **Codegen:** Keep `openapi-typescript`. Remove dead scripts.

## Phase 4: Complete Recipe Features

Backend endpoints: GET/POST/PUT/DELETE `/api/recipes`, POST `/api/recipes/{id}/favorite`

- Add `createRecipe`, `updateRecipe`, `deleteRecipe`, `toggleFavorite` server actions
- Fix double-fetch on recipes page (single query with counts)
- Add proper filter/sort (currently stub buttons)
- Lazy-loaded card component for logged-in users (favorite state per card)

## Phase 5: Connect Existing Backend Features

- **Meal Plans:** Replace stubs with real API calls (GET/POST/DELETE `/api/mealplans`)
- **Shopping Lists:** Create `data/shoppingList.ts`, wire to `/api/shoppinglists`
- **Body Measurements:** New page, GET/POST `/api/bodymeasurements`
- **Workouts:** New page, POST `/api/workouts`, GET/POST `/api/exercises` (limited backend)
- **Achievements:** New page, GET `/api/achievements`, streak endpoints
- **Daily Nutrition N+1 Fix:** Single server action with `Promise.all` for 7-day history

## Phase 6: Trainer Features Fix

- Fix crash: `apiClient()` returns parsed JSON, remove `.json()` call
- Replace `alert()` calls with toast notifications
- Wire all trainer pages to proper endpoints (request, respond, clients, available, my-trainer, my-requests)
- Proper loading states and error handling

## Phase 7: Profile Section & Session Management

- Remove non-functional stub modals or wire to real settings
- Session management via BetterAuth API (list sessions, revoke, highlight current)
- Add links to body measurements, achievements, workout history
- Ensure proper error handling with toasts

---

## Estimated Scope

| Phase | Files Changed | New Files | Complexity |
|-------|--------------|-----------|------------|
| 1. API Client | ~25 | 1 | Medium |
| 2. CSS Cleanup | ~8 | 0 | Low |
| 3. Infrastructure | ~15 | 0 | Medium |
| 4. Recipes | ~8 | 0 | Medium |
| 5. Backend Features | ~12 | 8+ | High |
| 6. Trainer Fix | ~8 | 0 | Medium |
| 7. Profile | ~3 | 0 | Low |

Total: ~80 files touched, ~9 new files, 7 phases.
