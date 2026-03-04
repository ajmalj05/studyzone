namespace Studyzone.Domain.Entities;

public class TimetableSettings
{
    public Guid Id { get; set; }
    public int WorkingDayCount { get; set; } = 5; // 1=Mon only .. 7=full week; 5 = Mon–Fri
    public int PeriodsPerDay { get; set; } = 6;
}
