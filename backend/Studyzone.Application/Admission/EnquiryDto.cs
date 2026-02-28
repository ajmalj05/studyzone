namespace Studyzone.Application.Admission;

public class EnquiryDto
{
    public string Id { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string? GuardianName { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? ClassOfInterest { get; set; }
    public string? Source { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? FollowUpDate { get; set; }
    public string? Notes { get; set; }
    public string? AssignedToUserId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateEnquiryRequest
{
    public string StudentName { get; set; } = string.Empty;
    public string? GuardianName { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? ClassOfInterest { get; set; }
    public string? Source { get; set; }
    public string? Notes { get; set; }
    public DateTime? FollowUpDate { get; set; }
}

public class UpdateEnquiryRequest
{
    public string StudentName { get; set; } = string.Empty;
    public string? GuardianName { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? ClassOfInterest { get; set; }
    public string? Source { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? FollowUpDate { get; set; }
    public string? Notes { get; set; }
}
