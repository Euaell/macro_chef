namespace Mizan.Domain.Entities;

public class Session
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation property
    public virtual User User { get; set; } = null!;
}
