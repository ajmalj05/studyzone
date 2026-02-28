using Studyzone.Domain.Entities;

namespace Studyzone.Application.Common.Interfaces;

public interface IAnnouncementRepository
{
    Task<Announcement?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Announcement>> GetAllAsync(int skip, int take, CancellationToken ct = default);
    Task<IReadOnlyList<Announcement>> GetForNoticeBoardAsync(Guid? classId, Guid? userId, Guid? studentId, int take, CancellationToken ct = default);
    Task<Announcement> AddAsync(Announcement entity, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}
