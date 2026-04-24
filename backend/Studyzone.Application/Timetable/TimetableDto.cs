namespace Studyzone.Application.Timetable;

public class TimetableSettingsDto
{
    public int WorkingDayCount { get; set; } = 5;
    public int PeriodsPerDay { get; set; } = 6;
    /// <summary>HH:mm (24h), e.g. 08:00.</summary>
    public string SchoolStartTime { get; set; } = "08:00";
    public int PeriodDurationMinutes { get; set; } = 45;
    public List<TimetableBreakDto> Breaks { get; set; } = new();
}

public class TimetableBreakDto
{
    public string Id { get; set; } = string.Empty;
    public int AfterPeriod { get; set; }
    public int DurationMinutes { get; set; }
    /// <summary>e.g. "all"</summary>
    public string AppliesTo { get; set; } = "all";
}

public class PeriodConfigDto
{
    public string Id { get; set; } = string.Empty;
    public int DayOfWeek { get; set; }
    public int PeriodOrder { get; set; }
    public string StartTime { get; set; } = string.Empty; // "HH:mm"
    public string EndTime { get; set; } = string.Empty;
    public bool IsBreak { get; set; }
    public string? Label { get; set; }
}

public class TeacherForSubjectDto
{
    public string Id { get; set; } = string.Empty; // User.Id (guid)
    public string Name { get; set; } = string.Empty;
}

public class TimetableSlotDto
{
    public string Id { get; set; } = string.Empty;
    public string BatchId { get; set; } = string.Empty;
    public string BatchName { get; set; } = string.Empty;
    public int DayOfWeek { get; set; }
    public int PeriodOrder { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string? Room { get; set; }
    public string? TeacherUserId { get; set; }
    public string? TeacherName { get; set; }
    public bool IsPublished { get; set; }
}
