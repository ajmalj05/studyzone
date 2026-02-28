namespace Studyzone.Domain.Entities;

public class ReceiptSequence
{
    public Guid Id { get; set; }
    public string Prefix { get; set; } = string.Empty; // e.g. "RCP-202404"
    public int LastNumber { get; set; }
}
