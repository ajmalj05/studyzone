namespace Studyzone.Domain.Entities;

public class RolePermission
{
    public Guid Id { get; set; }
    public Guid RoleId { get; set; }
    public Role Role { get; set; } = null!;
    public string PermissionKey { get; set; } = string.Empty;
}
