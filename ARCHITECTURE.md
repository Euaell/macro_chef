# MacroChef Architecture Documentation

## Overview

MacroChef 2.0 is built with a modern, scalable architecture using Next.js 15, PostgreSQL, and Redis. This document outlines the key architectural decisions and patterns used in the application.

## Technology Stack

### Frontend
- **Next.js 15** with App Router for file-based routing and React Server Components
- **React 19** (RC) for UI rendering
- **TypeScript** for type safety
- **Tailwind CSS** for utility-first styling
- **Radix UI** for accessible, unstyled component primitives
- **React Hook Form** with Zod validation for form handling

### Backend
- **Next.js API Routes** for serverless API endpoints
- **PostgreSQL 16** for relational data storage
- **Prisma ORM** for type-safe database access
- **Redis 7** for caching and session management
- **NextAuth.js v5** for authentication and authorization

### Infrastructure
- **Docker** for containerization
- **Docker Compose** for orchestration
- **Nodemailer** for transactional emails
- **OpenAI API** for AI-powered features

## Application Architecture

### Directory Structure

```
macro_chef/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth route group
│   │   ├── login/
│   │   └── register/
│   ├── api/                 # API routes
│   │   ├── auth/           # NextAuth handlers
│   │   ├── recipes/        # Recipe endpoints
│   │   ├── meals/          # Meal endpoints
│   │   └── ...
│   ├── dashboard/          # Protected dashboard
│   └── ...
├── components/              # React components
│   ├── ui/                 # Reusable UI components (shadcn/ui)
│   └── features/           # Feature-specific components
├── lib/                     # Shared libraries
│   ├── actions/            # Server actions
│   ├── prisma.ts           # Prisma client singleton
│   ├── redis.ts            # Redis client singleton
│   ├── email.ts            # Email utilities
│   └── types.ts            # Shared TypeScript types
├── prisma/                  # Database
│   ├── schema.prisma       # Database schema
│   ├── migrations/         # Migration files
│   └── seed.ts             # Seed data
├── auth.ts                  # NextAuth configuration
├── auth.config.ts           # NextAuth config
└── middleware.ts            # Route middleware
```

### Data Flow

1. **Client Request** → Next.js App Router
2. **Middleware** → Authentication check
3. **Route Handler / Server Component** → Business logic
4. **Server Actions** → Form submissions and mutations
5. **Prisma Client** → Database operations
6. **Redis Cache** → Performance optimization
7. **Response** → Client

## Database Design

### Schema Principles

- **Normalization**: Proper 3NF normalization to reduce redundancy
- **Relations**: Foreign keys and proper relationships between entities
- **Indexing**: Strategic indexes on frequently queried fields
- **Type Safety**: Prisma schema generates TypeScript types

### Key Models

#### User
- Authentication and profile information
- Linked to all user-generated content
- Social features (followers, following)

#### Recipe
- Many-to-many with Ingredients via RecipeIngredient
- Self-referencing for sub-recipes
- Social features (likes, comments, collections)

#### MealPlan
- One-to-many with MealPlanRecipe
- Date-based organization
- Aggregated nutritional data

#### Workout & BodyComposition
- Fitness tracking features
- Time-series data for trends

#### Achievement & Activity
- Gamification system
- User engagement tracking

## Authentication & Authorization

### NextAuth.js v5

- **Credentials Provider**: Email/password authentication
- **JWT Strategy**: Stateless session management
- **Prisma Adapter**: User data persistence
- **Email Verification**: Token-based email verification
- **Password Reset**: Secure password recovery flow

### Middleware

- Route protection at the edge
- Public/private route separation
- Automatic redirect to login for unauthenticated users

### Security

- **Password Hashing**: bcryptjs with salt rounds
- **Token Expiry**: Time-limited verification and reset tokens
- **CSRF Protection**: Built into NextAuth.js
- **Secure Cookies**: HttpOnly, Secure, SameSite settings

## Caching Strategy

### Redis Implementation

```typescript
// Cache utilities
- get<T>(key): Get cached value
- set(key, value, ttl): Set cache with expiry
- del(key): Delete cache entry
- invalidatePattern(pattern): Clear multiple keys
```

### Cache Patterns

1. **Read-Through Cache**
   ```typescript
   const data = await cache.get('key');
   if (!data) {
     data = await database.query();
     await cache.set('key', data, 3600);
   }
   ```

2. **Cache Invalidation**
   - On data mutation: `cache.del('resource:id')`
   - Pattern-based: `cache.invalidatePattern('user:*')`

### Cached Resources

- User profiles
- Recipe listings
- Ingredient database
- Meal plans
- Achievement progress

## API Design

### RESTful Endpoints

```
GET    /api/recipes              # List recipes
POST   /api/recipes              # Create recipe
GET    /api/recipes/:id          # Get recipe
PUT    /api/recipes/:id          # Update recipe
DELETE /api/recipes/:id          # Delete recipe
```

### Server Actions

```typescript
'use server'

export async function createRecipe(data: FormData) {
  // Validate with Zod
  // Check authentication
  // Perform database operation
  // Invalidate cache
  // Return result
}
```

### Validation

- **Zod Schemas**: Runtime type validation
- **Type Inference**: Automatic TypeScript types
- **Error Handling**: Structured error responses

## Performance Optimizations

### Database

- **Connection Pooling**: Prisma connection pool
- **Query Optimization**: Select only needed fields
- **Eager Loading**: Include relations to reduce queries
- **Indexes**: Strategic indexing on search fields

### Caching

- **Redis**: In-memory caching for frequent reads
- **Edge Caching**: Next.js edge caching
- **Static Generation**: Pre-render static pages

### Frontend

- **Server Components**: Reduce JavaScript bundle
- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Next.js Image component
- **Lazy Loading**: Dynamic imports for heavy components

## Docker Architecture

### Multi-Stage Build

```dockerfile
1. deps     → Install dependencies
2. builder  → Generate Prisma client & build app
3. runner   → Minimal production image
```

### Services

```yaml
db:      PostgreSQL with persistent volume
redis:   Redis with persistent volume
app:     Next.js application
studio:  Prisma Studio (dev tool)
```

### Networking

- Internal bridge network for inter-service communication
- Exposed ports only for external access
- Health checks for service readiness

## Error Handling

### Client-Side

```typescript
try {
  const result = await serverAction(formData);
  if (result.success) {
    // Handle success
  } else {
    // Show errors
  }
} catch (error) {
  // Handle unexpected errors
}
```

### Server-Side

```typescript
export async function serverAction() {
  try {
    // Business logic
    return { success: true, data };
  } catch (error) {
    console.error('Error:', error);
    return { success: false, message: 'Error message' };
  }
}
```

## Testing Strategy

### Unit Tests
- Jest for utilities and helpers
- Testing Library for components

### Integration Tests
- API route testing
- Database operations

### E2E Tests
- Playwright for user flows
- Critical path testing

## Deployment

### Production Checklist

- [ ] Set strong `NEXTAUTH_SECRET`
- [ ] Configure production database
- [ ] Set up Redis instance
- [ ] Configure email service
- [ ] Set up Cloudinary
- [ ] Configure environment variables
- [ ] Run database migrations
- [ ] Seed initial data
- [ ] Set up monitoring
- [ ] Configure backups

### Scaling Considerations

- **Horizontal Scaling**: Stateless app instances
- **Database**: Read replicas for scaling reads
- **Redis**: Redis Cluster for high availability
- **CDN**: Static asset distribution
- **Load Balancer**: Distribute traffic

## Security Best Practices

1. **Environment Variables**: Never commit secrets
2. **Input Validation**: Always validate user input
3. **SQL Injection**: Prevented by Prisma ORM
4. **XSS**: React escapes by default
5. **CSRF**: NextAuth.js protection
6. **Rate Limiting**: Implement for API routes
7. **HTTPS**: Always use in production
8. **Security Headers**: Configure in next.config.ts

## Future Enhancements

- [ ] WebSocket for real-time features
- [ ] Mobile app with React Native
- [ ] GraphQL API
- [ ] Elasticsearch for advanced search
- [ ] S3 for file storage
- [ ] Background jobs with BullMQ
- [ ] Monitoring with Sentry
- [ ] Analytics with Posthog
