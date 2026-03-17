namespace Studyzone.Application.TeacherOfferLetter;

public interface ITeacherOfferLetterService
{
    Task<IReadOnlyList<TeacherOfferLetterDto>> GetAllAsync(CancellationToken ct = default);
    Task<TeacherOfferLetterDto?> GetByIdAsync(string id, CancellationToken ct = default);
    Task<TeacherOfferLetterDto> CreateAsync(CreateTeacherOfferLetterRequest request, CancellationToken ct = default);
    Task<TeacherOfferLetterDto> UpdateAsync(string id, UpdateTeacherOfferLetterRequest request, CancellationToken ct = default);
    Task DeleteAsync(string id, CancellationToken ct = default);
}
