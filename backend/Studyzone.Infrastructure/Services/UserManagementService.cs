using Studyzone.Application.Administration;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;

namespace Studyzone.Infrastructure.Services;

public class UserManagementService : IUserManagementService
{
    private readonly IUserRepository _userRepo;
    private readonly IAuditLogRepository _auditRepo;

    public UserManagementService(IUserRepository userRepo, IAuditLogRepository auditRepo)
    {
        _userRepo = userRepo;
        _auditRepo = auditRepo;
    }

    public async Task<UserDto?> GetByIdAsync(string id, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid)) return null;
        var u = await _userRepo.GetByIdAsync(guid, ct);
        return u == null ? null : Map(u);
    }

    public async Task<IReadOnlyList<UserDto>> GetAllAsync(string? roleFilter, CancellationToken ct = default)
    {
        var list = await _userRepo.GetAllAsync(roleFilter, ct);
        return list.Select(Map).ToList();
    }

    public async Task<UserDto> CreateAsync(CreateUserRequest request, CancellationToken ct = default)
    {
        var existing = await _userRepo.GetByUserIdAsync(request.UserId?.Trim() ?? "", ct);
        if (existing != null)
            throw new InvalidOperationException("A user with this Login ID already exists. Please choose a different Login ID.");
        var user = new User
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId?.Trim() ?? request.UserId ?? "",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Name = request.Name,
            Role = request.Role,
            IsActive = true,
            Phone = request.Phone,
            Email = request.Email,
            Subject = request.Subject,
            ClassesAssigned = request.ClassesAssigned,
            CreatedAt = DateTime.UtcNow
        };
        var added = await _userRepo.AddAsync(user, ct);
        await _auditRepo.AddAsync(new AuditLog
        {
            Id = Guid.NewGuid(),
            TableName = "User",
            Action = "Created",
            EntityId = added.Id.ToString(),
            Timestamp = DateTime.UtcNow,
            Details = $"UserId: {added.UserId}, Role: {added.Role}"
        }, ct);
        return Map(added);
    }

    public async Task<UserDto> UpdateAsync(string id, UpdateUserRequest request, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid))
            throw new ArgumentException("Invalid id.", nameof(id));
        var user = await _userRepo.GetByIdAsync(guid, ct) ?? throw new InvalidOperationException("User not found.");
        user.Name = request.Name;
        user.Role = request.Role;
        user.IsActive = request.IsActive;
        user.Phone = request.Phone;
        user.Email = request.Email;
        user.Subject = request.Subject;
        user.ClassesAssigned = request.ClassesAssigned;
        user.UpdatedAt = DateTime.UtcNow;
        await _userRepo.UpdateAsync(user, ct);
        await _auditRepo.AddAsync(new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = guid,
            TableName = "User",
            Action = "Updated",
            EntityId = id,
            Timestamp = DateTime.UtcNow
        }, ct);
        return Map(user);
    }

    public async Task ResetPasswordAsync(string id, ResetPasswordRequest request, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid))
            throw new ArgumentException("Invalid id.", nameof(id));
        var user = await _userRepo.GetByIdAsync(guid, ct) ?? throw new InvalidOperationException("User not found.");
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;
        await _userRepo.UpdateAsync(user, ct);
    }

    private static UserDto Map(User u) => new()
    {
        Id = u.Id.ToString(),
        UserId = u.UserId,
        Name = u.Name,
        Role = u.Role,
        IsActive = u.IsActive,
        Phone = u.Phone,
        Email = u.Email,
        Subject = u.Subject,
        ClassesAssigned = u.ClassesAssigned,
        CreatedAt = u.CreatedAt
    };
}
