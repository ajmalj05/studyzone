namespace Studyzone.Application.Admission;

public interface IEnquiryService
{
    Task<EnquiryDto?> GetByIdAsync(string id, CancellationToken ct = default);
    Task<(IReadOnlyList<EnquiryDto> Items, int Total)> GetAllAsync(string? statusFilter, int skip, int take, CancellationToken ct = default);
    Task<EnquiryDto> CreateAsync(CreateEnquiryRequest request, CancellationToken ct = default);
    Task<EnquiryDto> UpdateAsync(string id, UpdateEnquiryRequest request, CancellationToken ct = default);
}
