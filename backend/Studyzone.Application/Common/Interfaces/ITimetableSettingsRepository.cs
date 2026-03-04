using Studyzone.Domain.Entities;

namespace Studyzone.Application.Common.Interfaces;

public interface ITimetableSettingsRepository
{
    Task<TimetableSettings?> GetSingleAsync(CancellationToken ct = default);
    Task<TimetableSettings> AddOrUpdateAsync(TimetableSettings entity, CancellationToken ct = default);
}
