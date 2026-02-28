using Studyzone.Application.Administration;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;

namespace Studyzone.Infrastructure.Services;

public class SchoolProfileService : ISchoolProfileService
{
    private readonly ISchoolRepository _repo;

    public SchoolProfileService(ISchoolRepository repo)
    {
        _repo = repo;
    }

    public async Task<SchoolProfileDto?> GetAsync(CancellationToken ct = default)
    {
        var e = await _repo.GetFirstAsync(ct);
        return e == null ? null : Map(e);
    }

    public async Task<SchoolProfileDto> CreateOrUpdateAsync(UpdateSchoolProfileRequest request, CancellationToken ct = default)
    {
        var existing = await _repo.GetFirstAsync(ct);
        if (existing != null)
        {
            existing.Name = request.Name;
            existing.Address = request.Address;
            existing.LogoUrl = request.LogoUrl;
            existing.Phone = request.Phone;
            existing.Email = request.Email;
            await _repo.UpdateAsync(existing, ct);
            return Map(existing);
        }
        var entity = new School
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Address = request.Address,
            LogoUrl = request.LogoUrl,
            Phone = request.Phone,
            Email = request.Email,
            CreatedAt = DateTime.UtcNow
        };
        var added = await _repo.AddAsync(entity, ct);
        return Map(added);
    }

    private static SchoolProfileDto Map(School e) => new()
    {
        Id = e.Id.ToString(),
        Name = e.Name,
        Address = e.Address,
        LogoUrl = e.LogoUrl,
        Phone = e.Phone,
        Email = e.Email
    };
}
