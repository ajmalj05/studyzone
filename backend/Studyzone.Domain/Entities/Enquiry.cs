namespace Studyzone.Domain.Entities;

public class Enquiry
{
    public Guid Id { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string? GuardianName { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? ClassOfInterest { get; set; }
    public string? Source { get; set; } // Walk-in, Phone, Online
    public string Status { get; set; } = "New"; // New, Contacted, InterviewScheduled, Admitted, NotAdmitted
    public DateTime? FollowUpDate { get; set; }
    public string? Notes { get; set; }
    public Guid? AssignedToUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
