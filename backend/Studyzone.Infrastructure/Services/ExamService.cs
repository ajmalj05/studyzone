using Studyzone.Application.Exams;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;

namespace Studyzone.Infrastructure.Services;

public class ExamService : IExamService
{
    private readonly IExamRepository _examRepo;
    private readonly IMarksEntryRepository _marksRepo;
    private readonly IClassRepository _classRepo;
    private readonly IStudentRepository _studentRepo;

    public ExamService(IExamRepository examRepo, IMarksEntryRepository marksRepo, IClassRepository classRepo, IStudentRepository studentRepo)
    {
        _examRepo = examRepo;
        _marksRepo = marksRepo;
        _classRepo = classRepo;
        _studentRepo = studentRepo;
    }

    public async Task<ExamDto?> GetByIdAsync(string id, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid)) return null;
        var e = await _examRepo.GetByIdAsync(guid, ct);
        if (e == null) return null;
        string? className = null;
        if (e.ClassId.HasValue)
        {
            var c = await _classRepo.GetByIdAsync(e.ClassId.Value, ct);
            className = c?.Name;
        }
        return new ExamDto
        {
            Id = e.Id.ToString(),
            Name = e.Name,
            Type = e.Type,
            ClassId = e.ClassId?.ToString(),
            ClassName = className,
            ExamDate = e.ExamDate,
            CreatedAt = e.CreatedAt
        };
    }

    public async Task<IReadOnlyList<ExamDto>> GetAllAsync(string? classId, CancellationToken ct = default)
    {
        Guid? cid = string.IsNullOrWhiteSpace(classId) || !Guid.TryParse(classId, out var g) ? null : g;
        var list = await _examRepo.GetAllAsync(cid, ct);
        var dtos = new List<ExamDto>();
        foreach (var e in list)
        {
            string? className = null;
            if (e.ClassId.HasValue)
            {
                var c = await _classRepo.GetByIdAsync(e.ClassId.Value, ct);
                className = c?.Name;
            }
            dtos.Add(new ExamDto
            {
                Id = e.Id.ToString(),
                Name = e.Name,
                Type = e.Type,
                ClassId = e.ClassId?.ToString(),
                ClassName = className,
                ExamDate = e.ExamDate,
                CreatedAt = e.CreatedAt
            });
        }
        return dtos;
    }

    public async Task<ExamDto> CreateAsync(CreateExamRequest request, CancellationToken ct = default)
    {
        Guid? classId = string.IsNullOrWhiteSpace(request.ClassId) || !Guid.TryParse(request.ClassId, out var cg) ? null : cg;
        var entity = new Exam
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Type = request.Type,
            ClassId = classId,
            ExamDate = request.ExamDate,
            CreatedAt = DateTime.UtcNow
        };
        var added = await _examRepo.AddAsync(entity, ct);
        string? className = null;
        if (added.ClassId.HasValue)
        {
            var c = await _classRepo.GetByIdAsync(added.ClassId.Value, ct);
            className = c?.Name;
        }
        return new ExamDto
        {
            Id = added.Id.ToString(),
            Name = added.Name,
            Type = added.Type,
            ClassId = added.ClassId?.ToString(),
            ClassName = className,
            ExamDate = added.ExamDate,
            CreatedAt = added.CreatedAt
        };
    }

    public async Task<IReadOnlyList<MarksEntryDto>> GetMarksByExamAsync(string examId, CancellationToken ct = default)
    {
        if (!Guid.TryParse(examId, out var eid)) return Array.Empty<MarksEntryDto>();
        var list = await _marksRepo.GetByExamIdAsync(eid, ct);
        var dtos = new List<MarksEntryDto>();
        foreach (var m in list)
        {
            var s = await _studentRepo.GetByIdAsync(m.StudentId, ct);
            dtos.Add(new MarksEntryDto
            {
                Id = m.Id.ToString(),
                ExamId = m.ExamId.ToString(),
                StudentId = m.StudentId.ToString(),
                StudentName = s?.Name ?? "",
                Subject = m.Subject,
                MarksObtained = m.MarksObtained,
                MaxMarks = m.MaxMarks
            });
        }
        return dtos;
    }

    public async Task SaveMarksAsync(SaveMarksRequest request, CancellationToken ct = default)
    {
        if (!Guid.TryParse(request.ExamId, out var examId))
            throw new ArgumentException("Invalid exam id.", nameof(request));
        if (!Guid.TryParse(request.StudentId, out var studentId))
            throw new ArgumentException("Invalid student id.", nameof(request));
        var entry = new MarksEntry
        {
            ExamId = examId,
            StudentId = studentId,
            Subject = request.Subject,
            MarksObtained = request.MarksObtained,
            MaxMarks = request.MaxMarks
        };
        await _marksRepo.AddOrUpdateAsync(entry, ct);
    }
}
