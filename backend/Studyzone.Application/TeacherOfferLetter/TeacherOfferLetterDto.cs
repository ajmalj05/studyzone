namespace Studyzone.Application.TeacherOfferLetter;

public class TeacherOfferLetterDto
{
    public string Id { get; set; } = string.Empty;
    public string CandidateName { get; set; } = string.Empty;
    public string Gender { get; set; } = "Mr";
    public string? CandidateAddress { get; set; }
    public string? PassportId { get; set; }
    public string? Designation { get; set; }
    public string? Subject { get; set; }
    public string? Phone { get; set; }
    public string? RegisterNumber { get; set; }
    public string? RefNumber { get; set; }
    public string? LetterDate { get; set; }
    public string? InterviewDate { get; set; }
    public string? JoiningDate { get; set; }
    public decimal BasicSalary { get; set; }
    public decimal HousingAllowance { get; set; }
    public decimal TransportAllowance { get; set; }
    public decimal OtherAllowances { get; set; }
    public decimal GrossSalary { get; set; }
    public string? VisaStatus { get; set; }
    public string? Medical { get; set; }
    public string? Leave { get; set; }
    public string? JoiningExpenses { get; set; }
    public string? ProbationPeriod { get; set; }
    public string? AdditionalNotes { get; set; }
    public string? TeacherUserId { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
    public string? UpdatedAt { get; set; }
}

public class CreateTeacherOfferLetterRequest
{
    public string CandidateName { get; set; } = string.Empty;
    public string Gender { get; set; } = "Mr";
    public string? CandidateAddress { get; set; }
    public string? PassportId { get; set; }
    public string? Designation { get; set; }
    public string? Subject { get; set; }
    public string? Phone { get; set; }
    public string? RegisterNumber { get; set; }
    public string? RefNumber { get; set; }
    public string? LetterDate { get; set; }
    public string? InterviewDate { get; set; }
    public string? JoiningDate { get; set; }
    public decimal BasicSalary { get; set; }
    public decimal HousingAllowance { get; set; }
    public decimal TransportAllowance { get; set; }
    public decimal OtherAllowances { get; set; }
    public string? VisaStatus { get; set; }
    public string? Medical { get; set; }
    public string? Leave { get; set; }
    public string? JoiningExpenses { get; set; }
    public string? ProbationPeriod { get; set; }
    public string? AdditionalNotes { get; set; }
    public string? TeacherUserId { get; set; }
}

public class UpdateTeacherOfferLetterRequest : CreateTeacherOfferLetterRequest { }

public class OfferLetterFieldConfigDto
{
    public string Id { get; set; } = string.Empty;
    public string FieldKey { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string? DefaultValue { get; set; }
    public bool IsVisible { get; set; }
    public bool ShowInPdf { get; set; }
    public bool IsRequired { get; set; }
    public int DisplayOrder { get; set; }
    public string FieldType { get; set; } = "text";
    public string? Section { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
    public string? UpdatedAt { get; set; }
}

public class CreateOfferLetterFieldConfigRequest
{
    public string FieldKey { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string? DefaultValue { get; set; }
    public bool IsVisible { get; set; } = true;
    public bool ShowInPdf { get; set; } = true;
    public bool IsRequired { get; set; } = false;
    public int DisplayOrder { get; set; } = 0;
    public string FieldType { get; set; } = "text";
    public string? Section { get; set; }
}

public class UpdateOfferLetterFieldConfigRequest : CreateOfferLetterFieldConfigRequest { }
