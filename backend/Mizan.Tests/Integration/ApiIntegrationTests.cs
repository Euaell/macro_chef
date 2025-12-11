using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Mizan.Application.Interfaces;
using Mizan.Domain.Entities;
using Mizan.Infrastructure.Data;
using Xunit;

namespace Mizan.Tests.Integration;

public class ApiIntegrationTests : IClassFixture<WebApplicationFactory<Program>>, IDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public ApiIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureTestServices(services =>
            {
                // Remove the existing DbContext registrations
                // ConfigureTestServices runs after all other service registrations
                // This is required for EF Core 10+ which doesn't allow multiple database providers
                var dbContextDescriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<MizanDbContext>));

                if (dbContextDescriptor != null)
                {
                    services.Remove(dbContextDescriptor);
                }

                var imizanDbContextDescriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(IMizanDbContext));

                if (imizanDbContextDescriptor != null)
                {
                    services.Remove(imizanDbContextDescriptor);
                }

                // Add in-memory database for testing
                services.AddDbContext<MizanDbContext>(options =>
                {
                    options.UseInMemoryDatabase("TestDb");
                });

                // Re-register IMizanDbContext interface
                services.AddScoped<IMizanDbContext>(provider => provider.GetRequiredService<MizanDbContext>());
            });
        });

        _client = _factory.CreateClient();

        // Seed test data after client creation
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MizanDbContext>();
        db.Database.EnsureCreated();
        SeedTestData(db);
    }

    private static void SeedTestData(MizanDbContext db)
    {
        db.Foods.AddRange(
            new Food
            {
                Id = Guid.NewGuid(),
                Name = "Chicken Breast",
                CaloriesPer100g = 165,
                ProteinPer100g = 31,
                CarbsPer100g = 0,
                FatPer100g = 3.6m,
                IsVerified = true
            },
            new Food
            {
                Id = Guid.NewGuid(),
                Name = "Brown Rice",
                CaloriesPer100g = 112,
                ProteinPer100g = 2.6m,
                CarbsPer100g = 24,
                FatPer100g = 0.9m,
                IsVerified = true
            }
        );

        db.SaveChanges();
    }

    [Fact]
    public async Task SearchFoods_ShouldReturnResults_WhenFoodsExist()
    {
        // Act
        var response = await _client.GetAsync("/api/foods/search?searchTerm=chicken");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<SearchFoodsResponse>();
        result.Should().NotBeNull();
        result!.Foods.Should().NotBeEmpty();
        result.Foods.Should().Contain(f => f.Name.Contains("Chicken", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task SearchFoods_ShouldReturnEmpty_WhenNoMatch()
    {
        // Act
        var response = await _client.GetAsync("/api/foods/search?searchTerm=nonexistent");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<SearchFoodsResponse>();
        result.Should().NotBeNull();
        result!.Foods.Should().BeEmpty();
    }

    [Fact]
    public async Task GetRecipes_ShouldReturnPublicRecipes_WhenNotAuthenticated()
    {
        // Act
        var response = await _client.GetAsync("/api/recipes");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<GetRecipesResponse>();
        result.Should().NotBeNull();
    }

    [Fact]
    public async Task LogFood_ShouldReturn401_WhenNotAuthenticated()
    {
        // Arrange
        var command = new
        {
            FoodId = Guid.NewGuid(),
            EntryDate = DateOnly.FromDateTime(DateTime.UtcNow),
            MealType = "lunch",
            Servings = 1
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/nutrition/log", command);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task HealthCheck_ShouldReturnHealthy()
    {
        // Act
        var response = await _client.GetAsync("/health");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    public void Dispose()
    {
        _client.Dispose();
    }
}

// Response DTOs for testing
public record SearchFoodsResponse
{
    public List<FoodResponse> Foods { get; init; } = new();
}

public record FoodResponse
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public int CaloriesPer100g { get; init; }
}

public record GetRecipesResponse
{
    public List<RecipeResponse> Recipes { get; init; } = new();
    public int TotalCount { get; init; }
}

public record RecipeResponse
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public bool IsPublic { get; init; }
}
