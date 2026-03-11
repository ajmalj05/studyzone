namespace Studyzone.Domain.Entities;

public class StudentFeeOffer
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public Student Student { get; set; } = null!;
    public Guid AcademicYearId { get; set; }
    public AcademicYear AcademicYear { get; set; } = null!;
    /// <summary>e.g. "PercentageDiscount" or "FixedDiscount"</summary>
    public string OfferType { get; set; } = "PercentageDiscount";
    /// <summary>e.g. 20 for 20%, or 500 for ₹500 off per charge</summary>
    public decimal Value { get; set; }
    public string? Reason { get; set; }
    public DateTime? EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public DateTime CreatedAt { get; set; }
}
