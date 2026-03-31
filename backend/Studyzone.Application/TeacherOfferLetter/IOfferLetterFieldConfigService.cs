namespace Studyzone.Application.TeacherOfferLetter;

public interface IOfferLetterFieldConfigService
{
    Task<IReadOnlyList<OfferLetterFieldConfigDto>> GetAllAsync(CancellationToken ct = default);
    Task<OfferLetterFieldConfigDto?> GetByIdAsync(string id, CancellationToken ct = default);
    Task<OfferLetterFieldConfigDto> CreateAsync(CreateOfferLetterFieldConfigRequest request, CancellationToken ct = default);
    Task<OfferLetterFieldConfigDto> UpdateAsync(string id, UpdateOfferLetterFieldConfigRequest request, CancellationToken ct = default);
    Task DeleteAsync(string id, CancellationToken ct = default);
    Task ResetToDefaultsAsync(CancellationToken ct = default);
    Task SeedDefaultsAsync(CancellationToken ct = default);
}