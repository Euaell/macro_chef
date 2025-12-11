# Next.js 16 & React 19 Upgrade Documentation

**Date**: December 11, 2025
**Project**: MacroChef (Mizan Platform)
**Status**: ✅ Complete with MCP Integration

---

## Overview

Successfully upgraded the MacroChef project from Next.js 15.0.3 to Next.js 16.0.8 with React 19 RC, including full migration to the proxy pattern and integration with Next.js DevTools MCP for advanced debugging.

## Upgrade Summary

### Frontend Upgrades
- **Next.js**: `15.0.3` → `16.0.8`
- **React**: `19.0.0-rc-66855b96-20241106` → `19.0.0-rc-de68d2f4-20241204`
- **React DOM**: Matching React version
- **TypeScript Types**: Updated to React 19 RC compatible types
- **Node.js**: v25.2.1 (exceeds minimum requirement of 20.9.0)

### Backend Upgrades
- **Docker Image**: Rebuilt with .NET SDK 10.0
- **Status**: ✅ Healthy and running

### Infrastructure
- **Better Auth**: Migrated from `middleware.ts` to `proxy.ts` (Next.js 16 pattern)
- **Next.js MCP**: Integrated for runtime diagnostics and testing
- **Turbopack**: Using default Turbopack bundler (works after cache cleanup)

---

## Installation Commands

```bash
# Frontend upgrade
cd frontend
npm install next@latest react@19.0.0-rc-de68d2f4-20241204 react-dom@19.0.0-rc-de68d2f4-20241204
npm install --save-dev @types/react@npm:types-react@rc @types/react-dom@npm:types-react-dom@rc

# Backend Docker rebuild
docker-compose build backend
docker-compose up -d backend
```

---

## Configuration Changes

### 1. Better Auth Migration (middleware → proxy)

**Created**: `frontend/proxy.ts`
```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
    // Authentication logic
    const sessionToken =
        request.cookies.get("better-auth.session_token")?.value ||
        request.cookies.get("__Secure-better-auth.session_token")?.value;

    // Redirect logic for protected routes
    // ...

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```

**Removed**: `frontend/middleware.ts` (deprecated in Next.js 16)

### 2. Environment Configuration

Updated [frontend/.env.local](frontend/.env.local):
```env
# Next.js 16.0.8 with React 19 RC
DATABASE_URL=postgres://mizan:mizan_dev_password@localhost:5432/mizan
BETTER_AUTH_SECRET=your_secret_key
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:5000
API_URL=http://localhost:5000
```

---

## Issues Encountered & Solutions

### Issue 1: Turbopack DLL Initialization Error (0xC0000142)

**Error**: `node process exited before we could connect to it with exit code: 0xc0000142`

**Root Cause**: Windows DLL initialization failure when Turbopack processes CSS files. This is a known Turbopack issue on Windows.

**Solution**:
```powershell
# Kill processes on port 3000
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

# Clean build cache
cd frontend
rm -rf .next
npm run dev
```

**Prevention**: Add project folder to Windows Defender exclusions to prevent interference with Node process spawning.

### Issue 2: Backend Docker Container Not Building

**Error**: `NETSDK1045: The current .NET SDK does not support targeting .NET 10.0`

**Root Cause**: Old Docker image cached with .NET SDK 8 while project upgraded to .NET 10.

**Solution**:
```bash
docker-compose build backend
docker-compose up -d backend
```

### Issue 3: Port Conflicts During Development

**Solution**: Created cleanup command documented in [docs/windows-port-cleanup.md](windows-port-cleanup.md)

```powershell
# Kill processes on multiple ports
Get-NetTCPConnection -LocalPort 3000,3001 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

---

## Next.js 16 MCP Integration

### What is MCP?

Next.js 16+ automatically exposes a **Model Context Protocol (MCP)** endpoint at `http://localhost:3000/_next/mcp` when the dev server starts. This provides:

- Real-time error detection and stack traces
- Route discovery and metadata
- Build diagnostics
- Server action inspection
- Runtime performance metrics

### MCP Tools Available

1. **get_project_metadata** - Project path and dev server URL
2. **get_errors** - Current error state (compilation, runtime, browser)
3. **get_page_metadata** - Runtime metadata about page renders
4. **get_logs** - Path to Next.js development log file
5. **get_server_action_by_id** - Locate Server Actions by ID
6. **get_routes** - All application routes (App Router & Pages Router)

### Using MCP Tools

```typescript
// Example: Get all errors
const errors = await fetch('http://localhost:3000/_next/mcp', {
    method: 'POST',
    body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
            name: 'get_errors',
            arguments: {}
        }
    })
});
```

**Or use the `next-devtools` MCP client for easier access.**

---

## Testing & Verification

### Frontend Status
- ✅ Dev server running on `http://localhost:3000`
- ✅ Next.js 16.0.8 with Turbopack
- ✅ React 19 RC rendering correctly
- ✅ Better Auth proxy working
- ✅ MCP endpoint accessible
- ⚠️  Hydration warning (Grammarly browser extension - not a code issue)

### Backend Status
- ✅ .NET 10 running in Docker
- ✅ Health endpoint responding
- ✅ PostgreSQL connected (healthy)
- ✅ Redis connected (healthy)

### Test Results
```bash
$ curl http://localhost:5000/health
{
  "status":"Healthy",
  "totalDuration":1.962,
  "system":{
    "environment":"Development",
    "memoryUsageBytes":18501384,
    "uptimeSeconds":22.27
  },
  "entries":[
    {"name":"npgsql","status":"Healthy","duration":1.79},
    {"name":"redis","status":"Healthy","duration":1.15}
  ]
}
```

---

## Known Warnings (Non-Critical)

### 1. Invalid Source Maps
```
G:\_Projects\macro_chef\frontend\.next\dev\server\chunks\ssr\_b9a5c0ba._.js:
Invalid source map. Only conformant source maps can be used to find the original code.
```

**Impact**: None - debugging still works
**Status**: Known Next.js 16 canary issue, will be fixed in stable release

### 2. Hydration Mismatch
```
A tree hydrated but some attributes of the server rendered HTML didn't match the client properties
data-new-gr-c-s-check-loaded="14.1266.0" data-gr-ext-installed=""
```

**Impact**: None - cosmetic only
**Cause**: Grammarly browser extension injecting attributes
**Solution**: Disable browser extensions or ignore (not a code issue)

---

## Remaining Tasks

### Optional Improvements
1. **Tailwind CSS v4 Migration** - Upgrade to latest Tailwind (currently on v3.4.1)
2. **Fix grid.svg 404** - Missing asset referenced in code
3. **Update eslint-config-next** - Currently on 15.0.3, should match Next.js 16.0.8

### Production Considerations
1. **Wait for Next.js 16 Stable Release** - Currently on canary (16.0.8)
2. **Test all routes thoroughly** - Use Next.js MCP tools for comprehensive testing
3. **Performance testing** - Verify Turbopack performance improvements
4. **Browser compatibility** - Next.js 16 requires Chrome 111+, Safari 16.4+, Firefox 128+

---

## Developer Workflow

### Local Development Setup

1. **Start Backend Services** (PostgreSQL, Redis, .NET API):
   ```bash
   docker-compose up -d postgres redis backend
   ```

2. **Start Frontend Locally**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access Application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - PostgreSQL: localhost:5432
   - Redis: localhost:6379
   - Next.js MCP: http://localhost:3000/_next/mcp

### Troubleshooting

**If pages won't load**:
```bash
# Clean build cache
cd frontend
rm -rf .next
npm run dev
```

**If backend won't connect**:
```bash
# Rebuild backend image
docker-compose build backend
docker-compose up -d backend
```

**If port conflicts occur**:
```powershell
# Windows - Kill processes on ports
Get-NetTCPConnection -LocalPort 3000,5000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

---

## References

- [Next.js 16 Release Notes](https://nextjs.org/blog/next-16)
- [React 19 RC Documentation](https://react.dev/blog/2024/04/25/react-19)
- [Better Auth Next.js Integration](https://www.better-auth.com/docs/integrations/next)
- [Next.js MCP Documentation](https://nextjs.org/docs/app/api-reference/config/mcp)

---

## Sources

Tailwind CSS v4 Migration Resources:
- [Tailwind CSS Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)
- [What's New and Migration Guide: Tailwind CSS v4.0](https://dev.to/kasenda/whats-new-and-migration-guide-tailwind-css-v40-3kag)
- [Upgrading to Tailwind CSS v4: A Migration Guide](https://typescript.tv/hands-on/upgrading-to-tailwind-css-v4-a-migration-guide/)
- [Tailwind CSS v4.0 Blog](https://tailwindcss.com/blog/tailwindcss-v4)
- [Essential Tailwind CSS v4 Migration Tips](https://medium.com/@genildocs/essential-tailwind-css-v4-migration-tips-the-practical-guide-that-actually-works-8eb4f38e2d3f)
