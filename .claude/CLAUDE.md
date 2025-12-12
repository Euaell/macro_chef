# Claude Code Development Guidelines

This document outlines the coding practices, debugging approaches, and development principles used in this project.

---

## Core Principles

### 1. Always Refer to Official Documentation
- **Never guess** - Always check official docs before implementing
- Use MCP tools to fetch latest documentation when available
- For Microsoft/Azure: Use `microsoft_docs_search` and `microsoft_docs_fetch`
- For libraries: Use Context7 MCP to get up-to-date library docs
- For Next.js: Use Next.js DevTools MCP when debugging

### 2. Log-Driven Debugging
- **Always check logs first** before making assumptions
- Use Next.js DevTools MCP `nextjs_index` and `nextjs_call` to inspect runtime errors
- Read server logs to understand actual errors vs assumed errors
- Pay attention to HTTP status codes (404, 401, 500, etc.)
- Follow the actual error messages, not what you think the error might be

### 3. Read Before Modifying
- **Never propose changes to code you haven't read**
- Always use the Read tool to examine files before editing
- Understand existing patterns before suggesting modifications
- Check related files to understand context
- Check for the TASKS.md log to see recent changes

---

## Code Quality Standards

### Avoid Over-Engineering

**Principles:**
- Only make changes that are directly requested or clearly necessary
- Keep solutions simple and focused
- Don't add features beyond what was asked
- A bug fix doesn't need surrounding code cleanup
- Simple features don't need extra configurability

**Don't Add Unless Asked:**
- Docstrings or comments to unchanged code
- Type annotations to code you didn't modify
- Error handling for scenarios that can't happen
- Feature flags or backwards-compatibility shims
- Helpers/utilities for one-time operations
- Abstractions for hypothetical future requirements

**Example:**
```typescript
// ❌ Over-engineered
function validateEmail(email: string, options?: {
  checkDns?: boolean,
  allowInternational?: boolean
}): ValidationResult {
  // Complex validation with DNS checks, internationalization...
}

// ✅ Simple and sufficient
function validateEmail(email: string): boolean {
  return email.includes('@') && email.includes('.');
}
```

### Security Best Practices

**Authentication & Authorization:**
- Always validate JWT tokens server-side
- Use HttpOnly cookies for sessions
- Implement proper CSRF protection
- Rate limit authentication endpoints
- Hash passwords with bcrypt (min 10 rounds)
- Require email verification for new accounts

**API Security:**
- Validate all input on server-side
- Prevent SQL injection (use parameterized queries)
- Prevent XSS attacks (sanitize user input)
- Use HTTPS in production
- Implement proper CORS policies
- Never expose sensitive data in logs

**Common Vulnerabilities to Avoid:**
- Command injection
- SQL injection
- XSS (Cross-Site Scripting)
- CSRF (Cross-Site Request Forgery)
- Insecure direct object references
- Sensitive data exposure

---

## Architecture Patterns

### Server vs Client Components (Next.js)

**Use Server Components (default) for:**
- Data fetching that doesn't need real-time updates
- SEO-critical content
- Initial page loads
- Database queries
- Reading files

**Use Client Components (`'use client'`) for:**
- Interactive features (onClick, onChange, etc.)
- React hooks (useState, useEffect, useContext)
- Browser-only APIs (localStorage, window, document)
- Real-time updates
- **JWT-authenticated API calls** (tokens only available client-side)

**Example Pattern:**
```typescript
// ❌ Server component trying to use JWT
export default async function Page() {
  const token = await getApiToken(); // ❌ Won't work
  const data = await fetch('/api/data', {
    headers: { Authorization: `Bearer ${token}` }
  });
}

// ✅ Client component with JWT
'use client';
export default function Page() {
  useEffect(() => {
    async function loadData() {
      const token = await getApiToken(); // ✅ Works
      const data = await fetch('/api/data', {
        headers: { Authorization: `Bearer ${token}` }
      });
    }
    loadData();
  }, []);
}
```

### API Design Patterns

**RESTful Conventions:**
- `GET /api/resources` - List all
- `GET /api/resources/:id` - Get one
- `POST /api/resources` - Create
- `PUT /api/resources/:id` - Update
- `DELETE /api/resources/:id` - Delete

**Response Structure:**
- Use appropriate HTTP status codes
- Return consistent error formats
- Include timestamps when relevant
- Paginate large collections

**Example:**
```typescript
// ✅ Good API response
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-12-12T14:30:00Z"
}

// ✅ Good error response
{
  "success": false,
  "error": "Resource not found",
  "code": "NOT_FOUND",
  "timestamp": "2025-12-12T14:30:00Z"
}
```

---

## Debugging Workflow

### Step 1: Understand the Problem
1. Read the error message completely
2. Check the logs (use MCP tools for Next.js)
3. Identify the failing component/endpoint
4. Note the HTTP status code if applicable

### Step 2: Locate the Issue
1. Use Grep to search for relevant code
2. Read the files involved
3. Check related configuration files
4. Verify environment variables if needed

### Step 3: Verify Your Understanding
1. Check official documentation
2. Verify expected behavior vs actual behavior
3. Confirm the root cause before fixing

### Step 4: Implement Fix
1. Make minimal changes to fix the issue
2. Follow existing code patterns
3. Preserve existing functionality
4. Test related features aren't broken

### Step 5: Document the Fix
1. Update TASKS.md with timestamp
2. Add comments if the fix is non-obvious
3. Update docs if behavior changed

---

## Common Patterns & Solutions

### JWT Authentication Flow

**Problem:** Server components can't access JWT tokens
**Solution:** Move JWT-authenticated calls to client components

```typescript
// Server component for initial page load
export default async function Page() {
  const user = await getUser(); // Session-based auth
  return <div>{user ? <DataComponent /> : <LoginPrompt />}</div>;
}

// Client component for JWT-authenticated data
'use client';
function DataComponent() {
  const [data, setData] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const token = await getApiToken();
      const response = await apiClient('/api/data'); // Uses token
      setData(response);
    }
    fetchData();
  }, []);

  return <div>{data ? <Display data={data} /> : <Loading />}</div>;
}
```

### Middleware for Authentication

**Pattern:** Use Next.js middleware for route protection

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const publicPaths = ["/", "/login", "/register", "/privacy", "/terms"];

  const isPublic = publicPaths.some(p => path === p || path.startsWith(p + "/"));

  if (path.startsWith("/api/")) {
    return NextResponse.next(); // Let API handle its own auth
  }

  const session = request.cookies.get("session_token")?.value;

  if (!isPublic && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}
```

### Error Handling Pattern

**Always handle errors gracefully:**

```typescript
// ✅ Good error handling
async function fetchData() {
  try {
    const response = await apiClient('/api/data');
    return response;
  } catch (error) {
    console.error('Failed to fetch data:', error);
    // Return fallback data or null, don't crash
    return null;
  }
}

// ❌ Bad - unhandled errors crash the app
async function fetchData() {
  const response = await apiClient('/api/data'); // Throws error
  return response;
}
```

---

## File Organization

### Directory Structure

```
project/
├── frontend/                 # Next.js application
│   ├── app/                 # App Router pages
│   │   ├── page.tsx         # Home page
│   │   ├── layout.tsx       # Root layout
│   │   └── (feature)/       # Feature routes
│   ├── components/          # React components
│   │   ├── Dashboard/       # Feature-specific components
│   │   └── Navbar/          # Shared components
│   ├── lib/                 # Utilities & configuration
│   │   ├── auth.ts          # Better Auth setup
│   │   └── auth-client.ts   # Client-side auth utilities
│   ├── db/                  # Database schema & client
│   ├── data/                # Data access layer
│   └── public/              # Static assets
├── backend/                 # .NET API
│   ├── Mizan.Api/          # API controllers
│   ├── Mizan.Application/   # Business logic
│   ├── Mizan.Domain/        # Domain models
│   └── Mizan.Infrastructure/# Data access
├── docs/                    # Documentation
│   ├── ARCHITECTURE.md      # System architecture
│   ├── AUTHENTICATION.md    # Auth implementation
│   └── FEATURES.md          # Feature documentation
├── TASKS.md                 # Development log
└── CLAUDE.md                # This file
```

---

## Git Commit Guidelines

### Commit Message Format

```
<type>: <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**

```
feat: Add JWT authentication to dashboard stats

- Created client-side DashboardStats component
- Moved data fetching from server to client for JWT support
- Fixed API endpoint mismatches (/api/Meals/totals -> /api/Meals)

🤖 Generated with Claude Code
Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

```
fix: Add privacy and terms to public paths in middleware

Privacy and Terms pages were redirecting to login for unauthenticated users.
Added /privacy and /terms to publicPaths array in proxy.ts.

Fixes #123

🤖 Generated with Claude Code
Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## Testing Strategy

### What to Test

**Unit Tests:**
- Business logic functions
- Utility functions
- Data transformations
- Validators

**Integration Tests:**
- API endpoints
- Database queries
- Authentication flow
- External service integrations

**E2E Tests:**
- Critical user journeys
- Authentication flows
- Payment flows
- Data submission forms

### Testing Patterns

```typescript
// ✅ Good test structure
describe('User Authentication', () => {
  it('should login with valid credentials', async () => {
    // Arrange
    const credentials = { email: 'test@example.com', password: 'password123' };

    // Act
    const response = await signIn(credentials);

    // Assert
    expect(response.success).toBe(true);
    expect(response.user).toBeDefined();
  });

  it('should reject invalid credentials', async () => {
    // Arrange
    const credentials = { email: 'test@example.com', password: 'wrong' };

    // Act
    const response = await signIn(credentials);

    // Assert
    expect(response.success).toBe(false);
    expect(response.error).toBe('INVALID_EMAIL_OR_PASSWORD');
  });
});
```

---

## Performance Optimization

### Frontend Performance

**Principles:**
- Use Next.js Image component for images
- Implement code splitting
- Lazy load components when appropriate
- Minimize bundle size
- Use server components by default

**Example:**
```typescript
// ✅ Optimized image
import Image from 'next/image';
<Image src="/hero.jpg" alt="Hero" width={1200} height={600} priority />

// ✅ Lazy loading
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>,
});
```

### Backend Performance

**Principles:**
- Index database columns used in WHERE clauses
- Use pagination for large datasets
- Implement caching where appropriate
- Minimize database round trips
- Use connection pooling

---

## Common Mistakes to Avoid

### 1. Guessing Instead of Reading Docs
❌ "I think this library works like..."
✅ "Let me check the official documentation..."

### 2. Over-Engineering Simple Solutions
❌ Creating a complex abstraction for 3 similar lines
✅ Keeping it simple with DRY only when it makes sense

### 3. Ignoring Error Messages
❌ "It's probably a CORS issue..."
✅ "The error says 'No such column: updatedAt', let me fix that"

### 4. Not Testing in Production-Like Environment
❌ "Works on my machine"
✅ Test with Docker, env variables, production build

### 5. Mixing Server and Client Logic
❌ Using JWT tokens in server components
✅ Understanding which code runs where

### 6. Not Handling Edge Cases
❌ Assuming data always exists
✅ Handle null, undefined, empty arrays, network errors

---

## MCP Tools Usage

### Next.js DevTools MCP

**When to use:**
- Debugging runtime errors
- Checking server logs
- Inspecting component tree
- Monitoring build status

**Commands:**
```bash
# Initialize Next.js context
nextjs_index

# Call specific tools
nextjs_call --port 3000 --toolName get_errors

# Check routes
nextjs_call --port 3000 --toolName list_routes
```

### Microsoft Docs MCP

**When to use:**
- Looking up .NET/Azure documentation
- Finding C# code examples
- Understanding Microsoft APIs

**Commands:**
```bash
# Search docs
microsoft_docs_search --query "JWT authentication ASP.NET Core"

# Fetch full page
microsoft_docs_fetch --url "https://learn.microsoft.com/..."

# Search code samples
microsoft_code_sample_search --query "JWT validation" --language csharp
```

### Context7 MCP

**When to use:**
- Getting up-to-date library documentation
- Finding API references
- Seeing code examples

**Commands:**
```bash
# Resolve library
resolve-library-id --libraryName "better-auth"

# Get docs
get-library-docs --context7CompatibleLibraryID "/org/project"
```

---

## Continuous Improvement

### After Each Task
1. Update TASKS.md with timestamp and description
2. Check if documentation needs updating
3. Consider if patterns should be added to CLAUDE.md
4. Review code for potential improvements

### Regular Reviews
- Review and refactor complex code
- Update dependencies regularly
- Audit security practices
- Optimize performance bottlenecks

---

**Last Updated:** December 12, 2025
**Version:** 1.0
