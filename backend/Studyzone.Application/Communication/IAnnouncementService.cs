namespace Studyzone.Application.Communication;

public interface IAnnouncementService
{
    Task<AnnouncementDto> CreateAsync(CreateAnnouncementRequest request, string createdByUserId, CancellationToken ct = default);
    Task<IReadOnlyList<AnnouncementDto>> GetAllAsync(int skip, int take, CancellationToken ct = default);
    Task<IReadOnlyList<AnnouncementDto>> GetNoticeBoardAsync(Guid? classId, Guid? userId, Guid? studentId, int take = 50, CancellationToken ct = default);
    Task<bool> DeleteAsync(string id, CancellationToken ct = default);
}
