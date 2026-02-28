namespace Studyzone.Application.ParentPortal;

public class ParentWithLinksDto
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public IReadOnlyList<LinkedStudentDto> LinkedStudents { get; set; } = Array.Empty<LinkedStudentDto>();
}

public class LinkedStudentDto
{
    public string StudentId { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string? AdmissionNumber { get; set; }
    public string? ClassName { get; set; }
}

public class LinkStudentRequest
{
    public string ParentUserId { get; set; } = string.Empty; // User.Id (Guid) of the parent
    public string StudentId { get; set; } = string.Empty;
}
