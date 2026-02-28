using Studyzone.Application.Administration;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;

namespace Studyzone.Infrastructure.Services;

public class RoleService : IRoleService
{
    private readonly IRoleRepository _repo;

    private static readonly IReadOnlyList<string> SystemPermissionKeys = new[]
    {
        "dashboard.view", "students.view", "students.create", "students.edit", "students.delete",
        "teachers.view", "teachers.create", "teachers.edit", "teachers.delete",
        "fees.view", "fees.create", "fees.edit", "fees.collect",
        "attendance.view", "attendance.edit",
        "exams.view", "exams.create", "exams.edit", "exams.marks",
        "admission.view", "admission.create", "admission.edit", "admission.approve",
        "timetable.view", "timetable.edit", "timetable.publish",
        "reports.view", "reports.export",
        "communication.send",
        "settings.manage", "users.manage", "roles.manage", "audit.view"
    };

    public RoleService(IRoleRepository repo)
    {
        _repo = repo;
    }

    public async Task<RoleDto?> GetByIdAsync(string id, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid)) return null;
        var e = await _repo.GetByIdAsync(guid, ct);
        return e == null ? null : Map(e);
    }

    public async Task<IReadOnlyList<RoleDto>> GetAllAsync(CancellationToken ct = default)
    {
        var list = await _repo.GetAllAsync(ct);
        return list.Select(Map).ToList();
    }

    public async Task<RoleDto> CreateAsync(CreateRoleRequest request, CancellationToken ct = default)
    {
        var entity = new Role
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Description = request.Description,
            CreatedAt = DateTime.UtcNow,
            Permissions = request.PermissionKeys.Select(k => new RolePermission
            {
                Id = Guid.NewGuid(),
                RoleId = Guid.Empty,
                PermissionKey = k
            }).ToList()
        };
        foreach (var p in entity.Permissions)
            p.RoleId = entity.Id;
        var added = await _repo.AddAsync(entity, ct);
        return Map(added);
    }

    public async Task<RoleDto> UpdateAsync(string id, UpdateRoleRequest request, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid))
            throw new ArgumentException("Invalid id.", nameof(id));
        var entity = await _repo.GetByIdAsync(guid, ct) ?? throw new InvalidOperationException("Role not found.");
        entity.Name = request.Name;
        entity.Description = request.Description;
        entity.Permissions = request.PermissionKeys.Select(k => new RolePermission
        {
            Id = Guid.NewGuid(),
            RoleId = entity.Id,
            PermissionKey = k
        }).ToList();
        await _repo.UpdateAsync(entity, ct);
        return Map(entity);
    }

    public Task<IReadOnlyList<string>> GetAllPermissionKeysAsync(CancellationToken ct = default)
    {
        return Task.FromResult(SystemPermissionKeys);
    }

    private static RoleDto Map(Role e) => new()
    {
        Id = e.Id.ToString(),
        Name = e.Name,
        Description = e.Description,
        PermissionKeys = e.Permissions?.Select(p => p.PermissionKey).ToList() ?? new List<string>()
    };
}
