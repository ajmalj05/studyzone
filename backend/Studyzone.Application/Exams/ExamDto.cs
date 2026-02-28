namespace Studyzone.Application.Exams;

public class ExamDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string? ClassId { get; set; }
    public string? ClassName { get; set; }
    public DateTime? ExamDate { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateExamRequest
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "UnitTest";
    public string? ClassId { get; set; }
    public DateTime? ExamDate { get; set; }
}

public class MarksEntryDto
{
    public string Id { get; set; } = string.Empty;
    public string ExamId { get; set; } = string.Empty;
    public string StudentId { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public decimal MarksObtained { get; set; }
    public decimal MaxMarks { get; set; }
}

public class SaveMarksRequest
{
    public string ExamId { get; set; } = string.Empty;
    public string StudentId { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public decimal MarksObtained { get; set; }
    public decimal MaxMarks { get; set; }
}
