using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Studyzone.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ApplicationFullFormFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(name: "AcademicYear", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "Gender", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "PlaceOfBirth", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "Nationality", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "Religion", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "PreviousClass", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "EmirateIfInsideUae", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "CountryIfOutsideUae", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "SyllabusPreviousSchool", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "SecondLangPreviousSchool", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<DateTime>(name: "DateOfLastAttendance", table: "Applications", type: "timestamp with time zone", nullable: true);
            migrationBuilder.AddColumn<string>(name: "PassportNo", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "PassportPlaceOfIssue", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<DateTime>(name: "PassportDateOfIssue", table: "Applications", type: "timestamp with time zone", nullable: true);
            migrationBuilder.AddColumn<DateTime>(name: "PassportDateOfExpiry", table: "Applications", type: "timestamp with time zone", nullable: true);
            migrationBuilder.AddColumn<string>(name: "ResidenceVisaNo", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "ResidenceVisaPlaceOfIssue", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<DateTime>(name: "ResidenceVisaDateOfIssue", table: "Applications", type: "timestamp with time zone", nullable: true);
            migrationBuilder.AddColumn<DateTime>(name: "ResidenceVisaDateOfExpiry", table: "Applications", type: "timestamp with time zone", nullable: true);
            migrationBuilder.AddColumn<string>(name: "EmiratesIdNo", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<DateTime>(name: "EmiratesIdDateOfExpiry", table: "Applications", type: "timestamp with time zone", nullable: true);
            migrationBuilder.AddColumn<bool>(name: "AnySpecialNeeds", table: "Applications", type: "boolean", nullable: true);
            migrationBuilder.AddColumn<string>(name: "SpecialNeedsDetails", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "PassportPhotoUrl", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "SisNo", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "RegNo", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "CheckedBy", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "OfficeSignature", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "Principal", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "ExtraCurricularSportsJson", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "ExtraCurricularActivitiesJson", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "FatherNameAsInPassport", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "FatherReligion", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "FatherNationality", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "FatherQualification", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "FatherMobileNumber", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "FatherEmailAddress", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "FatherOccupation", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "FatherCompanyName", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "FatherDesignation", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "FatherPoBoxEmirate", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "FatherOfficeTelephone", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "FatherEmiratesIdNumber", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "FatherAddressOfResidence", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "FatherAddressInHomeCountry", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "MotherNameAsInPassport", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "MotherReligion", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "MotherNationality", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "MotherQualification", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "MotherMobileNumber", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "MotherEmailAddress", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "MotherOccupation", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "MotherCompanyName", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "MotherDesignation", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "MotherPoBoxEmirate", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "MotherOfficeTelephone", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "MotherEmiratesIdNumber", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "MotherAddressOfResidence", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "MotherAddressInHomeCountry", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "OtherChildrenInSchoolJson", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "DeclarationParentNameAndSignature", table: "Applications", type: "text", nullable: true);
            migrationBuilder.AddColumn<DateTime>(name: "DeclarationDate", table: "Applications", type: "timestamp with time zone", nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "AcademicYear", table: "Applications");
            migrationBuilder.DropColumn(name: "Gender", table: "Applications");
            migrationBuilder.DropColumn(name: "PlaceOfBirth", table: "Applications");
            migrationBuilder.DropColumn(name: "Nationality", table: "Applications");
            migrationBuilder.DropColumn(name: "Religion", table: "Applications");
            migrationBuilder.DropColumn(name: "PreviousClass", table: "Applications");
            migrationBuilder.DropColumn(name: "EmirateIfInsideUae", table: "Applications");
            migrationBuilder.DropColumn(name: "CountryIfOutsideUae", table: "Applications");
            migrationBuilder.DropColumn(name: "SyllabusPreviousSchool", table: "Applications");
            migrationBuilder.DropColumn(name: "SecondLangPreviousSchool", table: "Applications");
            migrationBuilder.DropColumn(name: "DateOfLastAttendance", table: "Applications");
            migrationBuilder.DropColumn(name: "PassportNo", table: "Applications");
            migrationBuilder.DropColumn(name: "PassportPlaceOfIssue", table: "Applications");
            migrationBuilder.DropColumn(name: "PassportDateOfIssue", table: "Applications");
            migrationBuilder.DropColumn(name: "PassportDateOfExpiry", table: "Applications");
            migrationBuilder.DropColumn(name: "ResidenceVisaNo", table: "Applications");
            migrationBuilder.DropColumn(name: "ResidenceVisaPlaceOfIssue", table: "Applications");
            migrationBuilder.DropColumn(name: "ResidenceVisaDateOfIssue", table: "Applications");
            migrationBuilder.DropColumn(name: "ResidenceVisaDateOfExpiry", table: "Applications");
            migrationBuilder.DropColumn(name: "EmiratesIdNo", table: "Applications");
            migrationBuilder.DropColumn(name: "EmiratesIdDateOfExpiry", table: "Applications");
            migrationBuilder.DropColumn(name: "AnySpecialNeeds", table: "Applications");
            migrationBuilder.DropColumn(name: "SpecialNeedsDetails", table: "Applications");
            migrationBuilder.DropColumn(name: "PassportPhotoUrl", table: "Applications");
            migrationBuilder.DropColumn(name: "SisNo", table: "Applications");
            migrationBuilder.DropColumn(name: "RegNo", table: "Applications");
            migrationBuilder.DropColumn(name: "CheckedBy", table: "Applications");
            migrationBuilder.DropColumn(name: "OfficeSignature", table: "Applications");
            migrationBuilder.DropColumn(name: "Principal", table: "Applications");
            migrationBuilder.DropColumn(name: "ExtraCurricularSportsJson", table: "Applications");
            migrationBuilder.DropColumn(name: "ExtraCurricularActivitiesJson", table: "Applications");
            migrationBuilder.DropColumn(name: "FatherNameAsInPassport", table: "Applications");
            migrationBuilder.DropColumn(name: "FatherReligion", table: "Applications");
            migrationBuilder.DropColumn(name: "FatherNationality", table: "Applications");
            migrationBuilder.DropColumn(name: "FatherQualification", table: "Applications");
            migrationBuilder.DropColumn(name: "FatherMobileNumber", table: "Applications");
            migrationBuilder.DropColumn(name: "FatherEmailAddress", table: "Applications");
            migrationBuilder.DropColumn(name: "FatherOccupation", table: "Applications");
            migrationBuilder.DropColumn(name: "FatherCompanyName", table: "Applications");
            migrationBuilder.DropColumn(name: "FatherDesignation", table: "Applications");
            migrationBuilder.DropColumn(name: "FatherPoBoxEmirate", table: "Applications");
            migrationBuilder.DropColumn(name: "FatherOfficeTelephone", table: "Applications");
            migrationBuilder.DropColumn(name: "FatherEmiratesIdNumber", table: "Applications");
            migrationBuilder.DropColumn(name: "FatherAddressOfResidence", table: "Applications");
            migrationBuilder.DropColumn(name: "FatherAddressInHomeCountry", table: "Applications");
            migrationBuilder.DropColumn(name: "MotherNameAsInPassport", table: "Applications");
            migrationBuilder.DropColumn(name: "MotherReligion", table: "Applications");
            migrationBuilder.DropColumn(name: "MotherNationality", table: "Applications");
            migrationBuilder.DropColumn(name: "MotherQualification", table: "Applications");
            migrationBuilder.DropColumn(name: "MotherMobileNumber", table: "Applications");
            migrationBuilder.DropColumn(name: "MotherEmailAddress", table: "Applications");
            migrationBuilder.DropColumn(name: "MotherOccupation", table: "Applications");
            migrationBuilder.DropColumn(name: "MotherCompanyName", table: "Applications");
            migrationBuilder.DropColumn(name: "MotherDesignation", table: "Applications");
            migrationBuilder.DropColumn(name: "MotherPoBoxEmirate", table: "Applications");
            migrationBuilder.DropColumn(name: "MotherOfficeTelephone", table: "Applications");
            migrationBuilder.DropColumn(name: "MotherEmiratesIdNumber", table: "Applications");
            migrationBuilder.DropColumn(name: "MotherAddressOfResidence", table: "Applications");
            migrationBuilder.DropColumn(name: "MotherAddressInHomeCountry", table: "Applications");
            migrationBuilder.DropColumn(name: "OtherChildrenInSchoolJson", table: "Applications");
            migrationBuilder.DropColumn(name: "DeclarationParentNameAndSignature", table: "Applications");
            migrationBuilder.DropColumn(name: "DeclarationDate", table: "Applications");
        }
    }
}
