using Studyzone.Application.Administration;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Application.ParentPortal;
using Studyzone.Domain.Entities;

namespace Studyzone.Infrastructure.Services;

public class ParentManagementService : IParentManagementService
{
    private readonly IUserManagementService _userService;
    private readonly IStudentParentRepository _studentParentRepo;
    private readonly IStudentRepository _studentRepo;
    private readonly IClassRepository _classRepo;

    public ParentManagementService(
        IUserManagementService userService,
        IStudentParentRepository studentParentRepo,
        IStudentRepository studentRepo,
        IClassRepository classRepo)
    {
        _userService = userService;
        _studentParentRepo = studentParentRepo;
        _studentRepo = studentRepo;
        _classRepo = classRepo;
    }

    public async Task<IReadOnlyList<ParentWithLinksDto>> GetParentsWithLinksAsync(CancellationToken ct = default)
    {
        var users = await _userService.GetAllAsync("parent", ct);
        var result = new List<ParentWithLinksDto>();
        foreach (var u in users)
        {
            if (!Guid.TryParse(u.Id, out var parentGuid)) continue;
            var links = await _studentParentRepo.GetByParentUserIdAsync(parentGuid, ct);
            var linkedStudents = new List<LinkedStudentDto>();
            foreach (var link in links)
            {
                var student = await _studentRepo.GetByIdAsync(link.StudentId, ct);
                if (student == null) continue;
                string? className = null;
                if (student.ClassId.HasValue)
                    className = (await _classRepo.GetByIdAsync(student.ClassId.Value, ct))?.Name;
                linkedStudents.Add(new LinkedStudentDto
                {
                    StudentId = student.Id.ToString(),
                    StudentName = student.Name,
                    AdmissionNumber = student.AdmissionNumber,
                    ClassName = className
                });
            }
            result.Add(new ParentWithLinksDto
            {
                Id = u.Id,
                UserId = u.UserId,
                Name = u.Name,
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt,
                LinkedStudents = linkedStudents
            });
        }
        return result;
    }

    public async Task LinkStudentAsync(string parentUserId, string studentId, CancellationToken ct = default)
    {
        if (!Guid.TryParse(parentUserId, out var parentGuid) || !Guid.TryParse(studentId, out var studentGuid))
            throw new ArgumentException("Invalid parent or student id.");
        var existing = await _studentParentRepo.GetAsync(studentGuid, parentGuid, ct);
        if (existing != null) return;
        var entity = new StudentParent
        {
            Id = Guid.NewGuid(),
            StudentId = studentGuid,
            ParentUserId = parentGuid,
            IsPrimary = false,
            CreatedAt = DateTime.UtcNow
        };
        await _studentParentRepo.AddAsync(entity, ct);
    }

    public async Task UnlinkStudentAsync(string parentUserId, string studentId, CancellationToken ct = default)
    {
        if (!Guid.TryParse(parentUserId, out var parentGuid) || !Guid.TryParse(studentId, out var studentGuid))
            throw new ArgumentException("Invalid parent or student id.");
        await _studentParentRepo.RemoveAsync(studentGuid, parentGuid, ct);
    }
}
