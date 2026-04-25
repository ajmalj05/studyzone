namespace Studyzone.Domain.Entities;

public class Exam
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "UnitTest"; // UnitTest, MidTerm, Final
    public Guid? ClassId { get; set; }
    public decimal? MaxMarks { get; set; }
    public DateTime? ExamDate { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ExamClass
{
    public Guid Id { get; set; }
    public Guid ExamId { get; set; }
    public Guid ClassId { get; set; }
    public Guid? BatchId { get; set; }
}
