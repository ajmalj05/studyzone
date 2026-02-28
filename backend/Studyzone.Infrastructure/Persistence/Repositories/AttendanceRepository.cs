using Microsoft.EntityFrameworkCore;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;
using Studyzone.Infrastructure.Persistence;

namespace Studyzone.Infrastructure.Persistence.Repositories;

public class AttendanceRepository : IAttendanceRepository
{
    private readonly ApplicationDbContext _db;

    public AttendanceRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<AttendanceRecord>> GetByStudentAndDateRangeAsync(Guid studentId, DateTime from, DateTime to, CancellationToken ct = default)
    {
        return await _db.AttendanceRecords.AsNoTracking()
            .Where(x => x.StudentId == studentId && x.Date >= from.Date && x.Date <= to.Date)
            .OrderBy(x => x.Date)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<AttendanceRecord>> GetByStudentIdsAndDateAsync(IEnumerable<Guid> studentIds, DateTime date, CancellationToken ct = default)
    {
        var ids = studentIds.ToList();
        if (ids.Count == 0) return new List<AttendanceRecord>();
        return await _db.AttendanceRecords.AsNoTracking()
            .Where(x => x.Date == date.Date && x.StudentId != null && ids.Contains(x.StudentId.Value))
            .ToListAsync(ct);
    }

    public async Task<AttendanceRecord?> GetByStudentAndDateAsync(Guid studentId, DateTime date, int? periodNumber, CancellationToken ct = default)
    {
        var query = _db.AttendanceRecords.Where(x => x.StudentId == studentId && x.Date == date.Date);
        if (periodNumber.HasValue)
            query = query.Where(x => x.PeriodNumber == periodNumber);
        else
            query = query.Where(x => x.PeriodNumber == null);
        return await query.FirstOrDefaultAsync(ct);
    }

    public async Task<AttendanceRecord> AddOrUpdateAsync(AttendanceRecord record, CancellationToken ct = default)
    {
        var existing = await GetByStudentAndDateAsync(record.StudentId ?? Guid.Empty, record.Date, record.PeriodNumber, ct);
        if (existing != null)
        {
            existing.Status = record.Status;
            _db.AttendanceRecords.Update(existing);
            await _db.SaveChangesAsync(ct);
            return existing;
        }
        record.Id = Guid.NewGuid();
        record.CreatedAt = DateTime.UtcNow;
        _db.AttendanceRecords.Add(record);
        await _db.SaveChangesAsync(ct);
        return record;
    }

    public async Task<AttendanceRecord?> GetByTeacherAndDateAsync(Guid teacherUserId, DateTime date, CancellationToken ct = default)
    {
        return await _db.AttendanceRecords
            .Where(x => x.TeacherUserId == teacherUserId && x.Date == date.Date && x.RecordType == "Teacher")
            .FirstOrDefaultAsync(ct);
    }

    public async Task<IReadOnlyList<AttendanceRecord>> GetByTeacherAndDateRangeAsync(Guid teacherUserId, DateTime from, DateTime to, CancellationToken ct = default)
    {
        return await _db.AttendanceRecords.AsNoTracking()
            .Where(x => x.TeacherUserId == teacherUserId && x.RecordType == "Teacher" && x.Date >= from.Date && x.Date <= to.Date)
            .OrderBy(x => x.Date)
            .ToListAsync(ct);
    }

    public async Task<AttendanceRecord> AddOrUpdateTeacherAsync(AttendanceRecord record, CancellationToken ct = default)
    {
        var teacherId = record.TeacherUserId ?? Guid.Empty;
        var existing = await GetByTeacherAndDateAsync(teacherId, record.Date, ct);
        if (existing != null)
        {
            existing.Status = record.Status;
            _db.AttendanceRecords.Update(existing);
            await _db.SaveChangesAsync(ct);
            return existing;
        }
        record.Id = Guid.NewGuid();
        record.CreatedAt = DateTime.UtcNow;
        record.RecordType = "Teacher";
        _db.AttendanceRecords.Add(record);
        await _db.SaveChangesAsync(ct);
        return record;
    }
}
