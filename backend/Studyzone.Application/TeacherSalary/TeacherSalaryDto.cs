namespace Studyzone.Application.TeacherSalary;

public class TeacherSalaryDto
{
    public string Id { get; set; } = string.Empty;
    public string TeacherUserId { get; set; } = string.Empty;
    public string? TeacherName { get; set; }
    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public decimal Amount { get; set; }
    public string PayFrequency { get; set; } = "Monthly";
    public string Currency { get; set; } = "INR";
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateTeacherSalaryRequest
{
    public string TeacherUserId { get; set; } = string.Empty;
    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public decimal Amount { get; set; }
    public string PayFrequency { get; set; } = "Monthly";
    public string Currency { get; set; } = "INR";
    public string? Notes { get; set; }
}

public class UpdateTeacherSalaryRequest
{
    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public decimal Amount { get; set; }
    public string PayFrequency { get; set; } = "Monthly";
    public string Currency { get; set; } = "INR";
    public string? Notes { get; set; }
}
