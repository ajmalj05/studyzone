namespace Studyzone.Application.Exams;

public class ExamDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string? ClassId { get; set; }
    public string? ClassName { get; set; }
    public List<string> ClassIds { get; set; } = new();
    public List<string> ClassNames { get; set; } = new();
    public List<string> ClassWideClassIds { get; set; } = new();
    public List<string> BatchIds { get; set; } = new();
    public List<string> BatchNames { get; set; } = new();
    public decimal? MaxMarks { get; set; }
    public DateTime? ExamDate { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateExamRequest
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "UnitTest";
    public string? ClassId { get; set; }
    public List<string>? ClassIds { get; set; }
    public List<string>? BatchIds { get; set; }
    public decimal? MaxMarks { get; set; }
    public DateTime? ExamDate { get; set; }
}

public class UpdateExamDateRequest
{
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
    public string Status { get; set; } = string.Empty;
    public DateTime? ApprovedAt { get; set; }
    public string? ApprovedByUserId { get; set; }
    public string? RejectionReason { get; set; }
}

public class RejectMarksEntryRequest
{
    public string? Reason { get; set; }
}

public class SaveMarksRequest
{
    public string ExamId { get; set; } = string.Empty;
    public string StudentId { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public decimal MarksObtained { get; set; }
    public decimal MaxMarks { get; set; }
}
