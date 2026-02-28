namespace Studyzone.Application.Administration;

public class RoleDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public IReadOnlyList<string> PermissionKeys { get; set; } = Array.Empty<string>();
}

public class CreateRoleRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public IReadOnlyList<string> PermissionKeys { get; set; } = Array.Empty<string>();
}

public class UpdateRoleRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public IReadOnlyList<string> PermissionKeys { get; set; } = Array.Empty<string>();
}
