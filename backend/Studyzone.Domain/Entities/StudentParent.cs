namespace Studyzone.Domain.Entities;

/// <summary>Links a parent user to a student (many-to-many: one parent can have multiple children, one student can have multiple parent accounts).</summary>
public class StudentParent
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public Guid ParentUserId { get; set; }
    public bool IsPrimary { get; set; }
    public DateTime CreatedAt { get; set; }
}
