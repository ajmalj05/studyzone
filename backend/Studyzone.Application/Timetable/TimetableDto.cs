namespace Studyzone.Application.Timetable;

public class TimetableSettingsDto
{
    public int WorkingDayCount { get; set; } = 5;
    public int PeriodsPerDay { get; set; } = 6;
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
