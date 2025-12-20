namespace Mizan.Domain.Entities;

/// <summary>
/// Verification entity - MUST match frontend schema: frontend/db/schema.ts (verification table)
/// ⚠️ When updating this entity, ensure frontend schema is updated first (source of truth)
/// After changes, create migration: dotnet ef migrations add <Name> --project ../Mizan.Infrastructure --startup-project ../Mizan.Api
/// </summary>
public class Verification
{
    public Guid Id { get; set; }
    public string Identifier { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
