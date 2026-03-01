namespace Studyzone.Application.Admission;

public class ApplicationDto
{
    public string Id { get; set; } = string.Empty;
    public string? EnquiryId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? AdmissionNumber { get; set; }
    public string? ClassId { get; set; }
    public string? BatchId { get; set; }
    public string? Batch { get; set; }
    public string? Section { get; set; }
    public DateTime CreatedAt { get; set; }

    // Student details
    public string? AcademicYear { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string? Gender { get; set; }
    public string? PlaceOfBirth { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Nationality { get; set; }
    public string? Religion { get; set; }
    public string? PreviousSchool { get; set; }
    public string? PreviousClass { get; set; }
    public string? EmirateIfInsideUae { get; set; }
    public string? ClassApplied { get; set; }
    public string? CountryIfOutsideUae { get; set; }
    public string? SyllabusPreviousSchool { get; set; }
    public string? SecondLangPreviousSchool { get; set; }
    public DateTime? DateOfLastAttendance { get; set; }
    public string? PassportNo { get; set; }
    public string? PassportPlaceOfIssue { get; set; }
    public DateTime? PassportDateOfIssue { get; set; }
    public DateTime? PassportDateOfExpiry { get; set; }
    public string? ResidenceVisaNo { get; set; }
    public string? ResidenceVisaPlaceOfIssue { get; set; }
    public DateTime? ResidenceVisaDateOfIssue { get; set; }
    public DateTime? ResidenceVisaDateOfExpiry { get; set; }
    public string? EmiratesIdNo { get; set; }
    public DateTime? EmiratesIdDateOfExpiry { get; set; }
    public bool? AnySpecialNeeds { get; set; }
    public string? SpecialNeedsDetails { get; set; }
    public string? PassportPhotoUrl { get; set; }

    public string? SisNo { get; set; }
    public string? RegNo { get; set; }
    public string? CheckedBy { get; set; }
    public string? OfficeSignature { get; set; }
    public string? Principal { get; set; }

    public List<string>? ExtraCurricularSports { get; set; }
    public List<string>? ExtraCurricularActivities { get; set; }

    public string? FatherNameAsInPassport { get; set; }
    public string? FatherReligion { get; set; }
    public string? FatherNationality { get; set; }
    public string? FatherQualification { get; set; }
    public string? FatherMobileNumber { get; set; }
    public string? FatherEmailAddress { get; set; }
    public string? FatherOccupation { get; set; }
    public string? FatherCompanyName { get; set; }
    public string? FatherDesignation { get; set; }
    public string? FatherPoBoxEmirate { get; set; }
    public string? FatherOfficeTelephone { get; set; }
    public string? FatherEmiratesIdNumber { get; set; }
    public string? FatherAddressOfResidence { get; set; }
    public string? FatherAddressInHomeCountry { get; set; }

    public string? MotherNameAsInPassport { get; set; }
    public string? MotherReligion { get; set; }
    public string? MotherNationality { get; set; }
    public string? MotherQualification { get; set; }
    public string? MotherMobileNumber { get; set; }
    public string? MotherEmailAddress { get; set; }
    public string? MotherOccupation { get; set; }
    public string? MotherCompanyName { get; set; }
    public string? MotherDesignation { get; set; }
    public string? MotherPoBoxEmirate { get; set; }
    public string? MotherOfficeTelephone { get; set; }
    public string? MotherEmiratesIdNumber { get; set; }
    public string? MotherAddressOfResidence { get; set; }
    public string? MotherAddressInHomeCountry { get; set; }

    public List<SiblingInSchoolDto>? OtherChildrenInSchool { get; set; }
    public string? DeclarationParentNameAndSignature { get; set; }
    public DateTime? DeclarationDate { get; set; }

    public string? GuardianName { get; set; }
    public string? GuardianPhone { get; set; }
    public string? GuardianEmail { get; set; }
    public string? SubjectsRequired { get; set; }
    public DateTime? InterviewDate { get; set; }
    public string? InterviewNotes { get; set; }
}

public class SiblingInSchoolDto
{
    public string Name { get; set; } = string.Empty;
    public string Class { get; set; } = string.Empty;
}

public class CreateApplicationRequest
{
    public string? EnquiryId { get; set; }
    public string? AcademicYear { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string? Gender { get; set; }
    public string? PlaceOfBirth { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Nationality { get; set; }
    public string? Religion { get; set; }
    public string? PreviousSchool { get; set; }
    public string? PreviousClass { get; set; }
    public string? EmirateIfInsideUae { get; set; }
    public string? ClassApplied { get; set; }
    public string? CountryIfOutsideUae { get; set; }
    public string? SyllabusPreviousSchool { get; set; }
    public string? SecondLangPreviousSchool { get; set; }
    public DateTime? DateOfLastAttendance { get; set; }
    public string? PassportNo { get; set; }
    public string? PassportPlaceOfIssue { get; set; }
    public DateTime? PassportDateOfIssue { get; set; }
    public DateTime? PassportDateOfExpiry { get; set; }
    public string? ResidenceVisaNo { get; set; }
    public string? ResidenceVisaPlaceOfIssue { get; set; }
    public DateTime? ResidenceVisaDateOfIssue { get; set; }
    public DateTime? ResidenceVisaDateOfExpiry { get; set; }
    public string? EmiratesIdNo { get; set; }
    public DateTime? EmiratesIdDateOfExpiry { get; set; }
    public bool? AnySpecialNeeds { get; set; }
    public string? SpecialNeedsDetails { get; set; }
    public string? PassportPhotoUrl { get; set; }
    public string? ClassId { get; set; }
    public string? BatchId { get; set; }
    public string? SisNo { get; set; }
    public string? RegNo { get; set; }
    public string? CheckedBy { get; set; }
    public string? OfficeSignature { get; set; }
    public string? Principal { get; set; }
    public List<string>? ExtraCurricularSports { get; set; }
    public List<string>? ExtraCurricularActivities { get; set; }
    public string? FatherNameAsInPassport { get; set; }
    public string? FatherReligion { get; set; }
    public string? FatherNationality { get; set; }
    public string? FatherQualification { get; set; }
    public string? FatherMobileNumber { get; set; }
    public string? FatherEmailAddress { get; set; }
    public string? FatherOccupation { get; set; }
    public string? FatherCompanyName { get; set; }
    public string? FatherDesignation { get; set; }
    public string? FatherPoBoxEmirate { get; set; }
    public string? FatherOfficeTelephone { get; set; }
    public string? FatherEmiratesIdNumber { get; set; }
    public string? FatherAddressOfResidence { get; set; }
    public string? FatherAddressInHomeCountry { get; set; }
    public string? MotherNameAsInPassport { get; set; }
    public string? MotherReligion { get; set; }
    public string? MotherNationality { get; set; }
    public string? MotherQualification { get; set; }
    public string? MotherMobileNumber { get; set; }
    public string? MotherEmailAddress { get; set; }
    public string? MotherOccupation { get; set; }
    public string? MotherCompanyName { get; set; }
    public string? MotherDesignation { get; set; }
    public string? MotherPoBoxEmirate { get; set; }
    public string? MotherOfficeTelephone { get; set; }
    public string? MotherEmiratesIdNumber { get; set; }
    public string? MotherAddressOfResidence { get; set; }
    public string? MotherAddressInHomeCountry { get; set; }
    public List<SiblingInSchoolDto>? OtherChildrenInSchool { get; set; }
    public string? DeclarationParentNameAndSignature { get; set; }
    public DateTime? DeclarationDate { get; set; }
}

public class UpdateApplicationRequest
{
    public string? AcademicYear { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string? Gender { get; set; }
    public string? PlaceOfBirth { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Nationality { get; set; }
    public string? Religion { get; set; }
    public string? PreviousSchool { get; set; }
    public string? PreviousClass { get; set; }
    public string? EmirateIfInsideUae { get; set; }
    public string? ClassApplied { get; set; }
    public string? CountryIfOutsideUae { get; set; }
    public string? SyllabusPreviousSchool { get; set; }
    public string? SecondLangPreviousSchool { get; set; }
    public DateTime? DateOfLastAttendance { get; set; }
    public string? PassportNo { get; set; }
    public string? PassportPlaceOfIssue { get; set; }
    public DateTime? PassportDateOfIssue { get; set; }
    public DateTime? PassportDateOfExpiry { get; set; }
    public string? ResidenceVisaNo { get; set; }
    public string? ResidenceVisaPlaceOfIssue { get; set; }
    public DateTime? ResidenceVisaDateOfIssue { get; set; }
    public DateTime? ResidenceVisaDateOfExpiry { get; set; }
    public string? EmiratesIdNo { get; set; }
    public DateTime? EmiratesIdDateOfExpiry { get; set; }
    public bool? AnySpecialNeeds { get; set; }
    public string? SpecialNeedsDetails { get; set; }
    public string? PassportPhotoUrl { get; set; }
    public string? ClassId { get; set; }
    public string? BatchId { get; set; }
    public string? Batch { get; set; }
    public string? Section { get; set; }
    public string? SisNo { get; set; }
    public string? RegNo { get; set; }
    public string? CheckedBy { get; set; }
    public string? OfficeSignature { get; set; }
    public string? Principal { get; set; }
    public List<string>? ExtraCurricularSports { get; set; }
    public List<string>? ExtraCurricularActivities { get; set; }
    public string? FatherNameAsInPassport { get; set; }
    public string? FatherReligion { get; set; }
    public string? FatherNationality { get; set; }
    public string? FatherQualification { get; set; }
    public string? FatherMobileNumber { get; set; }
    public string? FatherEmailAddress { get; set; }
    public string? FatherOccupation { get; set; }
    public string? FatherCompanyName { get; set; }
    public string? FatherDesignation { get; set; }
    public string? FatherPoBoxEmirate { get; set; }
    public string? FatherOfficeTelephone { get; set; }
    public string? FatherEmiratesIdNumber { get; set; }
    public string? FatherAddressOfResidence { get; set; }
    public string? FatherAddressInHomeCountry { get; set; }
    public string? MotherNameAsInPassport { get; set; }
    public string? MotherReligion { get; set; }
    public string? MotherNationality { get; set; }
    public string? MotherQualification { get; set; }
    public string? MotherMobileNumber { get; set; }
    public string? MotherEmailAddress { get; set; }
    public string? MotherOccupation { get; set; }
    public string? MotherCompanyName { get; set; }
    public string? MotherDesignation { get; set; }
    public string? MotherPoBoxEmirate { get; set; }
    public string? MotherOfficeTelephone { get; set; }
    public string? MotherEmiratesIdNumber { get; set; }
    public string? MotherAddressOfResidence { get; set; }
    public string? MotherAddressInHomeCountry { get; set; }
    public List<SiblingInSchoolDto>? OtherChildrenInSchool { get; set; }
    public string? DeclarationParentNameAndSignature { get; set; }
    public DateTime? DeclarationDate { get; set; }
    public DateTime? InterviewDate { get; set; }
    public string? InterviewNotes { get; set; }
}

public class SubmitForApprovalRequest
{
    public string? Batch { get; set; }
    public string? Section { get; set; }
}

public class ApprovalDecisionRequest
{
    public string Status { get; set; } = string.Empty;
    public string? Reason { get; set; }
    public string? ClassId { get; set; }
    public string? BatchId { get; set; }
}
