namespace Studyzone.Domain.Entities;

public class TimetableSettings
{
    public Guid Id { get; set; }
    public int WorkingDayCount { get; set; } = 5; // 1=Mon only .. 7=full week; 5 = Mon–Fri
    public int PeriodsPerDay { get; set; } = 6;
    /// <summary>First teaching period start, HH:mm (24h).</summary>
    public string SchoolStartTime { get; set; } = "08:00";
    public int PeriodDurationMinutes { get; set; } = 45;
    /// <summary>JSON array of break rules (afterPeriod, durationMinutes, appliesTo).</summary>
    public string? BreaksJson { get; set; }
}
