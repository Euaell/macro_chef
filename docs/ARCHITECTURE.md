# Mizan (ሚዛን) - Application Architecture

**Version:** 2.3
**Last Updated:** December 12, 2025

## Overview

Mizan is a comprehensive nutrition tracking and meal planning application that helps users achieve their health and fitness goals through personalized AI coaching. The name "Mizan" means "balance" in Amharic (ሚዛን), reflecting the app's core philosophy of balanced nutrition and wellness.

## Technology Stack

### Frontend
- **Framework:** Next.js 16.0.8 (App Router with Turbopack)
- **React:** 19.0.0-rc (Release Candidate)
- **Language:** TypeScript 5+
- **Styling:** Tailwind CSS
- **Icons:** Remixicon
- **Authentication:** Better Auth v1.x with JWT plugin
- **ORM:** Drizzle ORM
- **Database:** PostgreSQL (via Docker)

### Backend
- **Framework:** .NET 10 (ASP.NET Core)
- **Language:** C# 12
- **Database:** PostgreSQL 17
- **Containerization:** Docker & Docker Compose

### Infrastructure
- **Development:** Docker Compose for local development
- **Database:** PostgreSQL 17 in Docker
- **Frontend Server:** Next.js Dev Server (port 3000)
- **Backend API:** .NET API (port 5000)

## Architecture Principles

### 1. **Separation of Concerns**
- Frontend handles UI/UX and client-side state
- Backend handles business logic and data persistence
- Authentication handled by Better Auth (frontend) with JWT for backend communication

### 2. **API-First Design**
- RESTful API design
- JWT-based authentication for backend API calls
- Clear separation between public and authenticated endpoints

### 3. **Type Safety**
- TypeScript on frontend for compile-time safety
- C# on backend for strong typing
- Drizzle ORM for type-safe database queries

### 4. **Modern React Patterns**
- Server Components for static content
- Client Components for interactive features
- Server Actions for form submissions
- Optimistic UI updates where appropriate

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Next.js Frontend (Port 3000)                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  App Router (RSC + Client Components)                │   │
│  │  - Server Components: Static pages, layouts          │   │
│  │  - Client Components: Interactive features           │   │
│  │  - Server Actions: Form handling                     │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Better Auth                                         │   │
│  │  - Session management (cookies)                      │   │
│  │  - JWT token generation                              │   │
│  │  - Email verification                                │   │
│  │  - Social auth (Google, GitHub)                      │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Drizzle ORM (Auth Tables Only)                      │   │
│  │  - users, sessions, accounts, jwks                   │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ JWT Bearer Token
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              .NET Backend API (Port 5000)                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ASP.NET Core Web API                                │   │
│  │  - RESTful endpoints                                 │   │
│  │  - JWT validation                                    │   │
│  │  - Business logic                                    │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Entity Framework Core                               │   │
│  │  - Data models                                       │   │
│  │  - Database migrations                               │   │
│  │  - Repository pattern                                │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              PostgreSQL Database (Port 5432)                 │
│  - User data (via .NET)                                     │
│  - Auth data (via Drizzle)                                  │
│  - Meals, recipes, goals                                    │
│  - All application data                                     │
└─────────────────────────────────────────────────────────────┘
```

## Authentication Flow

### 1. **User Registration & Login**
```
User → Frontend → Better Auth → PostgreSQL (auth tables)
   ↓
Session Cookie Set → Browser
```

### 2. **API Authentication**
```
User → Frontend (with session) → Better Auth /api/auth/token → JWT
   ↓
Frontend → Backend API (with JWT Bearer token)
   ↓
Backend validates JWT → Access granted
```

### 3. **JWT Token Structure**
- **Issuer:** `http://localhost:3000` (BETTER_AUTH_URL)
- **Audience:** `mizan-api`
- **Expiration:** 15 minutes
- **Algorithm:** HS256 (symmetric)
- **Claims:** user ID, email, session info

## Database Schema

### Authentication Tables (Managed by Drizzle)
- **users:** User accounts, email, name, email verification status
- **sessions:** Active user sessions with expiry, IP, user agent
- **accounts:** OAuth provider accounts and password hashes
- **jwks:** JSON Web Key Sets for JWT signing

### Application Tables (Managed by .NET EF Core)
- **foods:** Food items with nutritional data
- **recipes:** User-created recipes
- **meals:** Food diary entries
- **user_goals:** Nutrition and fitness goals
- **meal_plans:** Planned meals
- **body_measurements:** Weight, measurements tracking
- **households:** Multi-user household support
- **streaks:** Daily logging streaks
- **achievements:** Gamification achievements

## Key Features

### 1. **Nutrition Tracking**
- Log meals with automatic nutritional calculation
- Track calories, protein, carbs, fat
- Daily totals and progress tracking
- Meal type categorization (breakfast, lunch, dinner, snack)

### 2. **Recipe Management**
- Create custom recipes
- Calculate nutrition per serving
- Share recipes with community
- Search and filter recipes

### 3. **Meal Planning**
- Weekly meal plans
- Automatic shopping lists
- Drag-and-drop meal scheduling
- Nutrition goals alignment

### 4. **AI Coaching**
- Personalized nutrition suggestions
- Goal-based recommendations
- Smart food substitutions
- Progress insights

### 5. **Goal Setting**
- Customizable calorie targets
- Macro targets (protein, carbs, fat)
- Weight loss/gain goals
- Progress tracking

### 6. **Social Features**
- Household/family accounts
- Recipe sharing
- Trainer-client relationships
- Achievement system

### 7. **Gamification**
- Daily logging streaks
- Achievement badges
- Progress milestones
- Motivation system

## Design Decisions

### 1. **Why Next.js 16?**
- Latest stable release with Turbopack for faster builds
- App Router for better performance with RSC
- Built-in API routes for Better Auth
- Native middleware support (proxy.ts)

### 2. **Why Better Auth?**
- TypeScript-first authentication library
- Built-in JWT support for backend integration
- Email verification out of the box
- Easy social auth integration
- Better DX than NextAuth.js v5

### 3. **Why Drizzle ORM?**
- Type-safe SQL queries
- Better TypeScript inference than Prisma
- Lightweight and fast
- SQL-first approach for control
- Great migration system

### 4. **Why .NET Backend?**
- High performance for API endpoints
- Strong typing with C#
- Excellent Entity Framework Core
- Mature ecosystem
- Easy Docker deployment

### 5. **Why JWT for Backend Auth?**
- Stateless authentication
- Works across different domains
- Industry standard
- Easy to validate on backend
- Scalable for microservices

### 6. **Why PostgreSQL?**
- ACID compliance for data integrity
- JSON support for flexible data
- Excellent performance
- Free and open source
- Great tooling support

## Performance Optimizations

### 1. **Server-Side Rendering**
- Static pages rendered on server
- Reduced client-side JavaScript
- Better SEO
- Faster initial page load

### 2. **Client-Side Data Fetching**
- Interactive features use client components
- Optimistic UI updates
- React Query for caching
- Automatic revalidation

### 3. **Image Optimization**
- Next.js Image component
- Automatic WebP conversion
- Lazy loading
- Responsive images

### 4. **Code Splitting**
- Automatic route-based splitting
- Dynamic imports for large components
- Reduced bundle size

### 5. **Database Optimization**
- Indexed foreign keys
- Efficient query patterns
- Connection pooling
- Prepared statements

## Security Considerations

### 1. **Authentication**
- Secure password hashing (bcrypt)
- Email verification required
- Session-based auth with secure cookies
- JWT for API authentication

### 2. **Authorization**
- Role-based access control
- User data isolation
- Household-level permissions
- API endpoint protection

### 3. **Data Protection**
- SQL injection prevention (parameterized queries)
- XSS protection (React automatic escaping)
- CSRF protection (SameSite cookies)
- HTTPS in production

### 4. **Privacy**
- User data encryption
- GDPR compliance
- Data deletion on account removal
- Privacy policy and terms of service

## Development Workflow

### 1. **Local Setup**
```bash
# Start backend and database
docker-compose up -d

# Install frontend dependencies
cd frontend && npm install

# Run frontend dev server
npm run dev
```

### 2. **Database Migrations**
```bash
# Frontend (Drizzle - Auth tables)
cd frontend
npx drizzle-kit generate
npx drizzle-kit push

# Backend (.NET - Application tables)
cd ../backend
dotnet ef migrations add MigrationName
dotnet ef database update
```

### 3. **Testing Strategy**
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical flows
- Manual testing for UI/UX

## Deployment Architecture

### Production (Planned)
```
┌─────────────────┐
│   Cloudflare    │  CDN & DDoS protection
└────────┬────────┘
         │
┌────────▼────────┐
│   Vercel/N      │  Frontend (Next.js)
└────────┬────────┘
         │
┌────────▼────────┐
│  Railway/Render │  Backend (.NET)
└────────┬────────┘
         │
┌────────▼────────┐
│   PostgreSQL    │  Database (Managed)
└─────────────────┘
```

## Future Enhancements

### Phase 1 (Current)
- ✅ User authentication
- ✅ Basic nutrition tracking
- ✅ Recipe management
- ⏳ Meal planning
- ⏳ Goal setting

### Phase 2
- Water intake tracking
- Streak system
- Achievement badges
- Social features (recipe sharing)

### Phase 3
- AI-powered suggestions
- Barcode scanning
- Restaurant menu integration
- Meal prep calculator

### Phase 4
- Mobile app (React Native)
- Wearable device integration
- Advanced analytics
- Trainer dashboard

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on:
- Code style
- Pull request process
- Testing requirements
- Documentation standards

## License

This project is proprietary and confidential.

---

**Maintainer:** MacroChef Team
**Documentation Version:** 2.3
**Last Updated:** December 12, 2025
