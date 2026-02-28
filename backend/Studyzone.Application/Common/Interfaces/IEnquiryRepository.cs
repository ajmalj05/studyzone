using Studyzone.Domain.Entities;

namespace Studyzone.Application.Common.Interfaces;

public interface IEnquiryRepository
{
    Task<Enquiry?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Enquiry>> GetAllAsync(string? statusFilter, int skip, int take, CancellationToken ct = default);
    Task<int> CountAsync(string? statusFilter, CancellationToken ct = default);
    Task<Enquiry> AddAsync(Enquiry entity, CancellationToken ct = default);
    Task UpdateAsync(Enquiry entity, CancellationToken ct = default);
}
