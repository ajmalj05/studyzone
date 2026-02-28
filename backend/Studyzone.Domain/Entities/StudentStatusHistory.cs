namespace Studyzone.Domain.Entities;

public class StudentStatusHistory
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime EffectiveDate { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}
