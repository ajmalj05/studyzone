namespace Studyzone.Domain.Entities;

public class Application
{
    public Guid Id { get; set; }
    public Guid? EnquiryId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public DateTime? DateOfBirth { get; set; }
    public string? PreviousSchool { get; set; }
    public string? GuardianName { get; set; }
    public string? GuardianPhone { get; set; }
    public string? GuardianEmail { get; set; }
    public string? SubjectsRequired { get; set; } // JSON or comma-separated
    public string? ClassApplied { get; set; }
    public string Status { get; set; } = "Draft"; // Draft, Submitted, InterviewScheduled, Approved, Rejected
    public DateTime? InterviewDate { get; set; }
    public string? InterviewNotes { get; set; }
    public string? AdmissionNumber { get; set; }
    public Guid? ClassId { get; set; }
    public Guid? BatchId { get; set; }
    public string? Batch { get; set; }
    public string? Section { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
