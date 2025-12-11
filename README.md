# MacroChef - Meal Planning, Nutrition & Fitness Tracking Application

MacroChef is a comprehensive web application for meal planning, recipe management, and nutrition tracking. It helps users plan their meals, organize shopping lists, and track their nutritional intake.

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

## Technical Features

- **Modern UI**: Built with Next.js, React, and Tailwind CSS
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Server-Side Rendering**: Fast load times and SEO-friendly pages
- **Authentication**: Secure user accounts and data privacy
- **Data Persistence**: MongoDB integration for data storage
- **Real-time Updates**: Dynamic data loading when navigating between weeks
- **Workout & Body Data**: Persistent storage and analytics for workouts and body composition
- **Gamification Engine**: Achievement and badge system for nutrition and fitness
- **Social & Sharing**: Share progress, goals, and achievements with others
- **Trainer Permissions**: Role-based access for trainers/coaches, with secure data sharing
- **In-app Chat**: Real-time messaging between users and trainers

## Getting Started

### Prerequisites
- Docker and Docker Compose
- .NET 10.0 SDK (for local development outside Docker)
- Node.js 20.x or higher (for local development outside Docker)

### Installation with Docker Compose (Recommended)

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/macro_chef.git
   cd macro_chef
   ```

2. Create a `.env` file in the root directory (optional - uses defaults if not provided):
   ```bash
   DB_PASSWORD=your_secure_password
   BETTER_AUTH_SECRET=your_secret_key
   OPENAI_API_KEY=your_openai_key
   ```

3. Start all services
   ```bash
   docker-compose up -d
   ```

4. The application will be available at:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - PostgreSQL: localhost:5432
   - Redis: localhost:6379

### Running Tests

#### Using Docker Compose (Recommended)
Run tests inside Docker where the test service has access to the PostgreSQL and Redis containers:

```bash
# Run tests once
docker-compose --profile test up test

# Run tests with live output
docker-compose --profile test up --attach test

# Run tests interactively (to pass additional arguments)
docker-compose run --rm test dotnet test --filter "Category=Integration"
```

The test service uses a separate test database (`mizan_test`) to avoid conflicts with the development database.

#### Running Tests Locally
If you want to run tests on your host machine (outside Docker), make sure docker-compose services are running first, then use:

```bash
cd backend
ConnectionStrings__PostgreSQL="Host=localhost;Database=mizan_test;Username=mizan;Password=mizan_dev_password" dotnet test
```

Note: When running locally, use `localhost` instead of `postgres` for the database host.

### Local Development without Docker

If you prefer to run services locally:

1. Install PostgreSQL 16 and Redis 7
2. Create database: `createdb mizan`
3. Update connection strings in `backend/Mizan.Api/appsettings.json`
4. Run backend:
   ```bash
   cd backend
   dotnet run --project Mizan.Api
   ```
5. Run frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Architecture

- **Frontend**: Next.js 15 with TypeScript, Tailwind CSS, and BetterAuth for authentication
- **Backend**: .NET 10 Web API with Clean Architecture (Domain, Application, Infrastructure, API layers)
- **Database**: PostgreSQL 16 with Entity Framework Core 10
- **Cache**: Redis 7 for SignalR backplane
- **Authentication**: JWT tokens with JWKS validation from BetterAuth

## License

This project is licensed under the MIT License.
