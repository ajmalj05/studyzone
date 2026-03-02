namespace Studyzone.Domain.Entities;

public class TeacherSalaryPaymentLine
{
    public Guid Id { get; set; }
    public Guid TeacherSalaryPaymentId { get; set; }
    public TeacherSalaryPayment TeacherSalaryPayment { get; set; } = null!;
    public string LineType { get; set; } = "Deduction"; // Deduction, Addition
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; } // Always positive; Deduction subtracts, Addition adds
}
