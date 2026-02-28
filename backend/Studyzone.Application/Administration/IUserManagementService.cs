namespace Studyzone.Application.Administration;

public interface IUserManagementService
{
    Task<UserDto?> GetByIdAsync(string id, CancellationToken ct = default);
    Task<IReadOnlyList<UserDto>> GetAllAsync(string? roleFilter, CancellationToken ct = default);
    Task<UserDto> CreateAsync(CreateUserRequest request, CancellationToken ct = default);
    Task<UserDto> UpdateAsync(string id, UpdateUserRequest request, CancellationToken ct = default);
    Task ResetPasswordAsync(string id, ResetPasswordRequest request, CancellationToken ct = default);
}
