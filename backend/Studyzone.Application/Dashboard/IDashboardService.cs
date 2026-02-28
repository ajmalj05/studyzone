namespace Studyzone.Application.Dashboard;

public interface IDashboardService
{
    Task<DashboardKpiDto> GetKpisAsync(CancellationToken ct = default);
    Task<AdmissionPipelineDto> GetAdmissionPipelineAsync(CancellationToken ct = default);
    Task<IReadOnlyList<FeeSummaryDto>> GetFeeSummaryByClassAsync(CancellationToken ct = default);
}
