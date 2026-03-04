namespace Studyzone.Application.Students;

public class StudentDto
{
    public string Id { get; set; } = string.Empty;
    public string AdmissionNumber { get; set; } = string.Empty;
    public string? UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? ClassId { get; set; }
    public string? ClassName { get; set; }
    public string? BatchId { get; set; }
    public string? BatchName { get; set; }
    public string? Section { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? GuardianName { get; set; }
    public string? GuardianPhone { get; set; }
    public string? GuardianEmail { get; set; }
    public string? Address { get; set; }
    public DateTime? JoinedAt { get; set; }
    public DateTime? LeftAt { get; set; }
    public string? SiblingGroupId { get; set; }
    public Dictionary<string, string>? CustomFields { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? AcademicYearId { get; set; }
    public string? AcademicYearName { get; set; }
    /// <summary>First month (1-12) from which fees are due for this enrollment. Null = not set.</summary>
    public int? FeePaymentStartMonth { get; set; }
}

public class CreateStudentRequest
{
    public string? AcademicYearId { get; set; }
    public string AdmissionNumber { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? ClassId { get; set; }
    public string? BatchId { get; set; }
    public string? Section { get; set; }
    public string? GuardianName { get; set; }
    public string? GuardianPhone { get; set; }
    public string? GuardianEmail { get; set; }
    public string? Address { get; set; }
    public string? SiblingGroupId { get; set; }
    public Dictionary<string, string>? CustomFields { get; set; }
    /// <summary>First month (1-12) from which fees are due. Null = not set.</summary>
    public int? FeePaymentStartMonth { get; set; }
}

public class UpdateStudentRequest
{
    public string? AcademicYearId { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? ClassId { get; set; }
    public string? BatchId { get; set; }
    public string? Section { get; set; }
    public string? GuardianName { get; set; }
    public string? GuardianPhone { get; set; }
    public string? GuardianEmail { get; set; }
    public string? Address { get; set; }
    public string? SiblingGroupId { get; set; }
    public Dictionary<string, string>? CustomFields { get; set; }
    /// <summary>First month (1-12) from which fees are due. Null = not set.</summary>
    public int? FeePaymentStartMonth { get; set; }
}

public class BulkPromoteRequest
{
    public IReadOnlyList<string> StudentIds { get; set; } = Array.Empty<string>();
    public string? TargetAcademicYearId { get; set; }
    public string TargetClassId { get; set; } = string.Empty;
    public string? TargetBatchId { get; set; }
    public string? TargetSection { get; set; }
    /// <summary>First month (1-12) from which fees are due for promoted enrollments. Null = not set.</summary>
    public int? TargetFeePaymentStartMonth { get; set; }
}
