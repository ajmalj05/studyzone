using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Studyzone.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddStudentEnrollments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Create StudentEnrollments table first
            migrationBuilder.CreateTable(
                name: "StudentEnrollments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    StudentId = table.Column<Guid>(type: "uuid", nullable: false),
                    AcademicYearId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClassId = table.Column<Guid>(type: "uuid", nullable: true),
                    BatchId = table.Column<Guid>(type: "uuid", nullable: true),
                    Section = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    AdmissionNumber = table.Column<string>(type: "text", nullable: false),
                    JoinedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LeftAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentEnrollments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StudentEnrollments_AcademicYears_AcademicYearId",
                        column: x => x.AcademicYearId,
                        principalTable: "AcademicYears",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StudentEnrollments_Students_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Students",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_StudentEnrollments_AcademicYearId",
                table: "StudentEnrollments",
                column: "AcademicYearId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentEnrollments_BatchId",
                table: "StudentEnrollments",
                column: "BatchId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentEnrollments_ClassId",
                table: "StudentEnrollments",
                column: "ClassId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentEnrollments_Status",
                table: "StudentEnrollments",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_StudentEnrollments_StudentId",
                table: "StudentEnrollments",
                column: "StudentId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentEnrollments_StudentId_AcademicYearId",
                table: "StudentEnrollments",
                columns: new[] { "StudentId", "AcademicYearId" },
                unique: true);

            // 2. Copy existing Students into StudentEnrollments for current (or latest) academic year
            migrationBuilder.Sql(@"
                INSERT INTO ""StudentEnrollments"" (""Id"", ""StudentId"", ""AcademicYearId"", ""ClassId"", ""BatchId"", ""Section"", ""Status"", ""AdmissionNumber"", ""JoinedAt"", ""LeftAt"", ""CreatedAt"")
                SELECT gen_random_uuid(), s.""Id"",
                       COALESCE((SELECT ""Id"" FROM ""AcademicYears"" WHERE ""IsCurrent"" = true LIMIT 1), (SELECT ""Id"" FROM ""AcademicYears"" ORDER BY ""StartDate"" DESC LIMIT 1)),
                       s.""ClassId"", s.""BatchId"", s.""Section"", COALESCE(NULLIF(TRIM(s.""Status""), ''), 'Active'), COALESCE(NULLIF(TRIM(s.""AdmissionNumber""), ''), 'MIG'), s.""JoinedAt"", s.""LeftAt"", (NOW() AT TIME ZONE 'UTC')
                FROM ""Students"" s
                WHERE EXISTS (SELECT 1 FROM ""AcademicYears"" LIMIT 1);
            ");

            // 3. Drop columns from Students
            migrationBuilder.DropIndex(
                name: "IX_Students_BatchId",
                table: "Students");

            migrationBuilder.DropIndex(
                name: "IX_Students_ClassId",
                table: "Students");

            migrationBuilder.DropIndex(
                name: "IX_Students_Status",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "BatchId",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "ClassId",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "Section",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Students");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "StudentEnrollments");

            migrationBuilder.AddColumn<Guid>(
                name: "BatchId",
                table: "Students",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ClassId",
                table: "Students",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Section",
                table: "Students",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Students",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Students_BatchId",
                table: "Students",
                column: "BatchId");

            migrationBuilder.CreateIndex(
                name: "IX_Students_ClassId",
                table: "Students",
                column: "ClassId");

            migrationBuilder.CreateIndex(
                name: "IX_Students_Status",
                table: "Students",
                column: "Status");
        }
    }
}
