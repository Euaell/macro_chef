namespace Mizan.Domain.Entities;

public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public bool EmailVerified { get; set; }
    public string? Name { get; set; }
    public string? Image { get; set; }
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
