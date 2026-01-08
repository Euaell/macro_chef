# MCP Integration Guide

**Last Updated:** 2026-01-07
**Status:** In Development
**Version:** 1.0.0

## Overview

MacroChef provides a Model Context Protocol (MCP) server that allows AI assistants like Claude to directly interact with your nutrition tracking, meal planning, and recipe management data. This enables natural language interactions for logging meals, searching ingredients, managing recipes, and tracking nutrition goals.

## Table of Contents

- [What is MCP?](#what-is-mcp)
- [Architecture](#architecture)
- [User Setup Guide](#user-setup-guide)
- [Available MCP Tools](#available-mcp-tools)
- [Security](#security)
- [Development Guide](#development-guide)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## What is MCP?

The Model Context Protocol (MCP) is an open standard that enables secure, controlled interactions between AI assistants and external data sources. Instead of copying data or using complex APIs, Claude can directly query and modify your MacroChef data using natural language.

**Example interactions:**
- "Show me my meals for today"
- "Add chicken breast to my ingredients"
- "Create a new recipe using the ingredients I have"
- "Log 2 servings of pasta for dinner"
- "What's my protein intake this week?"

## Architecture

### Components

```
┌─────────────────────┐
│ Claude for Desktop  │
└──────────┬──────────┘
           │ HTTP/SSE (Token in headers)
           ▼
┌─────────────────────────────────────┐
│  Mizan MCP Server (Docker)          │
│  - ASP.NET Core Web API             │
│  - Port: 5001                       │
│  - SSE Transport                    │
│  - Token Authentication             │
│  - Serilog Logging                  │
└──────────┬──────────────────────────┘
           │ PostgreSQL queries
           ▼
┌─────────────────────┐
│   PostgreSQL DB     │
│   - mcp_tokens      │
│   - foods, recipes  │
│   - meals, etc.     │
└─────────────────────┘
```

### Authentication Flow

1. User generates MCP token via web UI
2. Token stored as SHA256 hash in database
3. User configures Claude for Desktop with token
4. MCP server validates token on each request
5. UserId cached for duration of request
6. Tools execute with authenticated user context

### Transport Protocol

- **Protocol:** Server-Sent Events (SSE) over HTTP
- **Port:** 5001 (configurable)
- **Authentication:** Bearer token in Authorization header
- **Logging:** Serilog to Docker volume (`/app/logs`)

## User Setup Guide

### Step 1: Generate MCP Token

1. Log into MacroChef web interface
2. Navigate to **Profile → MCP Integration**
3. Click **"Generate New MCP Token"**
4. Enter a descriptive name (e.g., "Home Laptop", "Work PC")
5. Copy the generated token (shown only once!)

### Step 2: Configure Claude for Desktop

1. Locate your Claude configuration file:
   - **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

2. Add the following configuration:

**For local development:**
```json
{
  "mcpServers": {
    "mizan": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sse",
        "http://localhost:5001/mcp"
      ],
      "env": {
        "AUTHORIZATION": "Bearer mcp_your_token_here"
      }
    }
  }
}
```

**For production:**
```json
{
  "mcpServers": {
    "mizan": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sse",
        "https://mcp.yourdomain.com/mcp"
      ],
      "env": {
        "AUTHORIZATION": "Bearer mcp_your_token_here"
      }
    }
  }
}
```

3. Save the file and **fully restart** Claude for Desktop
   - **Windows:** Right-click system tray icon → Quit
   - **macOS:** Cmd+Q or Menu → Quit

### Step 3: Test the Connection

Open Claude for Desktop and try these commands:
- "List my ingredients"
- "Show my recipes"
- "What did I eat today?"

You should see Claude use the MCP tools to fetch your data.

## Available MCP Tools

### 1. list_ingredients

Search and list available food ingredients.

**Parameters:**
- `searchTerm` (optional): Filter by name
- `includePublic` (optional, default: true): Include public ingredients database

**Example:**
```
User: "Show me all chicken ingredients"
Claude: [Uses list_ingredients with searchTerm="chicken"]
```

### 2. add_ingredient

Create a new food ingredient (private or public).

**Parameters:**
- `name` (required): Ingredient name
- `servingSize` (required): Default serving size
- `servingUnit` (required): Unit (g, ml, oz, etc.)
- `caloriesPer100g` (required): Calories per 100g
- `proteinPer100g` (required): Protein grams per 100g
- `carbsPer100g` (required): Carbs grams per 100g
- `fatPer100g` (required): Fat grams per 100g
- `brand` (optional): Brand name
- `barcode` (optional): Product barcode
- `isPublic` (optional, default: false): Make publicly available

**Example:**
```
User: "Add a new ingredient: Organic Chicken Breast, 150g serving, 165 cal, 31g protein, 0g carbs, 3.6g fat"
Claude: [Uses add_ingredient with provided values]
```

### 3. get_shopping_list

Retrieve shopping list with items and optional pricing.

**Parameters:**
- `includeCompleted` (optional, default: false): Include checked-off items

**Example:**
```
User: "What's on my shopping list?"
Claude: [Uses get_shopping_list]
```

### 4. get_nutrition_tracking

Get nutrition and body measurement data for a date range.

**Parameters:**
- `startDate` (required): Start date (YYYY-MM-DD)
- `endDate` (required): End date (YYYY-MM-DD)
- `includeBodyMeasurements` (optional, default: true): Include weight, body fat, etc.

**Example:**
```
User: "Show my nutrition for the last 7 days"
Claude: [Uses get_nutrition_tracking with date range]
```

### 5. list_recipes

Search and list recipes (public, private, or household).

**Parameters:**
- `searchTerm` (optional): Filter by title/description
- `tags` (optional): Filter by tags
- `includePublic` (optional, default: true): Include public recipes
- `favoritesOnly` (optional, default: false): Show only favorites

**Example:**
```
User: "Find high-protein breakfast recipes"
Claude: [Uses list_recipes with searchTerm="breakfast" and tags=["high-protein"]]
```

### 6. add_recipe

Create a new recipe from ingredients.

**Parameters:**
- `title` (required): Recipe name
- `description` (optional): Recipe description
- `servings` (required): Number of servings
- `prepTimeMinutes` (optional): Prep time
- `cookTimeMinutes` (optional): Cook time
- `ingredients` (required): Array of {foodId, quantity, unit}
- `instructions` (required): Array of {stepNumber, instruction}
- `isPublic` (optional, default: false): Make publicly available
- `tags` (optional): Array of tag strings

**Example:**
```
User: "Create a recipe called 'Protein Pancakes' with 3 eggs, 1 cup oats, and 1 scoop protein powder"
Claude: [Uses add_recipe with ingredients and basic instructions]
```

### 7. log_meal

Log a food diary entry.

**Parameters:**
- `mealType` (required): "breakfast", "lunch", "dinner", or "snack"
- `foodId` (optional): Food ingredient ID
- `recipeId` (optional): Recipe ID
- `servings` (required): Number of servings
- `entryDate` (optional, default: today): Date (YYYY-MM-DD)
- `name` (optional): Custom name if no foodId/recipeId

**Example:**
```
User: "Log 2 servings of chicken breast for dinner"
Claude: [Uses list_ingredients to find chicken breast, then log_meal]
```

## Security

### Token Management

**Token Format:**
- Prefix: `mcp_`
- Length: 68 characters (mcp_ + 64 random chars)
- Example: `mcp_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6A7B8C9D0E1F2G3`

**Storage:**
- Frontend: Never stored (shown once)
- Backend: SHA256 hash only
- Database: Indexed on `token_hash` for fast lookup

**Validation:**
- Token must start with `mcp_` prefix
- Token must be exactly 68 characters
- Hash must exist in `mcp_tokens` table
- `is_active` must be `true`
- `expires_at` must be null or future date
- Updates `last_used_at` timestamp on successful validation

**Revocation:**
- User can revoke tokens from UI
- Sets `is_active = false` in database
- MCP server returns 401 Unauthorized on next request
- User must generate new token

**Best Practices:**
- Generate separate tokens for each device/location
- Use descriptive names ("Home Laptop", "Work Desktop")
- Revoke tokens immediately if device is lost/stolen
- Set expiration dates for shared environments
- Monitor `last_used_at` for suspicious activity

### Rate Limiting

**Planned (not yet implemented):**
- 100 requests per minute per token
- 1000 requests per hour per token
- Exponential backoff on repeated failures

### Audit Logging

All MCP tool executions are logged with:
- Timestamp
- User ID
- Tool name
- Parameters (sanitized)
- Execution time
- Success/failure status

Logs stored in Docker volume: `/app/logs/mcp-YYYY-MM-DD.log`

## Development Guide

### Project Structure

```
backend/Mizan.Mcp.Server/
├── Program.cs                          # ASP.NET Core host with SSE
├── Middleware/
│   └── TokenAuthenticationMiddleware.cs # Token validation
├── Services/
│   ├── TokenAuthService.cs             # Token hashing & validation
│   └── McpUserContext.cs               # User context provider
├── Tools/
│   ├── IngredientTools.cs              # Food/ingredient tools
│   ├── RecipeTools.cs                  # Recipe management tools
│   ├── MealTools.cs                    # Meal logging tools
│   ├── ShoppingTools.cs                # Shopping list tools
│   └── TrackingTools.cs                # Nutrition tracking tools
├── Dockerfile
├── appsettings.json
└── appsettings.Production.json

backend/Mizan.Mcp.Tests/
├── ToolTests/                          # Unit tests for tools
├── Integration/                        # Integration tests
└── Mizan.Mcp.Tests.csproj
```

### Adding a New MCP Tool

1. **Create tool method in appropriate Tools class:**

```csharp
[McpServerTool, Description("Get user's favorite recipes")]
public static async Task<string> GetFavoriteRecipes(
    IMediator mediator,
    ICurrentUserService currentUser,
    [Description("Maximum number of recipes to return")] int limit = 10)
{
    var query = new GetRecipesQuery
    {
        FavoritesOnly = true,
        PageSize = limit
    };

    var result = await mediator.Send(query);

    // Format result as string for Claude
    return FormatRecipes(result.Recipes);
}
```

2. **Add unit test:**

```csharp
[Fact]
public async Task GetFavoriteRecipes_ReturnsUserFavorites()
{
    // Arrange
    var mediatorMock = new Mock<IMediator>();
    mediatorMock
        .Setup(m => m.Send(It.IsAny<GetRecipesQuery>(), default))
        .ReturnsAsync(new GetRecipesResult { Recipes = TestData.FavoriteRecipes });

    // Act
    var result = await RecipeTools.GetFavoriteRecipes(mediatorMock.Object, 5);

    // Assert
    result.Should().Contain("Protein Pancakes");
}
```

3. **Tools are auto-registered** via `WithToolsFromAssembly()` in `Program.cs`

### Running Locally

**MCP Server only:**
```bash
cd backend/Mizan.Mcp.Server
dotnet run
```

**Full stack with Docker:**
```bash
docker-compose up -d
# MCP server available at http://localhost:5001
```

**Running tests:**
```bash
cd backend/Mizan.Mcp.Tests
dotnet test
```

### Environment Variables

**Development (`appsettings.Development.json`):**
```json
{
  "ConnectionStrings": {
    "PostgreSQL": "Host=localhost;Port=5432;Database=mizan;Username=mizan;Password=mizan_dev_password"
  },
  "Serilog": {
    "MinimumLevel": {
      "Default": "Debug"
    }
  }
}
```

**Production (`docker-compose.yml`):**
```yaml
environment:
  - ASPNETCORE_ENVIRONMENT=Production
  - ASPNETCORE_URLS=http://+:8080
  - ConnectionStrings__PostgreSQL=Host=postgres;Port=5432;Database=mizan;Username=mizan;Password=${POSTGRES_PASSWORD}
```

## Deployment

### Docker Deployment

**Build and deploy:**
```bash
# Build MCP server image
docker-compose build mizan-mcp

# Start MCP server
docker-compose up -d mizan-mcp

# Check health
curl http://localhost:5001/health

# View logs
docker logs -f mizan-mcp
```

### Production Checklist

- [ ] Set `ASPNETCORE_ENVIRONMENT=Production`
- [ ] Use strong PostgreSQL password
- [ ] Configure HTTPS/SSL termination (nginx/Traefik)
- [ ] Set up log rotation (30 days retention)
- [ ] Monitor Docker volume disk usage
- [ ] Configure firewall rules (only allow from trusted IPs if self-hosted)
- [ ] Set up health check monitoring
- [ ] Configure backup for `mcp_tokens` table

### Reverse Proxy Configuration (Optional)

**Nginx example:**
```nginx
server {
    listen 443 ssl http2;
    server_name mcp.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/mcp.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mcp.yourdomain.com/privkey.pem;

    location /mcp {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # SSE requires these
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400;
    }

    location /health {
        proxy_pass http://localhost:5001;
        access_log off;
    }
}
```

## Troubleshooting

### Claude for Desktop Not Connecting

**Symptoms:**
- "Unable to connect to MCP server" error
- Tools not showing in Claude

**Solutions:**
1. Verify MCP server is running:
   ```bash
   curl http://localhost:5001/health
   # Should return: Healthy
   ```

2. Check Claude config syntax:
   ```bash
   # Validate JSON
   cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | jq .
   ```

3. Verify token format:
   - Must start with `mcp_`
   - Must be exactly 68 characters
   - No extra spaces or newlines

4. Check MCP server logs:
   ```bash
   docker logs -f mizan-mcp
   # Look for "Token validated for user X" messages
   ```

5. Fully restart Claude for Desktop:
   - Don't just close the window
   - macOS: Cmd+Q
   - Windows: Right-click tray icon → Quit

### Token Validation Errors

**401 Unauthorized:**
- Token expired or revoked
- Token hash not found in database
- Malformed token

**Fix:**
1. Generate new token from UI
2. Update Claude config with new token
3. Restart Claude for Desktop

### MCP Server Crashes

**Check logs:**
```bash
# Docker logs
docker logs mizan-mcp

# Log files
docker exec mizan-mcp cat /app/logs/mcp-$(date +%Y-%m-%d).log
```

**Common causes:**
- Database connection failure → Check PostgreSQL is running
- Migration not applied → Run `dotnet ef database update`
- Out of memory → Increase Docker memory limit

### Tools Returning Errors

**Enable debug logging:**
```json
// appsettings.Development.json
{
  "Serilog": {
    "MinimumLevel": {
      "Default": "Debug",
      "Override": {
        "Mizan.Mcp.Server": "Trace"
      }
    }
  }
}
```

**Check MediatR handler execution:**
- Ensure Commands/Queries exist in Mizan.Application
- Verify user has permission to access data
- Check database constraints (foreign keys, etc.)

### Performance Issues

**Slow tool responses:**
1. Check database query performance
2. Add indexes to frequently queried columns
3. Enable Redis caching for read-heavy queries
4. Monitor `execution_time_ms` in logs

**High memory usage:**
- Check for N+1 query problems
- Use `.Include()` for eager loading
- Implement pagination for large result sets

## Monitoring

### Health Checks

**Endpoint:** `GET /health`

**Returns:**
```json
{
  "status": "Healthy",
  "checks": {
    "database": "Healthy"
  }
}
```

**Monitoring with uptime tools:**
```bash
# Uptime Kuma, Healthchecks.io, etc.
curl -f http://localhost:5001/health || exit 1
```

### Metrics (Planned)

Future enhancements will include:
- Prometheus metrics endpoint
- Token usage statistics
- Tool execution times
- Error rates by tool
- Active connections count

## Roadmap

### v1.1 (Planned)
- [ ] Rate limiting per token
- [ ] Token usage analytics dashboard
- [ ] Webhook notifications for token usage
- [ ] Multi-tenant household support
- [ ] Bulk operations (batch meal logging)

### v1.2 (Planned)
- [ ] Prometheus metrics
- [ ] OpenTelemetry tracing
- [ ] GraphQL alternative endpoint
- [ ] WebSocket transport option
- [ ] Token scopes/permissions

### v2.0 (Future)
- [ ] AI meal suggestions via MCP
- [ ] Recipe generation from available ingredients
- [ ] Nutrition goal recommendations
- [ ] Shopping list price optimization
- [ ] Integration with fitness trackers

## Support

For issues or questions:
- GitHub Issues: [macro_chef/issues](https://github.com/yourusername/macro_chef/issues)
- Documentation: [docs/](../docs/)
- API Reference: [docs/API_REFERENCE.md](./API_REFERENCE.md)

## References

- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [MCP Server Development Guide](https://modelcontextprotocol.io/docs/develop/build-server)
- [Claude for Desktop MCP Configuration](https://modelcontextprotocol.io/quickstart)
- [MacroChef Architecture](./ARCHITECTURE.md)
- [Security Documentation](./SECURITY.md)
