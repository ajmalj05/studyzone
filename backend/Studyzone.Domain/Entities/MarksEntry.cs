namespace Studyzone.Domain.Entities;

public class MarksEntry
{
    public Guid Id { get; set; }
    public Guid ExamId { get; set; }
    public Guid StudentId { get; set; }
    public string Subject { get; set; } = string.Empty;
    public decimal MarksObtained { get; set; }
    public decimal MaxMarks { get; set; }
    public DateTime CreatedAt { get; set; }

    /// <summary>Pending (awaiting admin), Approved (visible to parents/students), Rejected.</summary>
    public string Status { get; set; } = MarksEntryStatuses.Pending;

    public DateTime? ApprovedAt { get; set; }
    public Guid? ApprovedByUserId { get; set; }
    public string? RejectionReason { get; set; }
}
