namespace Studyzone.Application.Students;

public interface IStudentService
{
    Task<StudentDto?> GetByIdAsync(string id, CancellationToken ct = default);
    Task<(IReadOnlyList<StudentDto> Items, int Total)> GetAllAsync(string? classId, string? batchId, string? status, string? academicYearId, int skip, int take, CancellationToken ct = default);
    Task<bool> IsStudentInBatchWithClassTeacherAsync(string studentId, string teacherUserId, CancellationToken ct = default);
    Task<StudentDto> CreateAsync(CreateStudentRequest request, CancellationToken ct = default);
    Task<StudentDto> UpdateAsync(string id, UpdateStudentRequest request, CancellationToken ct = default);
    Task SetStatusAsync(string id, string status, string? notes, CancellationToken ct = default);
    Task BulkPromoteAsync(BulkPromoteRequest request, CancellationToken ct = default);
}

public interface IClassService
{
    Task<ClassDto?> GetByIdAsync(string id, CancellationToken ct = default);
    Task<IReadOnlyList<ClassDto>> GetAllAsync(CancellationToken ct = default);
    Task<ClassDto> CreateAsync(CreateClassRequest request, CancellationToken ct = default);
    Task<ClassDto> UpdateAsync(string id, CreateClassRequest request, CancellationToken ct = default);
}

public interface IBatchService
{
    Task<BatchDto?> GetByIdAsync(string id, CancellationToken ct = default);
    Task<BatchDto?> GetBatchByClassTeacherAsync(string userId, CancellationToken ct = default);
    Task<IReadOnlyList<BatchDto>> GetByClassIdAsync(string classId, string? academicYearId, CancellationToken ct = default);
    Task<IReadOnlyList<BatchDto>> GetAllAsync(string? academicYearId, CancellationToken ct = default);
    Task<BatchDto> CreateAsync(CreateBatchRequest request, CancellationToken ct = default);
    Task<BatchDto> UpdateAsync(string id, CreateBatchRequest request, CancellationToken ct = default);
}
