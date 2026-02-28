namespace Studyzone.Domain.Entities;

public class FeeCharge
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public Guid FeeStructureId { get; set; }
    public string Period { get; set; } = string.Empty; // e.g. "2024-04" for April 2024
    public decimal Amount { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
}
