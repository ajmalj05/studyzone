using Studyzone.Application.Communication;

namespace Studyzone.Application.Portal;

public class StudentPortalProfileDto
{
    public string Id { get; set; } = string.Empty;
    public string AdmissionNumber { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? ClassName { get; set; }
    public string? BatchName { get; set; }
}

public class StudentPortalDashboardDto
{
    public StudentPortalProfileDto? Student { get; set; }
    public double? AttendancePercent { get; set; }
    public decimal PendingFees { get; set; }
    public int UpcomingExamsCount { get; set; }
}

// Teacher portal
public class TeacherPortalDashboardDto
{
    public string? TeacherName { get; set; }
    public IReadOnlyList<TeacherTodaySlotDto> TodaySlots { get; set; } = Array.Empty<TeacherTodaySlotDto>();
    public int ClassesTodayCount { get; set; }
    public int PendingAttendanceCount { get; set; }
    public decimal? CurrentSalaryAmount { get; set; }
    public IReadOnlyList<AnnouncementDto> Notices { get; set; } = Array.Empty<AnnouncementDto>();
}

public class TeacherTodaySlotDto
{
    public string Id { get; set; } = string.Empty;
    public string BatchName { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string? Room { get; set; }
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
}
