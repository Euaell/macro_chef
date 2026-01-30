Codebase Review - MCP Branch
Current Status (MCP Branch)
Branch: mcp (21 commits ahead of master)
What's Complete
- ✅ MCP Token Management - Full backend API + frontend UI
- ✅ MCP Server - ASP.NET Core server with 7 tools (ingredients, recipes, meals, shopping, tracking)
- ✅ JWT/EdDSA Authentication - BetterAuth integration with EdDSA signature validation
- ✅ Token Analytics Dashboard - Usage tracking and visualization
- ✅ Test Infrastructure - Integration tests + comprehensive CI/CD pipeline
- ✅ Docker Compose - Full local development stack with all services
What Remains
- ⚠️ Frontend route protection - proxy.ts currently passes all requests (return NextResponse.next())
- ⚠️ Admin role checks - Layout exists but role verification is commented out
- ⚠️ Social login buttons - Google/GitHub buttons are non-functional (no handlers)
- ⚠️ Schema inconsistency - frontend/db/schema.ts contains business tables (should be backend-only)
- ⚠️ Rate limiting for MCP - Not implemented (planned for Phase 4)
---
In-Depth Architectural Review
Backend Architecture (39K LOC)
Strengths:
- Clean Architecture with proper layer separation
- CQRS with MediatR pipeline (Validation → Audit → Logging)
- Strong authentication: JWT + EdDSA + BFF secret
- SignalR with Redis backplane for real-time chat
- MCP Server as separate service with token auth
- Comprehensive audit logging
Critical Issues:
1. Ane mic Domain Model
All business logic lives in Command Handlers; Domain entities are just POCOs. This is Transaction Script pattern, not DDD.
2. Authentication Scheme Confusion
Program.cs configures both JWT and BFF handlers, but only JWT is actually used. BFF handler appears vestigial.
3. SignalR Hub Direct DbContext Access
ChatHub queries _context.ChatConversations directly instead of using MediatR queries, breaking architectural consistency.
4. Audit Logging Silent Failures
AuditBehavior.cs catches and logs exceptions but allows operations to continue. Missing audit trails go undetected.
5. Search Performance
GetRecipesQuery.cs uses .ToLower() for case-insensitive search instead of EF.Functions.ILike (PostgreSQL native).
Frontend Architecture (80K LOC)
Strengths:
- Next.js 16 App Router with proper route groups
- BetterAuth integration with JWT plugin
- Server Components by default (good for performance)
- BFF pattern for backend communication
- MCP integration complete with hooks
Critical Issues:
1. Disabled Proxy/Middleware
proxy.ts returns NextResponse.next() for all requests. Route protection relies only on Server Component checks—no early redirects.
2. Hook Directory Fragmentation
Hooks split between frontend/hooks/ and frontend/lib/hooks/. No consistent convention.
3. Incomplete Admin Protection
admin/layout.tsx checks authentication but role check is commented out. Admin pages accessible to any logged-in user.
4. Redundant API Clients
Two separate implementations:
- lib/backend-api-client.ts (server-side)
- lib/auth-client.ts (client-side with apiClient())
Both handle JWT injection and case conversion separately.
5. Environment Variable Confusion
auth-client.ts checks NEXT_PUBLIC_APP_URL but throws error saying BETTER_AUTH_URL is undefined.
6. Production Code with TODOs
- hooks/useCoachSearch.ts line 25: alert("not implemented yet")
- data/user.ts: resend verification commented as "handled by BetterAuth" but no implementation
---
Design Considerations Overlooked
1. Rate Limiting Strategy
No rate limiting implemented anywhere. MCP server needs per-token limits (100 req/min, 1000 req/hour). API needs user-based limits to prevent abuse.
2. Caching Strategy Gaps
Redis is configured but underutilized:
- JWKS cached (good)
- Food search cached (good)
- No caching for: recipes, meal plans, user profiles, trainer-client relationships
3. Data Retention Policy
mcp_usage_logs table will grow indefinitely. No archiving or cleanup strategy. 30-day rolling retention with S3 backup should be implemented.
4. SignalR Scale-Out
Redis backplane configured but no sticky session handling in load balancer (relevant for production with multiple instances).
5. Token Rotation
MCP tokens have no automatic expiration/rotation. 90-day TTL with email notifications should be standard.
6. Error Handling Consistency
Backend returns various error formats:
- Commands throw exceptions → middleware catches → problem details
- Some endpoints return 200 with { success: false }
- Others return 400/401/404 with inconsistent message formats
7. Database Connection Resilience
No retry policies for transient PostgreSQL failures. Polly should be configured for connection resilience.
8. Input Validation Gaps
Several query handlers lack FluentValidation validators despite pipeline behavior being registered.
9. Pagination Missing
Multiple endpoints return unbounded result sets:
- GetShoppingListsQuery
- GetFoodDiaryQuery
- GetRecipesQuery (when no search term)
10. AI Service Inefficiency
NutritionAiService.cs creates new Kernel per request. Should use singleton/scoped kernel.
---
Recommendations (Priority Order)
High Priority (Before Production)
1. Fix route protection - Implement actual middleware checks or fix proxy.ts
2. Enable admin role checks - Uncomment and enforce role verification
3. Implement rate limiting - AspNetCoreRateLimit or custom middleware
4. Add pagination - All list endpoints need pagination (cursor or offset)
5. Fix search performance - Use EF.Functions.ILike for PostgreSQL
6. Consolidate API clients - Single apiClient with environment detection
Medium Priority (Technical Debt)
7. Implement data retention - Cleanup job for old MCP logs
8. Add caching layers - Recipe and meal plan caching
9. Fix SignalR architecture - Use MediatR queries in ChatHub
10. Make audit failures hard - Don't allow operations without audit logging
11. Remove BFF handler - If unused, remove dead code
12. Standardize error format - Consistent ProblemDetails for all errors
Low Priority (Refinement)
13. Rich domain model - Move business logic from handlers to entities
14. Token rotation - Automatic expiration with renewal flow
15. Social login implementation - Add Google/GitHub handlers
16. Hook organization - Move all hooks to single directory
17. Database retry policies - Polly for connection resilience
---
Testing Coverage
Strong:
- Backend integration tests (18 test classes)
- MCP token flow tested
- CI/CD with parallel jobs
- E2E tests with Playwright
Gaps:
- No unit tests for MCP Server tools
- No load/performance tests
- No SignalR hub tests
- No frontend unit tests (only E2E)
---
Summary
The MCP branch is feature-complete for token management and MCP server functionality. The architecture is solid with Clean Architecture principles, but has accumulated technical debt around route protection, input validation, and caching. The biggest risks before production are the disabled proxy protection, missing rate limiting, and unbounded query results.
Estimated time to production-ready: 2-3 weeks of focused work on high-priority items.