namespace Mizan.Domain.Entities;

/// <summary>
/// Session entity - MUST match frontend schema: frontend/db/schema.ts (sessions table)
/// ⚠️ When updating this entity, ensure frontend schema is updated first (source of truth)
/// After changes, create migration: dotnet ef migrations add <Name> --project ../Mizan.Infrastructure --startup-project ../Mizan.Api
/// </summary>
public class Session
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public Guid? ImpersonatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation property
    public virtual User User { get; set; } = null!;
}
