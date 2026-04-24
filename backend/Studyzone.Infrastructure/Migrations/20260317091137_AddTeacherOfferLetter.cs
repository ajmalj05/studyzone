using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Studyzone.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTeacherOfferLetter : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                CREATE TABLE IF NOT EXISTS "TeacherOfferLetters" (
                    "Id"               uuid NOT NULL,
                    "CandidateName"    text NOT NULL,
                    "Gender"           text NOT NULL,
                    "CandidateAddress" text NULL,
                    "PassportId"       text NULL,
                    "Designation"      text NULL,
                    "Subject"          text NULL,
                    "Phone"            text NULL,
                    "RegisterNumber"   text NULL,
                    "RefNumber"        text NULL,
                    "LetterDate"       timestamp with time zone NULL,
                    "InterviewDate"    timestamp with time zone NULL,
                    "JoiningDate"      timestamp with time zone NULL,
                    "BasicSalary"      numeric NOT NULL,
                    "HousingAllowance" numeric NOT NULL,
                    "TransportAllowance" numeric NOT NULL,
                    "OtherAllowances"  numeric NOT NULL,
                    "VisaStatus"       text NULL,
                    "Medical"          text NULL,
                    "Leave"            text NULL,
                    "JoiningExpenses"  text NULL,
                    "ProbationPeriod"  text NULL,
                    "AdditionalNotes"  text NULL,
                    "TeacherUserId"    uuid NULL,
                    "CreatedAt"        timestamp with time zone NOT NULL,
                    "UpdatedAt"        timestamp with time zone NULL,
                    CONSTRAINT "PK_TeacherOfferLetters" PRIMARY KEY ("Id")
                );

                CREATE INDEX IF NOT EXISTS "IX_TeacherOfferLetters_CandidateName"
                    ON "TeacherOfferLetters" ("CandidateName");
                CREATE INDEX IF NOT EXISTS "IX_TeacherOfferLetters_CreatedAt"
                    ON "TeacherOfferLetters" ("CreatedAt");
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"DROP TABLE IF EXISTS ""TeacherOfferLetters"";");
        }
    }
}
