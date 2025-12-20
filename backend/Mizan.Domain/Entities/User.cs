namespace Mizan.Domain.Entities;

/// <summary>
/// User entity - MUST match frontend schema: frontend/db/schema.ts (users table)
/// ⚠️ When updating this entity, ensure frontend schema is updated first (source of truth)
/// After changes, create migration: dotnet ef migrations add <Name> --project ../Mizan.Infrastructure --startup-project ../Mizan.Api
/// </summary>
public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public bool EmailVerified { get; set; }
    public string? Name { get; set; }
    public string? Image { get; set; }
    public string Role { get; set; } = "user";
    public bool Banned { get; set; } = false;
    public string? BanReason { get; set; }
    public DateTime? BanExpires { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public virtual ICollection<Account> Accounts { get; set; } = new List<Account>();
    public virtual ICollection<Session> Sessions { get; set; } = new List<Session>();
    public virtual ICollection<HouseholdMember> HouseholdMemberships { get; set; } = new List<HouseholdMember>();
    public virtual ICollection<Recipe> Recipes { get; set; } = new List<Recipe>();
    public virtual ICollection<FoodDiaryEntry> FoodDiaryEntries { get; set; } = new List<FoodDiaryEntry>();
    public virtual ICollection<Workout> Workouts { get; set; } = new List<Workout>();
    public virtual UserGoal? CurrentGoal { get; set; }
    public virtual ICollection<UserAchievement> Achievements { get; set; } = new List<UserAchievement>();
    public virtual ICollection<Streak> Streaks { get; set; } = new List<Streak>();
    public virtual ICollection<TrainerClientRelationship> TrainerRelationships { get; set; } = new List<TrainerClientRelationship>();
    public virtual ICollection<TrainerClientRelationship> ClientRelationships { get; set; } = new List<TrainerClientRelationship>();
}
