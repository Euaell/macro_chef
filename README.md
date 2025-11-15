# MacroChef 2.0 - Meal Planning, Nutrition & Fitness Tracking Platform

MacroChef is a modern, full-stack web application for meal planning, recipe management, nutrition tracking, and fitness monitoring. Built with the latest technologies and best practices, it provides a comprehensive platform for managing your health and fitness journey.

## 🚀 Version 2.0 Highlights

- **PostgreSQL Database** for robust data integrity and advanced querying
- **Docker Support** for easy deployment and development
- **NextAuth.js v5** for secure, modern authentication
- **Redis Caching** for improved performance
- **Social Features** including followers, likes, comments, and collections
- **Gamification** with achievements and activity tracking
- **Modern UI** with Radix UI primitives and shadcn/ui components
- **Comprehensive Prisma ORM** with type-safe database access

## Features

### Recipe Management
- Create and store recipes with detailed nutritional information
- Search and filter recipes by name and ingredients
- View complete nutritional breakdown of each recipe

### Meal Planning
- Plan meals for each day of the week with an interactive calendar
- Add recipes to specific meal times (breakfast, lunch, dinner, snack)
- Adjust serving sizes for each planned meal
- Edit or remove planned meals as needed

### Shopping List
- Automatically generate shopping lists based on your meal plan
- View ingredients grouped by category
- Check off items as you shop
- Print shopping lists for offline use

### Nutrition Tracking
- Log daily meals and track nutritional intake
- View nutritional summaries by day and week
- Track calories, protein, carbs, fat, and fiber

### Workout Tracking
- Log and track workouts, exercises, and progress over time
- View workout history and performance analytics

### Body Composition Tracking
- Record and visualize body metrics (weight, body fat %, muscle mass, etc.)
- Track changes and trends with charts

### Gamification & Achievements
- Earn achievements for hitting nutrition and workout goals
- Set personal goals and milestones for both intake and exercise
- Unlock badges and rewards for consistency and progress

### Social Features
- Share your macro goals, achievements, and progress with friends or the community
- View and comment on others' achievements (privacy controls available)

### Trainer & Coaching
- Assign a trainer or coach to your account
- Grant trainers permission to view your progress, nutrition, and workouts
- In-app chat with trainers for advice and feedback
- Trainers can set goals, review progress, and provide personalized recommendations

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Recharts** - Data visualization
- **React Hook Form** - Form management
- **Zod** - Runtime validation

### Backend
- **PostgreSQL** - Relational database
- **Prisma** - Type-safe ORM
- **NextAuth.js v5** - Authentication
- **Redis** - Caching and sessions
- **Nodemailer** - Email service
- **OpenAI API** - AI-powered recipe suggestions

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration

## 🚀 Getting Started

### Prerequisites
- **Node.js 20.x** or higher
- **npm** or **yarn**
- **Docker** and **Docker Compose** (recommended)
- PostgreSQL (if not using Docker)
- Redis (if not using Docker)

### Quick Start with Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/Euaell/macro_chef.git
   cd macro_chef
   ```

2. **Copy environment variables**
   ```bash
   cp .env.example .env
   ```

3. **Update the `.env` file with your configuration**
   - Set `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)
   - Add your `OPENAI_API_KEY` for AI features
   - Add Cloudinary credentials for image uploads
   - Configure email settings for notifications

4. **Start the application with Docker**
   ```bash
   # Start all services (PostgreSQL, Redis, App)
   npm run docker:up

   # Or build and start
   npm run docker:build && npm run docker:up
   ```

5. **Run database migrations**
   ```bash
   # In a new terminal
   docker-compose exec app npx prisma migrate deploy

   # Seed the database with sample data
   docker-compose exec app npm run db:seed
   ```

6. **Access the application**
   - App: http://localhost:3000
   - Prisma Studio: http://localhost:5555 (run `docker-compose --profile tools up studio`)

### Local Development (Without Docker)

1. **Clone and install dependencies**
   ```bash
   git clone https://github.com/Euaell/macro_chef.git
   cd macro_chef
   npm install --legacy-peer-deps
   ```

2. **Set up PostgreSQL and Redis**
   ```bash
   # Using Docker for databases only
   docker-compose -f docker-compose.dev.yml up -d
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run database migrations and seed**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - App: http://localhost:3000
   - Prisma Studio: `npm run db:studio` (http://localhost:5555)

### Default Credentials (After Seeding)

- **Admin User**
  - Email: `admin@macrochef.com`
  - Password: `admin123`

- **Test User**
  - Email: `test@macrochef.com`
  - Password: `test123`

## 📦 Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run format           # Format code with Prettier

# Database
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run migrations (dev)
npm run db:migrate:deploy # Deploy migrations (prod)
npm run db:push          # Push schema changes
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio
npm run db:reset         # Reset database

# Docker
npm run docker:up        # Start Docker services
npm run docker:down      # Stop Docker services
npm run docker:build     # Build Docker images
npm run docker:logs      # View Docker logs
```

## 🗄️ Database Schema

The application uses a comprehensive PostgreSQL database schema managed by Prisma:

- **Users** - User accounts with authentication
- **Recipes** - User-created recipes with nutritional data
- **Ingredients** - Ingredient database
- **MealPlans** - Weekly meal planning
- **Meals** - Meal logging for tracking
- **Goals** - Macro targets and fitness goals
- **Workouts** - Exercise logging
- **BodyComposition** - Body metrics tracking
- **Achievements** - Gamification system
- **Social** - Followers, likes, comments, collections
- **Activities** - User activity feed

## 🔧 Configuration

### Environment Variables

See `.env.example` for all available configuration options:

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `NEXTAUTH_URL` - Application URL
- `NEXTAUTH_SECRET` - Authentication secret (32+ characters)
- `OPENAI_API_KEY` - For AI recipe suggestions
- `CLOUDINARY_*` - Image upload configuration
- `EMAIL_*` - SMTP email configuration

## 🐳 Docker Deployment

### Production Deployment

1. **Build the production image**
   ```bash
   docker-compose build
   ```

2. **Start services**
   ```bash
   docker-compose up -d
   ```

3. **Run migrations**
   ```bash
   docker-compose exec app npx prisma migrate deploy
   ```

### Docker Compose Services

- **db** - PostgreSQL 16 database
- **redis** - Redis 7 cache
- **app** - Next.js application
- **studio** - Prisma Studio (optional, use `--profile tools`)

## 📚 Development Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js v5 Documentation](https://authjs.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Radix UI](https://www.radix-ui.com/primitives)

## License

This project is licensed under the MIT License.
