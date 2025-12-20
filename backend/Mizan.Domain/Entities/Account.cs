namespace Mizan.Domain.Entities;

/// <summary>
/// Account entity - MUST match frontend schema: frontend/db/schema.ts (accounts table)
/// ⚠️ When updating this entity, ensure frontend schema is updated first (source of truth)
/// After changes, create migration: dotnet ef migrations add <Name> --project ../Mizan.Infrastructure --startup-project ../Mizan.Api
/// </summary>
public class Account
{
    public Guid Id { get; set; }
    public string AccountId { get; set; } = string.Empty;
    public string ProviderId { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public string? AccessToken { get; set; }
    public string? RefreshToken { get; set; }
    public string? IdToken { get; set; }
    public DateTime? AccessTokenExpiresAt { get; set; }
    public DateTime? RefreshTokenExpiresAt { get; set; }
    public string? Scope { get; set; }
    public string? Password { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation property
    public virtual User User { get; set; } = null!;
}
