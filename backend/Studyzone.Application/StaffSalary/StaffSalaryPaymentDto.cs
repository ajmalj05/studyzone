using System;
using System.Collections.Generic;

namespace Studyzone.Application.StaffSalary;

public class StaffSalaryPaymentDto
{
    public string Id { get; set; } = string.Empty;
    public string StaffUserId { get; set; } = string.Empty;
    public string? StaffName { get; set; }
    public int Year { get; set; }
    public int Month { get; set; }
    public decimal BaseAmount { get; set; }
    public decimal TotalAdditions { get; set; }
    public decimal TotalDeductions { get; set; }
    public decimal NetAmount { get; set; }
    public string Status { get; set; } = "Draft";
    public DateTime? PaidAt { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public IReadOnlyList<StaffSalaryPaymentLineDto> Lines { get; set; } = Array.Empty<StaffSalaryPaymentLineDto>();
}

public class StaffSalaryPaymentLineDto
{
    public string Id { get; set; } = string.Empty;
    public string LineType { get; set; } = "Deduction";
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}

public class CreateStaffSalaryPaymentRequest
{
    public string? StaffUserId { get; set; }
    public int Year { get; set; }
    public int Month { get; set; }
}

public class UpdateStaffSalaryPaymentRequest
{
    public string? Status { get; set; }
    public DateTime? PaidAt { get; set; }
    public string? Notes { get; set; }
}

public class AddStaffSalaryPaymentLineRequest
{
    public string LineType { get; set; } = "Deduction"; // Deduction, Addition
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}

public class UpdateStaffSalaryPaymentLineRequest
{
    public string LineType { get; set; } = "Deduction";
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}
