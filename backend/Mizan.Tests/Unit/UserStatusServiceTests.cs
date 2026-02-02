using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Mizan.Application.Interfaces;
using Mizan.Domain.Entities;
using Moq;
using Xunit;

namespace Mizan.Tests.Unit;

public class UserStatusServiceTests
{
    private readonly Mock<IMizanDbContext> _mockContext;
    private readonly Mock<IMemoryCache> _mockCache;

    public UserStatusServiceTests()
    {
        _mockContext = new Mock<IMizanDbContext>();
        _mockCache = new Mock<IMemoryCache>();
    }

    [Fact]
    public async Task GetStatusAsync_ReturnsAllowedStatus_ForActiveVerifiedUser()
    {
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "test@example.com",
            EmailVerified = true,
            Banned = false,
            BanExpires = null
        };

        var mockDbSet = new Mock<DbSet<User>>();
        mockDbSet.Setup(d => d.FindAsync(It.IsAny<object[]>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(value: new ValueTask<User?>(user));

        _mockContext
            .Setup(c => c.Users)
            .Returns(mockDbSet.Object);

        var service = new UserStatusService(_mockContext.Object, _mockCache.Object);

        var result = await service.GetStatusAsync(userId);

        result.Exists.Should().BeTrue();
        result.EmailVerified.Should().BeTrue();
        result.IsBanned.Should().BeFalse();
        result.IsAllowed.Should().BeTrue();
    }

    [Fact]
    public async Task GetStatusAsync_ReturnsUnauthorized_ForBannedUser()
    {
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "banned@example.com",
            EmailVerified = true,
            Banned = true,
            BanExpires = DateTimeOffset.UtcNow.AddHours(1).DateTime
        };

        var mockDbSet = new Mock<DbSet<User>>();
        mockDbSet.Setup(d => d.FindAsync(It.IsAny<object[]>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(value: new ValueTask<User?>(user));

        _mockContext
            .Setup(c => c.Users)
            .Returns(mockDbSet.Object);

        var service = new UserStatusService(_mockContext.Object, _mockCache.Object);

        var result = await service.GetStatusAsync(userId);

        result.Exists.Should().BeTrue();
        result.EmailVerified.Should().BeTrue();
        result.IsBanned.Should().BeTrue();
        result.IsAllowed.Should().BeFalse();
    }

    [Fact]
    public async Task GetStatusAsync_ReturnsUnauthorized_ForBannedUser_WithExpiredBan()
    {
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "banned-expired@example.com",
            EmailVerified = true,
            Banned = true,
            BanExpires = DateTimeOffset.UtcNow.AddHours(-1).DateTime
        };

        var mockDbSet = new Mock<DbSet<User>>();
        mockDbSet.Setup(d => d.FindAsync(It.IsAny<object[]>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(value: new ValueTask<User?>(user));

        _mockContext
            .Setup(c => c.Users)
            .Returns(mockDbSet.Object);

        var service = new UserStatusService(_mockContext.Object, _mockCache.Object);

        var result = await service.GetStatusAsync(userId);

        result.Exists.Should().BeTrue();
        result.EmailVerified.Should().BeTrue();
        result.IsBanned.Should().BeFalse();
        result.IsAllowed.Should().BeFalse();
    }

    [Fact]
    public async Task GetStatusAsync_ReturnsUnauthorized_ForUnverifiedUser()
    {
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "unverified@example.com",
            EmailVerified = false,
            Banned = false
        };

        var mockDbSet = new Mock<DbSet<User>>();
        mockDbSet.Setup(d => d.FindAsync(It.IsAny<object[]>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(value: new ValueTask<User?>(user));

        _mockContext
            .Setup(c => c.Users)
            .Returns(mockDbSet.Object);

        var service = new UserStatusService(_mockContext.Object, _mockCache.Object);

        var result = await service.GetStatusAsync(userId);

        result.Exists.Should().BeTrue();
        result.EmailVerified.Should().BeFalse();
        result.IsBanned.Should().BeFalse();
        result.IsAllowed.Should().BeFalse();
    }

    [Fact]
    public async Task GetStatusAsync_ReturnsUnauthorized_ForNonExistentUser()
    {
        var userId = Guid.NewGuid();
        User? user = null;

        var mockDbSet = new Mock<DbSet<User>>();
        mockDbSet.Setup(d => d.FindAsync(It.IsAny<object[]>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(value: new ValueTask<User?>(user));

        _mockContext
            .Setup(c => c.Users)
            .Returns(mockDbSet.Object);

        var service = new UserStatusService(_mockContext.Object, _mockCache.Object);

        var result = await service.GetStatusAsync(userId);

        result.Exists.Should().BeFalse();
        result.EmailVerified.Should().BeFalse();
        result.IsBanned.Should().BeFalse();
        result.IsAllowed.Should().BeFalse();
    }

    [Fact]
    public async Task GetStatusAsync_CachesResult()
    {
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "test@example.com",
            EmailVerified = true,
            Banned = false
        };

        var mockDbSet = new Mock<DbSet<User>>();
        mockDbSet.Setup(d => d.FindAsync(It.IsAny<object[]>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(value: new ValueTask<User?>(user));

        _mockContext
            .Setup(c => c.Users)
            .Returns(mockDbSet.Object);

        var service = new UserStatusService(_mockContext.Object, _mockCache.Object);

        var status1 = await service.GetStatusAsync(userId);
        var status2 = await service.GetStatusAsync(userId);

        _mockCache.Verify(
            c => c.TryGetValue(userId, out It.Ref<object>.IsAny),
            Times.Once,
            "Status should be cached after first call");
    }

    [Fact]
    public async Task GetStatusAsync_UsesCachedResult_WhenAvailable()
    {
        var userId = Guid.NewGuid();
        var cachedStatus = new UserAccessStatus(true, true, false);
        object? cacheValue = cachedStatus;

        var mockDbSet = new Mock<DbSet<User>>();

        _mockCache
            .Setup(c => c.TryGetValue(userId, out cacheValue))
            .Returns(true);

        _mockContext
            .Setup(c => c.Users)
            .Returns(mockDbSet.Object);

        var service = new UserStatusService(_mockContext.Object, _mockCache.Object);

        var result = await service.GetStatusAsync(userId);

        result.Should().Be(cachedStatus);
        _mockDbSet.Verify(
            d => d.FindAsync(It.IsAny<object[]>(), It.IsAny<CancellationToken>()),
            Times.Never,
            "Should not query database when cache hit");
    }
}
