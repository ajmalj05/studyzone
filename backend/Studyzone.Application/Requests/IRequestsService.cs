namespace Studyzone.Application.Requests;

public interface IRequestsService
{
    Task<IReadOnlyList<RequestDto>> GetAsync(string? role, string? userId, CancellationToken ct = default);
    Task<RequestDto?> GetByIdAsync(string id, CancellationToken ct = default);
    Task<RequestDto> CreateAsync(CreateRequestRequest request, CancellationToken ct = default);
    Task<RequestDto> UpdateAsync(string id, UpdateRequestRequest request, CancellationToken ct = default);
}
