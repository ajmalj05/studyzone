using System;

namespace Studyzone.Application.StaffSalary;

public class StaffSalaryDto
{
    public string Id { get; set; } = string.Empty;
    public string StaffUserId { get; set; } = string.Empty;
    public string? StaffName { get; set; }
    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public decimal Amount { get; set; }
    public string PayFrequency { get; set; } = "Monthly";
    public string Currency { get; set; } = "AED";
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateStaffSalaryRequest
{
    public string StaffUserId { get; set; } = string.Empty;
    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public decimal Amount { get; set; }
    public string PayFrequency { get; set; } = "Monthly";
    public string Currency { get; set; } = "AED";
    public string? Notes { get; set; }
}

public class UpdateStaffSalaryRequest
{
    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public decimal Amount { get; set; }
    public string PayFrequency { get; set; } = "Monthly";
    public string Currency { get; set; } = "AED";
    public string? Notes { get; set; }
}
