using Studyzone.Application.Administration;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Application.Notifications;
using Studyzone.Application.Requests;
using Studyzone.Domain.Entities;

namespace Studyzone.Infrastructure.Services;

public class RequestsService : IRequestsService
{
    private readonly IPortalRequestRepository _repo;
    private readonly IUserManagementService _userService;
    private readonly IStudentRepository _studentRepo;
    private readonly INotificationService _notificationService;

    public RequestsService(
        IPortalRequestRepository repo,
        IUserManagementService userService,
        IStudentRepository studentRepo,
        INotificationService notificationService)
    {
        _repo = repo;
        _userService = userService;
        _studentRepo = studentRepo;
        _notificationService = notificationService;
    }

    public async Task<IReadOnlyList<RequestDto>> GetAsync(string? role, string? userId, CancellationToken ct = default)
    {
        Guid? uid = null;
        if (!string.IsNullOrWhiteSpace(userId) && Guid.TryParse(userId, out var g))
            uid = g;
        var list = await _repo.GetAsync(role, uid, ct);
        var result = new List<RequestDto>();
        foreach (var e in list)
            result.Add(await MapAsync(e, ct));
        return result;
    }

    public async Task<RequestDto?> GetByIdAsync(string id, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid)) return null;
        var e = await _repo.GetByIdAsync(guid, ct);
        return e == null ? null : await MapAsync(e, ct);
    }

    public async Task<RequestDto> CreateAsync(CreateRequestRequest request, CancellationToken ct = default)
    {
        if (!Guid.TryParse(request.UserId, out var uid))
            throw new ArgumentException("Invalid user id.");
        var entity = new PortalRequest
        {
            UserId = uid,
            Role = request.Role ?? "",
            RequestType = request.RequestType ?? "",
            Subject = request.Subject ?? "",
            Message = request.Message ?? "",
            Status = "Pending"
        };
        var added = await _repo.AddAsync(entity, ct);
        var user = await _userService.GetByIdAsync(added.UserId.ToString(), ct);
        var senderName = user?.Name ?? "Unknown";
        await _notificationService.CreateForAdminsAsync("PortalRequest", $"New request from {senderName}: {added.Subject}", added.Id, ct);
        return (await MapAsync(added, ct))!;
    }

    public async Task<RequestDto> UpdateAsync(string id, UpdateRequestRequest request, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid))
            throw new ArgumentException("Invalid id.");
        var existing = await _repo.GetByIdAsync(guid, ct) ?? throw new ArgumentException("Request not found.");
        existing.Status = request.Status ?? existing.Status;
        existing.AdminComment = request.AdminComment;
        var updated = await _repo.UpdateAsync(existing, ct);
        if (string.Equals(existing.Role, "parent", StringComparison.OrdinalIgnoreCase))
            await _notificationService.CreateForUserAsync(existing.UserId.ToString(), "PortalRequest", $"Admin responded to your request: {existing.Subject}", existing.Id, ct);
        return (await MapAsync(updated, ct))!;
    }

    private async Task<RequestDto> MapAsync(PortalRequest e, CancellationToken ct)
    {
        var user = await _userService.GetByIdAsync(e.UserId.ToString(), ct);
        string? registerNumber = null;
        string? phone = null;
        if (user != null)
        {
            if (string.Equals(e.Role, "student", StringComparison.OrdinalIgnoreCase))
            {
                var student = await _studentRepo.GetByUserIdAsync(e.UserId, ct);
                if (student != null)
                {
                    registerNumber = student.AdmissionNumber;
                    phone = student.GuardianPhone;
                }
            }
            else
            {
                registerNumber = user.UserId;
                phone = null;
            }
        }
        return new RequestDto
        {
            Id = e.Id.ToString(),
            UserId = user == null ? null : new RequestUserDto
            {
                Name = user.Name,
                RegisterNumber = registerNumber ?? user.UserId,
                Phone = phone
            },
            Role = e.Role,
            RequestType = e.RequestType,
            Subject = e.Subject,
            Message = e.Message,
            Status = e.Status,
            AdminComment = e.AdminComment,
            CreatedAt = e.CreatedAt
        };
    }
}
