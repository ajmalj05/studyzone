namespace Studyzone.Domain.Entities;

public class TeacherOfferLetter
{
    public Guid Id { get; set; }

    // Candidate details
    public string CandidateName { get; set; } = string.Empty;
    public string Gender { get; set; } = "Mr"; // Mr | Ms
    public string? CandidateAddress { get; set; }
    public string? PassportId { get; set; }
    public string? Designation { get; set; }
    public string? Subject { get; set; }
    public string? Phone { get; set; }
    public string? RegisterNumber { get; set; }

    // Letter metadata
    public string? RefNumber { get; set; }
    public DateTime? LetterDate { get; set; }
    public DateTime? InterviewDate { get; set; }
    public DateTime? JoiningDate { get; set; }

    // Salary breakdown
    public decimal BasicSalary { get; set; }
    public decimal HousingAllowance { get; set; }
    public decimal TransportAllowance { get; set; }
    public decimal OtherAllowances { get; set; }
    public string? VisaStatus { get; set; }

    // Terms
    public string? Medical { get; set; }
    public string? Leave { get; set; }
    public string? JoiningExpenses { get; set; }
    public string? ProbationPeriod { get; set; }
    public string? AdditionalNotes { get; set; }

    // Optional: link to teacher user account after creation
    public Guid? TeacherUserId { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
