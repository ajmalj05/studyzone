using System.Text.Json;
using System.Text.RegularExpressions;
using Studyzone.Application.Timetable;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;

namespace Studyzone.Infrastructure.Services;

public class TimetableService : ITimetableService
{
    private static readonly string[] DayNames = { "", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday" };
    private static readonly JsonSerializerOptions BreakJsonOptions = new() { PropertyNameCaseInsensitive = true };
    private static readonly Regex HhMm = new(@"^\d{2}:\d{2}$", RegexOptions.Compiled);

    private readonly IPeriodConfigRepository _periodRepo;
    private readonly ITimetableSettingsRepository _settingsRepo;
    private readonly ITimetableSlotRepository _slotRepo;
    private readonly IBatchRepository _batchRepo;
    private readonly IUserRepository _userRepo;

    public TimetableService(
        IPeriodConfigRepository periodRepo,
        ITimetableSettingsRepository settingsRepo,
        ITimetableSlotRepository slotRepo,
        IBatchRepository batchRepo,
        IUserRepository userRepo)
    {
        _periodRepo = periodRepo;
        _settingsRepo = settingsRepo;
        _slotRepo = slotRepo;
        _batchRepo = batchRepo;
        _userRepo = userRepo;
    }

    public async Task<TimetableSettingsDto?> GetTimetableSettingsAsync(CancellationToken ct = default)
    {
        var row = await _settingsRepo.GetSingleAsync(ct);
        if (row == null) return null;
        return new TimetableSettingsDto
        {
            WorkingDayCount = row.WorkingDayCount,
            PeriodsPerDay = row.PeriodsPerDay,
            SchoolStartTime = string.IsNullOrWhiteSpace(row.SchoolStartTime) ? "08:00" : row.SchoolStartTime.Trim(),
            PeriodDurationMinutes = row.PeriodDurationMinutes > 0 ? row.PeriodDurationMinutes : 45,
            Breaks = ParseBreaks(row.BreaksJson),
        };
    }

    public async Task<TimetableSettingsDto> SaveTimetableSettingsAsync(TimetableSettingsDto dto, CancellationToken ct = default)
    {
        var start = NormalizeSchoolStartTime(dto.SchoolStartTime);
        var duration = Math.Clamp(dto.PeriodDurationMinutes, 5, 180);
        var periodsPerDay = Math.Clamp(dto.PeriodsPerDay, 1, 20);
        var sanitizedBreaks = SanitizeBreaks(dto.Breaks, periodsPerDay);
        var breaksJson = JsonSerializer.Serialize(sanitizedBreaks, BreakJsonOptions);

        var entity = new TimetableSettings
        {
            Id = Guid.NewGuid(),
            WorkingDayCount = Math.Clamp(dto.WorkingDayCount, 1, 7),
            PeriodsPerDay = periodsPerDay,
            SchoolStartTime = start,
            PeriodDurationMinutes = duration,
            BreaksJson = breaksJson,
        };
        var saved = await _settingsRepo.AddOrUpdateAsync(entity, ct);
        return new TimetableSettingsDto
        {
            WorkingDayCount = saved.WorkingDayCount,
            PeriodsPerDay = saved.PeriodsPerDay,
            SchoolStartTime = string.IsNullOrWhiteSpace(saved.SchoolStartTime) ? "08:00" : saved.SchoolStartTime.Trim(),
            PeriodDurationMinutes = saved.PeriodDurationMinutes > 0 ? saved.PeriodDurationMinutes : 45,
            Breaks = ParseBreaks(saved.BreaksJson),
        };
    }

    private static string NormalizeSchoolStartTime(string? raw)
    {
        var t = (raw ?? "").Trim();
        if (HhMm.IsMatch(t) && TimeSpan.TryParse(t, out _)) return t;
        return "08:00";
    }

    private static List<TimetableBreakDto> ParseBreaks(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new List<TimetableBreakDto>();
        try
        {
            var list = JsonSerializer.Deserialize<List<TimetableBreakDto>>(json!, BreakJsonOptions);
            return list ?? new List<TimetableBreakDto>();
        }
        catch
        {
            return new List<TimetableBreakDto>();
        }
    }

    private static List<TimetableBreakDto> SanitizeBreaks(IReadOnlyList<TimetableBreakDto>? breaks, int periodsPerDay)
    {
        if (breaks == null || breaks.Count == 0) return new List<TimetableBreakDto>();
        var maxAfter = Math.Max(1, periodsPerDay);
        return breaks
            .Select(b => new TimetableBreakDto
            {
                Id = string.IsNullOrWhiteSpace(b.Id) ? Guid.NewGuid().ToString("N") : b.Id.Trim(),
                AfterPeriod = Math.Clamp(b.AfterPeriod, 1, maxAfter),
                DurationMinutes = Math.Clamp(b.DurationMinutes, 1, 120),
                AppliesTo = string.IsNullOrWhiteSpace(b.AppliesTo) ? "all" : b.AppliesTo.Trim().ToLowerInvariant(),
            })
            .ToList();
    }

    public async Task<IReadOnlyList<TeacherForSubjectDto>> GetTeachersForSubjectAsync(string subjectName, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(subjectName)) return Array.Empty<TeacherForSubjectDto>();
        var teachers = await _userRepo.GetAllAsync("Teacher");
        var match = subjectName.Trim();
        return teachers
            .Where(u => !string.IsNullOrWhiteSpace(u.Subject) && string.Equals(u.Subject.Trim(), match, StringComparison.OrdinalIgnoreCase))
            .Select(u => new TeacherForSubjectDto
            {
                Id = u.Id.ToString(),
                Name = u.Name ?? ""
            })
            .ToList();
    }

    public async Task<IReadOnlyList<PeriodConfigDto>> GetPeriodConfigAsync(CancellationToken ct = default)
    {
        var list = await _periodRepo.GetAllAsync(ct);
        return list.Select(p => new PeriodConfigDto
        {
            Id = p.Id.ToString(),
            DayOfWeek = p.DayOfWeek,
            PeriodOrder = p.PeriodOrder,
            StartTime = p.StartTime.ToString(@"hh\:mm"),
            EndTime = p.EndTime.ToString(@"hh\:mm"),
            IsBreak = p.IsBreak,
            Label = p.Label
        }).ToList();
    }

    public async Task<PeriodConfigDto> SavePeriodConfigAsync(PeriodConfigDto dto, CancellationToken ct = default)
    {
        if (!TimeSpan.TryParse(dto.StartTime, out var start)) start = TimeSpan.Zero;
        if (!TimeSpan.TryParse(dto.EndTime, out var end)) end = TimeSpan.Zero;
        if (string.IsNullOrWhiteSpace(dto.Id) || !Guid.TryParse(dto.Id, out var id))
        {
            var entity = new PeriodConfig
            {
                Id = Guid.NewGuid(),
                DayOfWeek = dto.DayOfWeek,
                PeriodOrder = dto.PeriodOrder,
                StartTime = start,
                EndTime = end,
                IsBreak = dto.IsBreak,
                Label = dto.Label
            };
            var added = await _periodRepo.AddAsync(entity, ct);
            return new PeriodConfigDto
            {
                Id = added.Id.ToString(),
                DayOfWeek = added.DayOfWeek,
                PeriodOrder = added.PeriodOrder,
                StartTime = added.StartTime.ToString(@"hh\:mm"),
                EndTime = added.EndTime.ToString(@"hh\:mm"),
                IsBreak = added.IsBreak,
                Label = added.Label
            };
        }
        var existing = await _periodRepo.GetByIdAsync(id, ct) ?? throw new InvalidOperationException("Period config not found.");
        existing.DayOfWeek = dto.DayOfWeek;
        existing.PeriodOrder = dto.PeriodOrder;
        existing.StartTime = start;
        existing.EndTime = end;
        existing.IsBreak = dto.IsBreak;
        existing.Label = dto.Label;
        await _periodRepo.UpdateAsync(existing, ct);
        return dto;
    }

    public async Task<IReadOnlyList<TimetableSlotDto>> GetSlotsByBatchAsync(string batchId, CancellationToken ct = default)
    {
        if (!Guid.TryParse(batchId, out var bid)) return Array.Empty<TimetableSlotDto>();
        var batch = await _batchRepo.GetByIdAsync(bid, ct);
        var batchName = batch?.Name ?? "";
        var list = await _slotRepo.GetByBatchIdAsync(bid, ct);
        return list.Select(s => new TimetableSlotDto
        {
            Id = s.Id.ToString(),
            BatchId = s.BatchId.ToString(),
            BatchName = batchName,
            DayOfWeek = s.DayOfWeek,
            PeriodOrder = s.PeriodOrder,
            Subject = s.Subject,
            Room = s.Room,
            TeacherUserId = s.TeacherUserId?.ToString(),
            TeacherName = s.TeacherName,
            IsPublished = s.IsPublished
        }).ToList();
    }

    public async Task<TimetableSlotDto> SaveSlotAsync(TimetableSlotDto dto, CancellationToken ct = default)
    {
        if (!Guid.TryParse(dto.BatchId, out var batchId))
            throw new ArgumentException("Invalid batch id.", nameof(dto));
        Guid? teacherId = string.IsNullOrWhiteSpace(dto.TeacherUserId) || !Guid.TryParse(dto.TeacherUserId, out var tid) ? null : tid;
        Guid? excludeSlotId = !string.IsNullOrWhiteSpace(dto.Id) && Guid.TryParse(dto.Id, out var parsedId) ? parsedId : null;

        if (teacherId.HasValue)
        {
            var teacherSlots = await _slotRepo.GetByTeacherUserIdAsync(teacherId.Value, ct);
            var conflict = teacherSlots.FirstOrDefault(s =>
                s.DayOfWeek == dto.DayOfWeek && s.PeriodOrder == dto.PeriodOrder
                && s.BatchId != batchId
                && (excludeSlotId == null || s.Id != excludeSlotId));
            if (conflict != null)
            {
                var otherBatch = await _batchRepo.GetByIdAsync(conflict.BatchId, ct);
                var otherDisplay = otherBatch != null
                    ? $"{otherBatch.Class?.Name ?? "?"}-{otherBatch.Name}"
                    : conflict.BatchId.ToString();
                var dayName = dto.DayOfWeek >= 1 && dto.DayOfWeek <= 7 ? DayNames[dto.DayOfWeek] : $"Day {dto.DayOfWeek}";
                throw new InvalidOperationException(
                    $"This teacher is already assigned to {otherDisplay} on {dayName} period {dto.PeriodOrder}.");
            }
        }

        var batch = await _batchRepo.GetByIdAsync(batchId, ct);
        var batchName = batch?.Name ?? "";
        if (excludeSlotId.HasValue)
        {
            var existing = await _slotRepo.GetByIdAsync(excludeSlotId.Value, ct);
            if (existing != null)
            {
                existing.Subject = dto.Subject;
                existing.Room = dto.Room;
                existing.TeacherUserId = teacherId;
                existing.TeacherName = dto.TeacherName;
                await _slotRepo.UpdateAsync(existing, ct);
                return new TimetableSlotDto
                {
                    Id = existing.Id.ToString(),
                    BatchId = existing.BatchId.ToString(),
                    BatchName = batchName,
                    DayOfWeek = existing.DayOfWeek,
                    PeriodOrder = existing.PeriodOrder,
                    Subject = existing.Subject,
                    Room = existing.Room,
                    TeacherUserId = existing.TeacherUserId?.ToString(),
                    TeacherName = existing.TeacherName,
                    IsPublished = existing.IsPublished
                };
            }
        }
        var entity = new TimetableSlot
        {
            Id = Guid.NewGuid(),
            BatchId = batchId,
            DayOfWeek = dto.DayOfWeek,
            PeriodOrder = dto.PeriodOrder,
            Subject = dto.Subject,
            Room = dto.Room,
            TeacherUserId = teacherId,
            TeacherName = dto.TeacherName,
            IsPublished = false,
            CreatedAt = DateTime.UtcNow
        };
        var added = await _slotRepo.AddAsync(entity, ct);
        return new TimetableSlotDto
        {
            Id = added.Id.ToString(),
            BatchId = added.BatchId.ToString(),
            BatchName = batchName,
            DayOfWeek = added.DayOfWeek,
            PeriodOrder = added.PeriodOrder,
            Subject = added.Subject,
            Room = added.Room,
            TeacherUserId = added.TeacherUserId?.ToString(),
            TeacherName = added.TeacherName,
            IsPublished = added.IsPublished
        };
    }

    public async Task PublishTimetableAsync(string batchId, CancellationToken ct = default)
    {
        if (!Guid.TryParse(batchId, out var bid)) return;
        var slots = await _slotRepo.GetByBatchIdAsync(bid, ct);
        foreach (var s in slots)
        {
            s.IsPublished = true;
            await _slotRepo.UpdateAsync(s, ct);
        }
    }

    public async Task DeleteSlotAsync(string slotId, CancellationToken ct = default)
    {
        if (!Guid.TryParse(slotId, out var id)) return;
        await _slotRepo.DeleteAsync(id, ct);
    }
}
