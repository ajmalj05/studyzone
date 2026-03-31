namespace Studyzone.Domain.Entities;

public class OfferLetterFieldConfig
{
    public Guid Id { get; set; }
    public string FieldKey { get; set; } = string.Empty; // e.g., "visaStatus", "medical"
    public string Label { get; set; } = string.Empty; // Display label
    public string? DefaultValue { get; set; } // Default value for the field
    public bool IsVisible { get; set; } = true; // Show in form
    public bool ShowInPdf { get; set; } = true; // Show in PDF if has value
    public bool IsRequired { get; set; } = false;
    public int DisplayOrder { get; set; } = 0;
    public string FieldType { get; set; } = "text"; // text, textarea, number, date, select
    public string? Section { get; set; } // "candidate", "salary", "terms"
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}