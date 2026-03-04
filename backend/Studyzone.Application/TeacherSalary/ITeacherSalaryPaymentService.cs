namespace Studyzone.Application.TeacherSalary;

public interface ITeacherSalaryPaymentService
{
    Task<TeacherSalaryPaymentDto?> GetByIdAsync(string id, CancellationToken ct = default);
    Task<IReadOnlyList<TeacherSalaryPaymentDto>> GetByTeacherAsync(string teacherUserId, CancellationToken ct = default);
    Task<IReadOnlyList<TeacherSalaryPaymentDto>> GetByMonthAsync(int year, int month, CancellationToken ct = default);
    Task<IReadOnlyList<TeacherSalaryPaymentDto>> GetByStatusAndDateRangeAsync(string? status, int? yearFrom, int? yearTo, int? monthFrom, int? monthTo, CancellationToken ct = default);
    Task<TeacherSalaryPaymentDto> CreateAsync(CreateTeacherSalaryPaymentRequest request, CancellationToken ct = default);
    Task<TeacherSalaryPaymentDto> UpdateAsync(string id, UpdateTeacherSalaryPaymentRequest request, CancellationToken ct = default);
    Task<TeacherSalaryPaymentLineDto> AddLineAsync(string paymentId, AddTeacherSalaryPaymentLineRequest request, CancellationToken ct = default);
    Task<TeacherSalaryPaymentLineDto> UpdateLineAsync(string paymentId, string lineId, UpdateTeacherSalaryPaymentLineRequest request, CancellationToken ct = default);
    Task DeleteLineAsync(string paymentId, string lineId, CancellationToken ct = default);
}
