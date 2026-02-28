namespace Studyzone.Domain.Entities;

public class PeriodConfig
{
    public Guid Id { get; set; }
    public int DayOfWeek { get; set; } // 1=Monday .. 7=Sunday
    public int PeriodOrder { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public bool IsBreak { get; set; }
    public string? Label { get; set; }
}
