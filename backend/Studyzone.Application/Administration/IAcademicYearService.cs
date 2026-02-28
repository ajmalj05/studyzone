namespace Studyzone.Application.Administration;

public interface IAcademicYearService
{
    Task<AcademicYearDto?> GetByIdAsync(string id, CancellationToken ct = default);
    Task<AcademicYearDto?> GetCurrentAsync(CancellationToken ct = default);
    Task<IReadOnlyList<AcademicYearDto>> GetAllAsync(bool includeArchived, CancellationToken ct = default);
    Task<AcademicYearDto> CreateAsync(CreateAcademicYearRequest request, CancellationToken ct = default);
    Task<AcademicYearDto> UpdateAsync(string id, UpdateAcademicYearRequest request, CancellationToken ct = default);
    Task SetCurrentAsync(string id, CancellationToken ct = default);
}
