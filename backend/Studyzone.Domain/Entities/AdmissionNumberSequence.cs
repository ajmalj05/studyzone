namespace Studyzone.Domain.Entities;

public class AdmissionNumberSequence
{
    public Guid Id { get; set; }
    public string AcademicYearName { get; set; } = string.Empty;
    public string ClassCode { get; set; } = string.Empty;
    public int LastNumber { get; set; }
}
