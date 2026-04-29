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
    private readonly IStudentEnrollmentRepository _enrollmentRepo;
    private readonly IExamScheduleRepository _scheduleRepo;
    private readonly ITimetableSlotRepository _slotRepo;
    private readonly IBatchRepository _batchRepo;

    public ExamService(IExamRepository examRepo, IMarksEntryRepository marksRepo, IClassRepository classRepo, IStudentRepository studentRepo, IStudentEnrollmentRepository enrollmentRepo, IExamScheduleRepository scheduleRepo, ITimetableSlotRepository slotRepo, IBatchRepository batchRepo)
    {
        _examRepo = examRepo;
        _marksRepo = marksRepo;
        _classRepo = classRepo;
        _studentRepo = studentRepo;
        _enrollmentRepo = enrollmentRepo;
        _scheduleRepo = scheduleRepo;
        _slotRepo = slotRepo;
        _batchRepo = batchRepo;
    }

    private async Task<(List<string> classIds, List<string> classNames, List<string> classWideClassIds, List<string> batchIds, List<string> batchNames, string? firstClassId, string? firstClassName)> ResolveClassesAsync(Guid examId, Guid? legacyClassId, CancellationToken ct)
    {
        var links = await _examRepo.GetExamClassesByExamIdAsync(examId, ct);
        var ids = new List<string>();
        var names = new List<string>();
        var classWideClassIds = new List<string>();
        var batchIds = new List<string>();
        var batchNames = new List<string>();
        foreach (var link in links)
        {
            var c = await _classRepo.GetByIdAsync(link.ClassId, ct);
            if (c != null && !ids.Contains(c.Id.ToString())) { ids.Add(c.Id.ToString()); names.Add(c.Name); }
            if (!link.BatchId.HasValue && !classWideClassIds.Contains(link.ClassId.ToString()))
                classWideClassIds.Add(link.ClassId.ToString());
            if (link.BatchId.HasValue)
            {
                var b = await _batchRepo.GetByIdAsync(link.BatchId.Value, ct);
                if (b != null) { batchIds.Add(b.Id.ToString()); batchNames.Add(b.Name); }
            }
        }
        // Fall back to legacy ClassId if no junction rows
        if (ids.Count == 0 && legacyClassId.HasValue)
        {
            var c = await _classRepo.GetByIdAsync(legacyClassId.Value, ct);
            if (c != null) { ids.Add(c.Id.ToString()); names.Add(c.Name); }
            classWideClassIds.Add(legacyClassId.Value.ToString());
        }
        return (ids, names, classWideClassIds, batchIds, batchNames, ids.Count > 0 ? ids[0] : null, names.Count > 0 ? names[0] : null);
    }

    public async Task<ExamDto?> GetByIdAsync(string id, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid)) return null;
        var e = await _examRepo.GetByIdAsync(guid, ct);
        if (e == null) return null;
        var (classIds, classNames, classWideClassIds, batchIds, batchNames, firstClassId, firstName) = await ResolveClassesAsync(e.Id, e.ClassId, ct);
        return new ExamDto
        {
            Id = e.Id.ToString(),
            Name = e.Name,
            Type = e.Type,
            ClassId = firstClassId,
            ClassName = firstName,
            ClassIds = classIds,
            ClassNames = classNames,
            ClassWideClassIds = classWideClassIds,
            BatchIds = batchIds,
            BatchNames = batchNames,
            MaxMarks = e.MaxMarks,
            ExamDate = e.ExamDate,
            CreatedAt = e.CreatedAt
        };
    }

    public async Task<IReadOnlyList<ExamDto>> GetAllAsync(string? classId, CancellationToken ct = default)
    {
        Guid? cid = string.IsNullOrWhiteSpace(classId) || !Guid.TryParse(classId, out var g) ? null : g;
        var list = await _examRepo.GetAllAsync(cid, ct);
        var examIds = list.Select(e => e.Id).ToList().AsReadOnly();
        var allLinks = await _examRepo.GetExamClassesByExamIdsAsync(examIds, ct);
        var linksByExam = allLinks.GroupBy(l => l.ExamId).ToDictionary(gr => gr.Key, gr => gr.ToList());
        var dtos = new List<ExamDto>();
        foreach (var e in list)
        {
            var (classIds, classNames, classWideClassIds, batchIds, batchNames, firstClassId, firstName) = await ResolveClassesFromLinks(e, linksByExam.TryGetValue(e.Id, out var links) ? links : null, ct);
            dtos.Add(new ExamDto
            {
                Id = e.Id.ToString(),
                Name = e.Name,
                Type = e.Type,
                ClassId = firstClassId,
                ClassName = firstName,
                ClassIds = classIds,
                ClassNames = classNames,
                ClassWideClassIds = classWideClassIds,
                BatchIds = batchIds,
                BatchNames = batchNames,
                MaxMarks = e.MaxMarks,
                ExamDate = e.ExamDate,
                CreatedAt = e.CreatedAt
            });
        }
        return dtos;
    }

    private async Task<(List<string> classIds, List<string> classNames, List<string> classWideClassIds, List<string> batchIds, List<string> batchNames, string? firstClassId, string? firstName)> ResolveClassesFromLinks(Exam e, List<ExamClass>? links, CancellationToken ct)
    {
        var ids = new List<string>();
        var names = new List<string>();
        var classWideClassIds = new List<string>();
        var batchIds = new List<string>();
        var batchNames = new List<string>();
        if (links != null)
        {
            foreach (var link in links)
            {
                var c = await _classRepo.GetByIdAsync(link.ClassId, ct);
                if (c != null && !ids.Contains(c.Id.ToString())) { ids.Add(c.Id.ToString()); names.Add(c.Name); }
                if (!link.BatchId.HasValue && !classWideClassIds.Contains(link.ClassId.ToString()))
                    classWideClassIds.Add(link.ClassId.ToString());
                if (link.BatchId.HasValue)
                {
                    var b = await _batchRepo.GetByIdAsync(link.BatchId.Value, ct);
                    if (b != null) { batchIds.Add(b.Id.ToString()); batchNames.Add(b.Name); }
                }
            }
        }
        if (ids.Count == 0 && e.ClassId.HasValue)
        {
            var c = await _classRepo.GetByIdAsync(e.ClassId.Value, ct);
            if (c != null) { ids.Add(c.Id.ToString()); names.Add(c.Name); }
            classWideClassIds.Add(e.ClassId.Value.ToString());
        }
        return (ids, names, classWideClassIds, batchIds, batchNames, ids.Count > 0 ? ids[0] : null, names.Count > 0 ? names[0] : null);
    }

    public async Task<IReadOnlyList<ExamDto>> GetAllForClassIdsAsync(IReadOnlyList<string> classIds, CancellationToken ct = default)
    {
        if (classIds == null || classIds.Count == 0)
            return Array.Empty<ExamDto>();
        var guids = classIds.Select(s => Guid.TryParse(s, out var g) ? (Guid?)g : null).Where(g => g.HasValue).Select(g => g!.Value).ToList().AsReadOnly();
        if (guids.Count == 0) return Array.Empty<ExamDto>();
        var list = await _examRepo.GetAllForClassIdsAsync(guids, ct);
        var examIds = list.Select(e => e.Id).ToList().AsReadOnly();
        var allLinks = await _examRepo.GetExamClassesByExamIdsAsync(examIds, ct);
        var linksByExam = allLinks.GroupBy(l => l.ExamId).ToDictionary(gr => gr.Key, gr => gr.ToList());
        var dtos = new List<ExamDto>();
        foreach (var e in list)
        {
            var (cIds, cNames, classWideClassIds, batchIds, batchNames, firstClassId, firstName) = await ResolveClassesFromLinks(e, linksByExam.TryGetValue(e.Id, out var links) ? links : null, ct);
            dtos.Add(new ExamDto
            {
                Id = e.Id.ToString(),
                Name = e.Name,
                Type = e.Type,
                ClassId = firstClassId,
                ClassName = firstName,
                ClassIds = cIds,
                ClassNames = cNames,
                ClassWideClassIds = classWideClassIds,
                BatchIds = batchIds,
                BatchNames = batchNames,
                MaxMarks = e.MaxMarks,
                ExamDate = e.ExamDate,
                CreatedAt = e.CreatedAt
            });
        }
        return dtos;
    }

    public async Task<IReadOnlyList<ExamDto>> GetAllForClassAndBatchIdsAsync(IReadOnlyList<string> classIds, IReadOnlyList<string> batchIds, CancellationToken ct = default)
    {
        var classGuids = (classIds ?? Array.Empty<string>())
            .Select(s => Guid.TryParse(s, out var g) ? (Guid?)g : null)
            .Where(g => g.HasValue)
            .Select(g => g!.Value)
            .ToList()
            .AsReadOnly();
        var batchGuids = (batchIds ?? Array.Empty<string>())
            .Select(s => Guid.TryParse(s, out var g) ? (Guid?)g : null)
            .Where(g => g.HasValue)
            .Select(g => g!.Value)
            .ToList()
            .AsReadOnly();
        if (classGuids.Count == 0 && batchGuids.Count == 0)
            return Array.Empty<ExamDto>();

        var list = await _examRepo.GetAllForClassAndBatchIdsAsync(classGuids, batchGuids, ct);
        var examIds = list.Select(e => e.Id).ToList().AsReadOnly();
        var allLinks = await _examRepo.GetExamClassesByExamIdsAsync(examIds, ct);
        var linksByExam = allLinks.GroupBy(l => l.ExamId).ToDictionary(gr => gr.Key, gr => gr.ToList());
        var dtos = new List<ExamDto>();
        foreach (var e in list)
        {
            var (cIds, cNames, classWideClassIds, bIds, bNames, firstClassId, firstName) = await ResolveClassesFromLinks(e, linksByExam.TryGetValue(e.Id, out var links) ? links : null, ct);
            dtos.Add(new ExamDto
            {
                Id = e.Id.ToString(),
                Name = e.Name,
                Type = e.Type,
                ClassId = firstClassId,
                ClassName = firstName,
                ClassIds = cIds,
                ClassNames = cNames,
                ClassWideClassIds = classWideClassIds,
                BatchIds = bIds,
                BatchNames = bNames,
                MaxMarks = e.MaxMarks,
                ExamDate = e.ExamDate,
                CreatedAt = e.CreatedAt
            });
        }
        return dtos;
    }

    public async Task<ExamDto> CreateAsync(CreateExamRequest request, CancellationToken ct = default)
    {
        // Collect class IDs from both ClassIds list and legacy ClassId
        var classGuids = new List<Guid>();
        var batchGuids = new List<Guid>();
        var batchClassIds = new HashSet<Guid>();
        if (request.BatchIds != null)
        {
            foreach (var s in request.BatchIds)
            {
                if (!Guid.TryParse(s, out var batchId)) continue;
                var batch = await _batchRepo.GetByIdAsync(batchId, ct);
                if (batch == null) continue;
                batchGuids.Add(batchId);
                batchClassIds.Add(batch.ClassId);
            }
        }
        if (request.ClassIds != null)
        {
            foreach (var s in request.ClassIds)
                if (Guid.TryParse(s, out var g)) classGuids.Add(g);
        }
        else if (!string.IsNullOrWhiteSpace(request.ClassId) && Guid.TryParse(request.ClassId, out var single))
        {
            classGuids.Add(single);
        }
        classGuids = classGuids.Concat(batchClassIds).Distinct().ToList();
        batchGuids = batchGuids.Distinct().ToList();

        var entity = new Exam
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Type = request.Type,
            ClassId = null, // Use ExamClasses junction going forward
            MaxMarks = request.MaxMarks,
            ExamDate = request.ExamDate,
            CreatedAt = DateTime.UtcNow
        };
        var added = await _examRepo.AddAsync(entity, ct);

        if (classGuids.Count > 0)
        {
            var links = new List<ExamClass>();
            foreach (var classId in classGuids)
            {
                var classBatchIds = new List<Guid>();
                foreach (var batchId in batchGuids)
                {
                    var batch = await _batchRepo.GetByIdAsync(batchId, ct);
                    if (batch?.ClassId == classId)
                        classBatchIds.Add(batchId);
                }

                if (classBatchIds.Count > 0)
                {
                    links.AddRange(classBatchIds.Select(batchId => new ExamClass { Id = Guid.NewGuid(), ExamId = added.Id, ClassId = classId, BatchId = batchId }));
                }
                else
                {
                    links.Add(new ExamClass { Id = Guid.NewGuid(), ExamId = added.Id, ClassId = classId });
                }
            }
            await _examRepo.AddExamClassesAsync(links, ct);
        }

        var (classIds, classNames, classWideClassIds, batchIds, batchNames, firstClassId, firstName) = await ResolveClassesAsync(added.Id, added.ClassId, ct);
        return new ExamDto
        {
            Id = added.Id.ToString(),
            Name = added.Name,
            Type = added.Type,
            ClassId = firstClassId,
            ClassName = firstName,
            ClassIds = classIds,
            ClassNames = classNames,
            ClassWideClassIds = classWideClassIds,
            BatchIds = batchIds,
            BatchNames = batchNames,
            MaxMarks = added.MaxMarks,
            ExamDate = added.ExamDate,
            CreatedAt = added.CreatedAt
        };
    }

    public async Task<ExamDto?> UpdateExamDateAsync(string examId, DateTime? examDate, CancellationToken ct = default)
    {
        if (!Guid.TryParse(examId, out var eid)) return null;
        var exam = await _examRepo.GetByIdAsync(eid, ct);
        if (exam == null) return null;
        exam.ExamDate = examDate;
        var updated = await _examRepo.UpdateAsync(exam, ct);
        var (classIds, classNames, classWideClassIds, batchIds, batchNames, firstClassId, firstName) = await ResolveClassesAsync(updated.Id, updated.ClassId, ct);
        return new ExamDto
        {
            Id = updated.Id.ToString(),
            Name = updated.Name,
            Type = updated.Type,
            ClassId = firstClassId,
            ClassName = firstName,
            ClassIds = classIds,
            ClassNames = classNames,
            ClassWideClassIds = classWideClassIds,
            BatchIds = batchIds,
            BatchNames = batchNames,
            MaxMarks = updated.MaxMarks,
            ExamDate = updated.ExamDate,
            CreatedAt = updated.CreatedAt
        };
    }

    public async Task<IReadOnlyList<MarksEntryDto>> GetMarksByExamAsync(string examId, bool approvedOnly = false, CancellationToken ct = default)
    {
        if (!Guid.TryParse(examId, out var eid)) return Array.Empty<MarksEntryDto>();
        var list = await _marksRepo.GetByExamIdAsync(eid, approvedOnly, ct);
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
                MaxMarks = m.MaxMarks,
                Status = m.Status,
                ApprovedAt = m.ApprovedAt,
                ApprovedByUserId = m.ApprovedByUserId?.ToString(),
                RejectionReason = m.RejectionReason
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
        if (request.MaxMarks <= 0)
            throw new InvalidOperationException("Max marks must be greater than zero.");
        if (request.MarksObtained < 0)
            throw new InvalidOperationException("Marks obtained cannot be negative.");
        if (request.MarksObtained > request.MaxMarks)
            throw new InvalidOperationException("Marks obtained cannot be greater than total marks.");
        var enrollment = await _enrollmentRepo.GetCurrentForStudentAsync(studentId, ct);
        var links = await _examRepo.GetExamClassesByExamIdAsync(examId, ct);
        if (links.Count > 0)
        {
            if (enrollment == null)
                throw new InvalidOperationException("Student is not enrolled in the exam scope.");
            var allowed = links.Any(link =>
                (link.BatchId.HasValue && enrollment.BatchId == link.BatchId.Value) ||
                (!link.BatchId.HasValue && enrollment.ClassId == link.ClassId));
            if (!allowed)
                throw new InvalidOperationException("Student is not in a class or batch assigned to this exam.");
        }

        var scheduleRows = await _scheduleRepo.GetByExamIdAsync(examId, ct);
        if (enrollment != null)
        {
            var scheduleForSubject = PickScheduleEntryForMarks(scheduleRows, request.Subject, enrollment.ClassId);
            if (scheduleForSubject?.MaxMarks is decimal cap && cap > 0 && request.MaxMarks != cap)
                throw new InvalidOperationException($"Max marks for this subject must be {cap} (per exam schedule).");
        }

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

    public async Task<int> ApproveAllPendingMarksForExamAsync(string examId, string approvedByUserId, CancellationToken ct = default)
    {
        if (!Guid.TryParse(examId, out var eid))
            throw new ArgumentException("Invalid exam id.", nameof(examId));
        if (!Guid.TryParse(approvedByUserId, out var uid))
            throw new ArgumentException("Invalid user id.", nameof(approvedByUserId));
        return await _marksRepo.ApproveAllPendingForExamAsync(eid, uid, ct);
    }

    public async Task<bool> ApproveMarksEntryAsync(string marksEntryId, string approvedByUserId, CancellationToken ct = default)
    {
        if (!Guid.TryParse(marksEntryId, out var mid))
            return false;
        if (!Guid.TryParse(approvedByUserId, out var uid))
            return false;
        return await _marksRepo.ApproveEntryAsync(mid, uid, ct);
    }

    public async Task<bool> RejectMarksEntryAsync(string marksEntryId, string? reason, string approvedByUserId, CancellationToken ct = default)
    {
        if (!Guid.TryParse(marksEntryId, out var mid))
            return false;
        if (!Guid.TryParse(approvedByUserId, out var uid))
            return false;
        return await _marksRepo.RejectEntryAsync(mid, uid, reason, ct);
    }

    public async Task<IReadOnlyList<ExamScheduleEntryDto>> GetScheduleByExamIdAsync(string examId, CancellationToken ct = default)
    {
        if (!Guid.TryParse(examId, out var eid)) return Array.Empty<ExamScheduleEntryDto>();
        var exam = await _examRepo.GetByIdAsync(eid, ct);
        var entries = await _scheduleRepo.GetByExamIdAsync(eid, ct);
        return await MapScheduleEntriesAsync(entries, exam, ct);
    }

    public async Task<IReadOnlyList<ExamScheduleEntryDto>> GetScheduleForTeacherAsync(string teacherUserId, CancellationToken ct = default)
    {
        if (!Guid.TryParse(teacherUserId, out var teacherGuid))
            return Array.Empty<ExamScheduleEntryDto>();
        var slots = await _slotRepo.GetByTeacherUserIdAsync(teacherGuid, ct);
        var classIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var slot in slots)
        {
            var batch = await _batchRepo.GetByIdAsync(slot.BatchId, ct);
            if (batch != null) classIds.Add(batch.ClassId.ToString());
        }

        if (classIds.Count == 0) return Array.Empty<ExamScheduleEntryDto>();

        var classGuids = classIds
            .Select(s => Guid.TryParse(s, out var g) ? (Guid?)g : null)
            .Where(g => g.HasValue)
            .Select(g => g!.Value)
            .ToList()
            .AsReadOnly();
        var exams = await _examRepo.GetAllForClassIdsAsync(classGuids, ct);
        if (exams.Count == 0) return Array.Empty<ExamScheduleEntryDto>();

        var examIds = exams.Select(e => e.Id).ToList();
        var entries = await _scheduleRepo.GetByExamIdsAsync(examIds, ct);
        var filtered = entries;

        var examMap = exams.ToDictionary(e => e.Id);
        var result = new List<ExamScheduleEntryDto>();
        foreach (var entry in filtered)
        {
            examMap.TryGetValue(entry.ExamId, out var exam);
            string? className = null;
            if (entry.ClassId.HasValue)
            {
                var cls = await _classRepo.GetByIdAsync(entry.ClassId.Value, ct);
                className = cls?.Name;
            }
            else if (exam?.ClassId.HasValue == true)
            {
                var cls = await _classRepo.GetByIdAsync(exam.ClassId.Value, ct);
                className = cls?.Name;
            }
            result.Add(new ExamScheduleEntryDto
            {
                Id = entry.Id.ToString(),
                ExamId = entry.ExamId.ToString(),
                ExamName = exam?.Name,
                SubjectName = entry.SubjectName,
                ClassId = entry.ClassId?.ToString(),
                ClassName = className,
                ScheduledDate = entry.ScheduledDate,
                StartTime = entry.StartTime,
                EndTime = entry.EndTime,
                Venue = entry.Venue,
                MaxMarks = entry.MaxMarks,
                CreatedAt = entry.CreatedAt
            });
        }
        return result;
    }

    public async Task<ExamScheduleEntryDto> CreateScheduleEntryAsync(CreateExamScheduleEntryRequest request, CancellationToken ct = default)
    {
        if (!Guid.TryParse(request.ExamId, out var examId))
            throw new ArgumentException("Invalid exam id.", nameof(request));
        Guid? classId = string.IsNullOrWhiteSpace(request.ClassId) || !Guid.TryParse(request.ClassId, out var cg) ? null : cg;
        var entity = new ExamScheduleEntry
        {
            Id = Guid.NewGuid(),
            ExamId = examId,
            SubjectName = request.SubjectName,
            ClassId = classId,
            ScheduledDate = request.ScheduledDate,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            Venue = request.Venue,
            MaxMarks = request.MaxMarks.HasValue && request.MaxMarks.Value > 0 ? request.MaxMarks.Value : null,
            CreatedAt = DateTime.UtcNow
        };
        var added = await _scheduleRepo.AddAsync(entity, ct);
        var exam = await _examRepo.GetByIdAsync(examId, ct);
        string? className = null;
        if (added.ClassId.HasValue)
        {
            var cls = await _classRepo.GetByIdAsync(added.ClassId.Value, ct);
            className = cls?.Name;
        }
        return new ExamScheduleEntryDto
        {
            Id = added.Id.ToString(),
            ExamId = added.ExamId.ToString(),
            ExamName = exam?.Name,
            SubjectName = added.SubjectName,
            ClassId = added.ClassId?.ToString(),
            ClassName = className,
            ScheduledDate = added.ScheduledDate,
            StartTime = added.StartTime,
            EndTime = added.EndTime,
            Venue = added.Venue,
            MaxMarks = added.MaxMarks,
            CreatedAt = added.CreatedAt
        };
    }

    public async Task<ExamScheduleEntryDto> UpdateScheduleEntryAsync(string entryId, UpdateExamScheduleEntryRequest request, CancellationToken ct = default)
    {
        if (!Guid.TryParse(entryId, out var id))
            throw new ArgumentException("Invalid entry id.", nameof(entryId));
        var entry = await _scheduleRepo.GetByIdAsync(id, ct)
            ?? throw new KeyNotFoundException($"Schedule entry {entryId} not found.");
        Guid? classId = string.IsNullOrWhiteSpace(request.ClassId) || !Guid.TryParse(request.ClassId, out var cg) ? null : cg;
        entry.SubjectName = request.SubjectName;
        entry.ClassId = classId;
        entry.ScheduledDate = request.ScheduledDate;
        entry.StartTime = request.StartTime;
        entry.EndTime = request.EndTime;
        entry.Venue = request.Venue;
        entry.MaxMarks = request.MaxMarks.HasValue && request.MaxMarks.Value > 0 ? request.MaxMarks.Value : null;
        await _scheduleRepo.UpdateAsync(entry, ct);
        var exam = await _examRepo.GetByIdAsync(entry.ExamId, ct);
        string? className = null;
        if (entry.ClassId.HasValue)
        {
            var cls = await _classRepo.GetByIdAsync(entry.ClassId.Value, ct);
            className = cls?.Name;
        }
        return new ExamScheduleEntryDto
        {
            Id = entry.Id.ToString(),
            ExamId = entry.ExamId.ToString(),
            ExamName = exam?.Name,
            SubjectName = entry.SubjectName,
            ClassId = entry.ClassId?.ToString(),
            ClassName = className,
            ScheduledDate = entry.ScheduledDate,
            StartTime = entry.StartTime,
            EndTime = entry.EndTime,
            Venue = entry.Venue,
            MaxMarks = entry.MaxMarks,
            CreatedAt = entry.CreatedAt
        };
    }

    public async Task DeleteScheduleEntryAsync(string entryId, CancellationToken ct = default)
    {
        if (!Guid.TryParse(entryId, out var id))
            throw new ArgumentException("Invalid entry id.", nameof(entryId));
        await _scheduleRepo.DeleteAsync(id, ct);
    }

    private async Task<IReadOnlyList<ExamScheduleEntryDto>> MapScheduleEntriesAsync(IReadOnlyList<ExamScheduleEntry> entries, Exam? exam, CancellationToken ct)
    {
        var result = new List<ExamScheduleEntryDto>();
        foreach (var entry in entries)
        {
            string? className = null;
            if (entry.ClassId.HasValue)
            {
                var cls = await _classRepo.GetByIdAsync(entry.ClassId.Value, ct);
                className = cls?.Name;
            }
            result.Add(new ExamScheduleEntryDto
            {
                Id = entry.Id.ToString(),
                ExamId = entry.ExamId.ToString(),
                ExamName = exam?.Name,
                SubjectName = entry.SubjectName,
                ClassId = entry.ClassId?.ToString(),
                ClassName = className,
                ScheduledDate = entry.ScheduledDate,
                StartTime = entry.StartTime,
                EndTime = entry.EndTime,
                Venue = entry.Venue,
                MaxMarks = entry.MaxMarks,
                CreatedAt = entry.CreatedAt
            });
        }
        return result;
    }

    private static ExamScheduleEntry? PickScheduleEntryForMarks(IReadOnlyList<ExamScheduleEntry> entries, string subject, Guid? studentClassId)
    {
        var trimmed = subject.Trim();
        List<ExamScheduleEntry> matches = [];
        foreach (var e in entries)
        {
            if (string.Equals(e.SubjectName.Trim(), trimmed, StringComparison.OrdinalIgnoreCase))
                matches.Add(e);
        }
        if (matches.Count == 0) return null;
        if (studentClassId.HasValue)
        {
            foreach (var e in matches)
            {
                if (e.ClassId == studentClassId.Value) return e;
            }
        }
        foreach (var e in matches)
        {
            if (!e.ClassId.HasValue) return e;
        }
        return matches[0];
    }
}
