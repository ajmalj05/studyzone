namespace Studyzone.Application.Reports;

public interface IReportsService
{
    Task<IReadOnlyList<EnrollmentReportDto>> GetEnrollmentByClassAsync(string? classId, CancellationToken ct = default);
    Task<IReadOnlyList<BatchStrengthReportDto>> GetBatchStrengthAsync(string? classId, CancellationToken ct = default);
    Task<FinancialReportDto> GetFinancialReportAsync(DateTime? from, DateTime? to, string? academicYearId = null, CancellationToken ct = default);
    Task<AttendanceReportDto> GetAttendanceReportAsync(string? classId, DateTime from, DateTime to, string? academicYearId = null, CancellationToken ct = default);
    Task<AcademicReportDto?> GetAcademicReportAsync(string examId, CancellationToken ct = default);
    Task<AdmissionConversionReportDto> GetAdmissionConversionAsync(DateTime? from, DateTime? to, CancellationToken ct = default);
    Task<TeacherWorkloadReportDto> GetTeacherWorkloadAsync(CancellationToken ct = default);
}
