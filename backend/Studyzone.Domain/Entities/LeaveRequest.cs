namespace Studyzone.Domain.Entities;

public class LeaveRequest
{
    public Guid Id { get; set; }
    public Guid TeacherUserId { get; set; }
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public string LeaveType { get; set; } = "Casual"; // Casual, Medical, Emergency
    public string? Reason { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected
    public Guid? ApprovedByUserId { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? RejectionReason { get; set; }
    public DateTime CreatedAt { get; set; }
}
