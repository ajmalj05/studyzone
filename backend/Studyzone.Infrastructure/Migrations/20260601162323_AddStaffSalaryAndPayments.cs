using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Studyzone.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddStaffSalaryAndPayments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "SchoolStartTime",
                table: "TimetableSettings",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text",
                oldDefaultValue: "08:00");

            migrationBuilder.AlterColumn<int>(
                name: "PeriodDurationMinutes",
                table: "TimetableSettings",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldDefaultValue: 45);

            migrationBuilder.Sql(@"
                CREATE TABLE IF NOT EXISTS ""ExamScheduleEntries"" (
                    ""Id""            uuid        NOT NULL PRIMARY KEY,
                    ""ExamId""        uuid        NOT NULL,
                    ""SubjectName""   text        NOT NULL,
                    ""ClassId""       uuid        NULL,
                    ""ScheduledDate"" timestamp with time zone NOT NULL,
                    ""StartTime""     text        NULL,
                    ""EndTime""       text        NULL,
                    ""Venue""         text        NULL,
                    ""MaxMarks""      numeric     NULL,
                    ""CreatedAt""     timestamp with time zone NOT NULL
                );
            ");

            migrationBuilder.CreateTable(
                name: "StaffSalaries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    StaffUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    EffectiveFrom = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EffectiveTo = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Amount = table.Column<decimal>(type: "numeric", nullable: false),
                    PayFrequency = table.Column<string>(type: "text", nullable: false),
                    Currency = table.Column<string>(type: "text", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StaffSalaries", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "StaffSalaryPayments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    StaffUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Year = table.Column<int>(type: "integer", nullable: false),
                    Month = table.Column<int>(type: "integer", nullable: false),
                    BaseAmount = table.Column<decimal>(type: "numeric", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    PaidAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StaffSalaryPayments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "StaffSalaryPaymentLines",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    StaffSalaryPaymentId = table.Column<Guid>(type: "uuid", nullable: false),
                    LineType = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StaffSalaryPaymentLines", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StaffSalaryPaymentLines_StaffSalaryPayments_StaffSalaryPaym~",
                        column: x => x.StaffSalaryPaymentId,
                        principalTable: "StaffSalaryPayments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.Sql(@"
                CREATE INDEX IF NOT EXISTS ""IX_ExamScheduleEntries_ExamId""
                    ON ""ExamScheduleEntries"" (""ExamId"");
                CREATE INDEX IF NOT EXISTS ""IX_ExamScheduleEntries_ExamId_SubjectName""
                    ON ""ExamScheduleEntries"" (""ExamId"", ""SubjectName"");
            ");

            migrationBuilder.CreateIndex(
                name: "IX_StaffSalaries_EffectiveFrom",
                table: "StaffSalaries",
                column: "EffectiveFrom");

            migrationBuilder.CreateIndex(
                name: "IX_StaffSalaries_StaffUserId",
                table: "StaffSalaries",
                column: "StaffUserId");

            migrationBuilder.CreateIndex(
                name: "IX_StaffSalaryPaymentLines_StaffSalaryPaymentId",
                table: "StaffSalaryPaymentLines",
                column: "StaffSalaryPaymentId");

            migrationBuilder.CreateIndex(
                name: "IX_StaffSalaryPayments_StaffUserId",
                table: "StaffSalaryPayments",
                column: "StaffUserId");

            migrationBuilder.CreateIndex(
                name: "IX_StaffSalaryPayments_StaffUserId_Year_Month",
                table: "StaffSalaryPayments",
                columns: new[] { "StaffUserId", "Year", "Month" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StaffSalaryPayments_Year_Month",
                table: "StaffSalaryPayments",
                columns: new[] { "Year", "Month" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ExamScheduleEntries");

            migrationBuilder.DropTable(
                name: "StaffSalaries");

            migrationBuilder.DropTable(
                name: "StaffSalaryPaymentLines");

            migrationBuilder.DropTable(
                name: "StaffSalaryPayments");

            migrationBuilder.AlterColumn<string>(
                name: "SchoolStartTime",
                table: "TimetableSettings",
                type: "text",
                nullable: false,
                defaultValue: "08:00",
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<int>(
                name: "PeriodDurationMinutes",
                table: "TimetableSettings",
                type: "integer",
                nullable: false,
                defaultValue: 45,
                oldClrType: typeof(int),
                oldType: "integer");
        }
    }
}
