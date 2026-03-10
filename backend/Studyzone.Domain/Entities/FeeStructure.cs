namespace Studyzone.Domain.Entities;

public class FeeStructure
{
    public Guid Id { get; set; }
    public Guid ClassId { get; set; }
    public Guid AcademicYearId { get; set; }
    public AcademicYear AcademicYear { get; set; } = null!;
    public string Name { get; set; } = string.Empty; // e.g. Tuition, Lab
    public decimal Amount { get; set; }
    public string Frequency { get; set; } = "Monthly"; // Monthly, Quarterly, HalfYearly, Yearly, Once
    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public DateTime CreatedAt { get; set; }
}
