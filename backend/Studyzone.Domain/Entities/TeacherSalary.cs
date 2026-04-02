namespace Studyzone.Domain.Entities;

public class TeacherSalary
{
    public Guid Id { get; set; }
    public Guid TeacherUserId { get; set; }
    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public decimal Amount { get; set; }
    public string PayFrequency { get; set; } = "Monthly"; // Monthly, Weekly, etc.
    public string Currency { get; set; } = "AED";
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
