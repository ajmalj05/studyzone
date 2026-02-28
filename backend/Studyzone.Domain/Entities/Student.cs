namespace Studyzone.Domain.Entities;

public class Student
{
    public Guid Id { get; set; }
    public string AdmissionNumber { get; set; } = string.Empty;
    public Guid? UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public Guid? ClassId { get; set; }
    public Guid? BatchId { get; set; }
    public string? Section { get; set; }
    public string Status { get; set; } = "Active"; // Active, Inactive, Transferred, Withdrawn, Alumni
    public string? GuardianName { get; set; }
    public string? GuardianPhone { get; set; }
    public string? GuardianEmail { get; set; }
    public string? Address { get; set; }
    public DateTime? JoinedAt { get; set; }
    public DateTime? LeftAt { get; set; }
    public Guid? SiblingGroupId { get; set; }
    public string? CustomFieldsJson { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
