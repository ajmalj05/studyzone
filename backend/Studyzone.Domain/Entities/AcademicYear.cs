namespace Studyzone.Domain.Entities;

public class AcademicYear
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsCurrent { get; set; }
    public bool IsArchived { get; set; }
    public DateTime CreatedAt { get; set; }
}
