namespace Studyzone.Domain.Entities;

public class TeacherSalaryPayment
{
    public Guid Id { get; set; }
    public Guid TeacherUserId { get; set; }
    public int Year { get; set; }
    public int Month { get; set; }
    public decimal BaseAmount { get; set; }
    public string Status { get; set; } = "Draft"; // Draft, Pending, Paid
    public DateTime? PaidAt { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public ICollection<TeacherSalaryPaymentLine> Lines { get; set; } = new List<TeacherSalaryPaymentLine>();
}
