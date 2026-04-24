using Studyzone.Application.Students;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Studyzone.Infrastructure.Services;

public class ClassService : IClassService
{
    private readonly IClassRepository _repo;

    public ClassService(IClassRepository repo)
    {
        _repo = repo;
    }

    public async Task<ClassDto?> GetByIdAsync(string id, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid)) return null;
        var e = await _repo.GetByIdAsync(guid, ct);
        return e == null ? null : Map(e);
    }

    public async Task<IReadOnlyList<ClassDto>> GetAllAsync(CancellationToken ct = default)
    {
        var list = await _repo.GetAllAsync(ct);
        return list.Select(Map).ToList();
    }

    public async Task<ClassDto> CreateAsync(CreateClassRequest request, CancellationToken ct = default)
    {
        var name = request.Name.Trim();
        var code = request.Code.Trim();

        if (string.IsNullOrWhiteSpace(name))
            throw new InvalidOperationException("Class name is required.");
        if (string.IsNullOrWhiteSpace(code))
            throw new InvalidOperationException("Class code is required.");
        if (await _repo.ExistsByNameAsync(name, null, ct))
            throw new InvalidOperationException($"Class name '{name}' already exists.");
        if (await _repo.ExistsByCodeAsync(code, null, ct))
            throw new InvalidOperationException($"Class code '{code}' already exists.");

        var entity = new Class
        {
            Id = Guid.NewGuid(),
            Name = name,
            Code = code,
            CreatedAt = DateTime.UtcNow
        };
        Class added;
        try
        {
            added = await _repo.AddAsync(entity, ct);
        }
        catch (DbUpdateException ex) when (TryGetClassSaveMessage(ex, name, code, out var message))
        {
            throw new InvalidOperationException(message, ex);
        }
        return Map(added);
    }

    public async Task<ClassDto> UpdateAsync(string id, CreateClassRequest request, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid))
            throw new ArgumentException("Invalid id.", nameof(id));
        var entity = await _repo.GetByIdAsync(guid, ct) ?? throw new InvalidOperationException("Class not found.");
        var name = request.Name.Trim();
        var code = request.Code.Trim();

        if (string.IsNullOrWhiteSpace(name))
            throw new InvalidOperationException("Class name is required.");
        if (string.IsNullOrWhiteSpace(code))
            throw new InvalidOperationException("Class code is required.");
        if (await _repo.ExistsByNameAsync(name, guid, ct))
            throw new InvalidOperationException($"Class name '{name}' already exists.");
        if (await _repo.ExistsByCodeAsync(code, guid, ct))
            throw new InvalidOperationException($"Class code '{code}' already exists.");

        entity.Name = name;
        entity.Code = code;
        try
        {
            await _repo.UpdateAsync(entity, ct);
        }
        catch (DbUpdateException ex) when (TryGetClassSaveMessage(ex, name, code, out var message))
        {
            throw new InvalidOperationException(message, ex);
        }
        return Map(entity);
    }

    private static bool TryGetClassSaveMessage(DbUpdateException ex, string name, string code, out string message)
    {
        if (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.NotNullViolation, ColumnName: "SeatLimit" })
        {
            message = "Class seat limit is no longer used. Please run the latest migrations or restart the backend so the old Classes.SeatLimit column is removed.";
            return true;
        }

        if (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation } pg)
        {
            var constraint = pg.ConstraintName ?? "";
            if (constraint.Contains("Name", StringComparison.OrdinalIgnoreCase))
            {
                message = $"Class name '{name}' already exists.";
                return true;
            }
            if (constraint.Contains("Code", StringComparison.OrdinalIgnoreCase))
            {
                message = $"Class code '{code}' already exists.";
                return true;
            }

            message = $"Class name or code already exists.";
            return true;
        }

        message = "";
        return false;
    }

    private static ClassDto Map(Class e) => new()
    {
        Id = e.Id.ToString(),
        Name = e.Name,
        Code = e.Code
    };
}
