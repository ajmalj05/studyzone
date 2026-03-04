namespace Studyzone.Domain.Entities;

public class StudentEnrollment
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public Student Student { get; set; } = null!;
    public Guid AcademicYearId { get; set; }
    public AcademicYear AcademicYear { get; set; } = null!;
    public Guid? ClassId { get; set; }
    public Guid? BatchId { get; set; }
    public string? Section { get; set; }
    public string Status { get; set; } = "Active";
    public string AdmissionNumber { get; set; } = string.Empty;
    public DateTime? JoinedAt { get; set; }
    public DateTime? LeftAt { get; set; }
    /// <summary>First month (1-12) from which fees are due for this enrollment. Null = not set.</summary>
    public int? FeePaymentStartMonth { get; set; }
    /// <summary>First year from which fees are due (e.g. 2024). Null = not set.</summary>
    public int? FeePaymentStartYear { get; set; }
    public DateTime CreatedAt { get; set; }
}
