using Studyzone.Application.Attendance;
using Studyzone.Application.Communication;
using Studyzone.Application.Fees;
using Studyzone.Application.Portal;
using Studyzone.Application.Timetable;

namespace Studyzone.Application.ParentPortal;

public class ParentChildDto
{
    public string StudentId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? AdmissionNumber { get; set; }
    public string? ClassName { get; set; }
    public string? BatchName { get; set; }
    public string? Section { get; set; }
}

public class ParentDashboardDto
{
    public string? ParentName { get; set; }
    public IReadOnlyList<ParentChildDto> Children { get; set; } = Array.Empty<ParentChildDto>();
    public int TotalChildren { get; set; }
    public decimal? TotalPendingFees { get; set; }
    public IReadOnlyList<AnnouncementDto> RecentNotices { get; set; } = Array.Empty<AnnouncementDto>();
}
