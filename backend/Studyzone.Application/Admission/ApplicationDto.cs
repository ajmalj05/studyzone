namespace Studyzone.Application.Admission;

public class ApplicationDto
{
    public string Id { get; set; } = string.Empty;
    public string? EnquiryId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public DateTime? DateOfBirth { get; set; }
    public string? PreviousSchool { get; set; }
    public string? GuardianName { get; set; }
    public string? GuardianPhone { get; set; }
    public string? GuardianEmail { get; set; }
    public string? SubjectsRequired { get; set; }
    public string? ClassApplied { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? InterviewDate { get; set; }
    public string? InterviewNotes { get; set; }
    public string? AdmissionNumber { get; set; }
    public string? ClassId { get; set; }
    public string? Batch { get; set; }
    public string? BatchId { get; set; }
    public string? Section { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateApplicationRequest
{
    public string? EnquiryId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public DateTime? DateOfBirth { get; set; }
    public string? PreviousSchool { get; set; }
    public string? GuardianName { get; set; }
    public string? GuardianPhone { get; set; }
    public string? GuardianEmail { get; set; }
    public string? SubjectsRequired { get; set; }
    public string? ClassApplied { get; set; }
    public string? ClassId { get; set; }
    public string? BatchId { get; set; }
}

public class UpdateApplicationRequest
{
    public string StudentName { get; set; } = string.Empty;
    public DateTime? DateOfBirth { get; set; }
    public string? PreviousSchool { get; set; }
    public string? GuardianName { get; set; }
    public string? GuardianPhone { get; set; }
    public string? GuardianEmail { get; set; }
    public string? SubjectsRequired { get; set; }
    public string? ClassApplied { get; set; }
    public string? ClassId { get; set; }
    public string? BatchId { get; set; }
    public DateTime? InterviewDate { get; set; }
    public string? InterviewNotes { get; set; }
    public string? Batch { get; set; }
    public string? Section { get; set; }
}

public class SubmitForApprovalRequest
{
    public string? Batch { get; set; }
    public string? Section { get; set; }
}

public class ApprovalDecisionRequest
{
    public string Status { get; set; } = string.Empty; // Approved, Rejected
    public string? Reason { get; set; }
    public string? ClassId { get; set; }
    public string? BatchId { get; set; }
}
