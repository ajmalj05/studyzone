namespace Studyzone.Application.Administration;

public interface ISchoolProfileService
{
    Task<SchoolProfileDto?> GetAsync(CancellationToken ct = default);
    Task<SchoolProfileDto> CreateOrUpdateAsync(UpdateSchoolProfileRequest request, CancellationToken ct = default);
}
