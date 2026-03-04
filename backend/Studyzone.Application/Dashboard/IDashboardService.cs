namespace Studyzone.Application.Dashboard;

public interface IDashboardService
{
    Task<DashboardKpiDto> GetKpisAsync(string? academicYearId = null, CancellationToken ct = default);
    Task<AdmissionPipelineDto> GetAdmissionPipelineAsync(CancellationToken ct = default);
    Task<IReadOnlyList<FeeSummaryDto>> GetFeeSummaryByClassAsync(string? academicYearId = null, CancellationToken ct = default);
}
