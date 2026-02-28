namespace Studyzone.Domain.Entities;

public class AdmissionApproval
{
    public Guid Id { get; set; }
    public Guid ApplicationId { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected
    public string? Reason { get; set; }
    public Guid? ApprovedByUserId { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
