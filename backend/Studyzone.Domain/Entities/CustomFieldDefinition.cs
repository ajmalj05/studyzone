namespace Studyzone.Domain.Entities;

public class CustomFieldDefinition
{
    public Guid Id { get; set; }
    public string EntityType { get; set; } = "Student";
    public string FieldName { get; set; } = string.Empty;
    public string FieldType { get; set; } = "String"; // String, Number, Date, Boolean
    public bool IsRequired { get; set; }
    public DateTime CreatedAt { get; set; }
}
