using Studyzone.Application.Admission;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;

namespace Studyzone.Infrastructure.Services;

public class EnquiryService : IEnquiryService
{
    private readonly IEnquiryRepository _repo;

    public EnquiryService(IEnquiryRepository repo)
    {
        _repo = repo;
    }

    public async Task<EnquiryDto?> GetByIdAsync(string id, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid)) return null;
        var e = await _repo.GetByIdAsync(guid, ct);
        return e == null ? null : Map(e);
    }

    public async Task<(IReadOnlyList<EnquiryDto> Items, int Total)> GetAllAsync(string? statusFilter, int skip, int take, CancellationToken ct = default)
    {
        var list = await _repo.GetAllAsync(statusFilter, skip, take, ct);
        var total = await _repo.CountAsync(statusFilter, ct);
        return (list.Select(Map).ToList(), total);
    }

    public async Task<EnquiryDto> CreateAsync(CreateEnquiryRequest request, CancellationToken ct = default)
    {
        var entity = new Enquiry
        {
            Id = Guid.NewGuid(),
            StudentName = request.StudentName,
            GuardianName = request.GuardianName,
            Phone = request.Phone,
            Email = request.Email,
            ClassOfInterest = request.ClassOfInterest,
            Source = request.Source,
            Status = "New",
            Notes = request.Notes,
            FollowUpDate = request.FollowUpDate,
            CreatedAt = DateTime.UtcNow
        };
        var added = await _repo.AddAsync(entity, ct);
        return Map(added);
    }

    public async Task<EnquiryDto> UpdateAsync(string id, UpdateEnquiryRequest request, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid))
            throw new ArgumentException("Invalid id.", nameof(id));
        var entity = await _repo.GetByIdAsync(guid, ct) ?? throw new InvalidOperationException("Enquiry not found.");
        entity.StudentName = request.StudentName;
        entity.GuardianName = request.GuardianName;
        entity.Phone = request.Phone;
        entity.Email = request.Email;
        entity.ClassOfInterest = request.ClassOfInterest;
        entity.Source = request.Source;
        entity.Status = request.Status;
        entity.FollowUpDate = request.FollowUpDate;
        entity.Notes = request.Notes;
        await _repo.UpdateAsync(entity, ct);
        return Map(entity);
    }

    private static EnquiryDto Map(Enquiry e) => new()
    {
        Id = e.Id.ToString(),
        StudentName = e.StudentName,
        GuardianName = e.GuardianName,
        Phone = e.Phone,
        Email = e.Email,
        ClassOfInterest = e.ClassOfInterest,
        Source = e.Source,
        Status = e.Status,
        FollowUpDate = e.FollowUpDate,
        Notes = e.Notes,
        AssignedToUserId = e.AssignedToUserId?.ToString(),
        CreatedAt = e.CreatedAt
    };
}
