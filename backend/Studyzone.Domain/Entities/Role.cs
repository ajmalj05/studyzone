namespace Studyzone.Domain.Entities;

public class Role
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }

    public ICollection<RolePermission> Permissions { get; set; } = new List<RolePermission>();
}
