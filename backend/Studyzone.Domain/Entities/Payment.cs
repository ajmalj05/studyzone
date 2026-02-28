namespace Studyzone.Domain.Entities;

public class Payment
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public decimal Amount { get; set; }
    public string Mode { get; set; } = "Cash"; // Cash, Cheque, BankTransfer, UPI, Card
    public string ReceiptNumber { get; set; } = string.Empty;
    public DateTime PaidAt { get; set; }
    public string? Reference { get; set; }
    public string? Remarks { get; set; }
    public DateTime CreatedAt { get; set; }
}
