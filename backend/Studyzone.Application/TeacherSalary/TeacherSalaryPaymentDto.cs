namespace Studyzone.Application.TeacherSalary;

public class TeacherSalaryPaymentDto
{
    public string Id { get; set; } = string.Empty;
    public string TeacherUserId { get; set; } = string.Empty;
    public string? TeacherName { get; set; }
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
    public IReadOnlyList<TeacherSalaryPaymentLineDto> Lines { get; set; } = Array.Empty<TeacherSalaryPaymentLineDto>();
}

public class TeacherSalaryPaymentLineDto
{
    public string Id { get; set; } = string.Empty;
    public string LineType { get; set; } = "Deduction";
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}

public class CreateTeacherSalaryPaymentRequest
{
    public string? TeacherUserId { get; set; }
    public int Year { get; set; }
    public int Month { get; set; }
}

public class UpdateTeacherSalaryPaymentRequest
{
    public string? Status { get; set; }
    public DateTime? PaidAt { get; set; }
    public string? Notes { get; set; }
}

public class AddTeacherSalaryPaymentLineRequest
{
    public string LineType { get; set; } = "Deduction"; // Deduction, Addition
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}

public class UpdateTeacherSalaryPaymentLineRequest
{
    public string LineType { get; set; } = "Deduction";
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}
