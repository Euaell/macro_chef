namespace Mizan.Domain.Entities;

/// <summary>
/// Jwk entity - MUST match frontend schema: frontend/db/schema.ts (jwks table)
/// ⚠️ When updating this entity, ensure frontend schema is updated first (source of truth)
/// After changes, create migration: dotnet ef migrations add <Name> --project ../Mizan.Infrastructure --startup-project ../Mizan.Api
/// </summary>
public class Jwk
{
    public string Id { get; set; } = string.Empty;
    public string PublicKey { get; set; } = string.Empty;
    public string PrivateKey { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
