namespace Studyzone.Domain.Entities;

public class Exam
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "UnitTest"; // UnitTest, MidTerm, Final
    public Guid? ClassId { get; set; }
    public DateTime? ExamDate { get; set; }
    public DateTime CreatedAt { get; set; }
}
