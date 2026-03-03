namespace Studyzone.Domain.Entities;

public class Batch
{
    public Guid Id { get; set; }
    public Guid ClassId { get; set; }
    public Class Class { get; set; } = null!;
    public Guid AcademicYearId { get; set; }
    public AcademicYear AcademicYear { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public string? Section { get; set; }
    public int? SeatLimit { get; set; }
    public Guid? ClassTeacherUserId { get; set; }
    public DateTime CreatedAt { get; set; }
}
