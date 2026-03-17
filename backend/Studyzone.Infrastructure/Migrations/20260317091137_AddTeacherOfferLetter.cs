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
            migrationBuilder.CreateTable(
                name: "TeacherOfferLetters",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CandidateName = table.Column<string>(type: "text", nullable: false),
                    Gender = table.Column<string>(type: "text", nullable: false),
                    CandidateAddress = table.Column<string>(type: "text", nullable: true),
                    PassportId = table.Column<string>(type: "text", nullable: true),
                    Designation = table.Column<string>(type: "text", nullable: true),
                    Subject = table.Column<string>(type: "text", nullable: true),
                    Phone = table.Column<string>(type: "text", nullable: true),
                    RegisterNumber = table.Column<string>(type: "text", nullable: true),
                    RefNumber = table.Column<string>(type: "text", nullable: true),
                    LetterDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    InterviewDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    JoiningDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    BasicSalary = table.Column<decimal>(type: "numeric", nullable: false),
                    HousingAllowance = table.Column<decimal>(type: "numeric", nullable: false),
                    TransportAllowance = table.Column<decimal>(type: "numeric", nullable: false),
                    OtherAllowances = table.Column<decimal>(type: "numeric", nullable: false),
                    VisaStatus = table.Column<string>(type: "text", nullable: true),
                    Medical = table.Column<string>(type: "text", nullable: true),
                    Leave = table.Column<string>(type: "text", nullable: true),
                    JoiningExpenses = table.Column<string>(type: "text", nullable: true),
                    ProbationPeriod = table.Column<string>(type: "text", nullable: true),
                    AdditionalNotes = table.Column<string>(type: "text", nullable: true),
                    TeacherUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TeacherOfferLetters", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TeacherOfferLetters_CandidateName",
                table: "TeacherOfferLetters",
                column: "CandidateName");

            migrationBuilder.CreateIndex(
                name: "IX_TeacherOfferLetters_CreatedAt",
                table: "TeacherOfferLetters",
                column: "CreatedAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TeacherOfferLetters");
        }
    }
}
