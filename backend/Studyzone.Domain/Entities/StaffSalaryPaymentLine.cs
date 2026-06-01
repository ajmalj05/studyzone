using System;

namespace Studyzone.Domain.Entities;

public class StaffSalaryPaymentLine
{
    public Guid Id { get; set; }
    public Guid StaffSalaryPaymentId { get; set; }
    public StaffSalaryPayment StaffSalaryPayment { get; set; } = null!;
    public string LineType { get; set; } = "Deduction"; // Deduction, Addition
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; } // Always positive; Deduction subtracts, Addition adds
}
