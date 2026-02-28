namespace Studyzone.Application.Timetable;

public interface ITimetableService
{
    Task<IReadOnlyList<PeriodConfigDto>> GetPeriodConfigAsync(CancellationToken ct = default);
    Task<PeriodConfigDto> SavePeriodConfigAsync(PeriodConfigDto dto, CancellationToken ct = default);
    Task<IReadOnlyList<TimetableSlotDto>> GetSlotsByBatchAsync(string batchId, CancellationToken ct = default);
    Task<TimetableSlotDto> SaveSlotAsync(TimetableSlotDto dto, CancellationToken ct = default);
    Task PublishTimetableAsync(string batchId, CancellationToken ct = default);
}
