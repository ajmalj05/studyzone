namespace Studyzone.Application.Administration;

public interface IRoleService
{
    Task<RoleDto?> GetByIdAsync(string id, CancellationToken ct = default);
    Task<IReadOnlyList<RoleDto>> GetAllAsync(CancellationToken ct = default);
    Task<RoleDto> CreateAsync(CreateRoleRequest request, CancellationToken ct = default);
    Task<RoleDto> UpdateAsync(string id, UpdateRoleRequest request, CancellationToken ct = default);
    Task<IReadOnlyList<string>> GetAllPermissionKeysAsync(CancellationToken ct = default);
}
