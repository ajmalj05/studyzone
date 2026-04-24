using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Studyzone.Infrastructure.Migrations;

/// <summary>
/// Adds marks approval workflow columns on <c>MarksEntries</c>. Existing rows default to <c>Approved</c>.
/// </summary>
public partial class AddMarksEntryApproval : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<DateTime>(
            name: "ApprovedAt",
            table: "MarksEntries",
            type: "timestamp with time zone",
            nullable: true);

        migrationBuilder.AddColumn<Guid>(
            name: "ApprovedByUserId",
            table: "MarksEntries",
            type: "uuid",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "RejectionReason",
            table: "MarksEntries",
            type: "text",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "Status",
            table: "MarksEntries",
            type: "text",
            nullable: false,
            defaultValue: "Approved");

        migrationBuilder.CreateIndex(
            name: "IX_MarksEntries_ExamId_Status",
            table: "MarksEntries",
            columns: new[] { "ExamId", "Status" });
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_MarksEntries_ExamId_Status",
            table: "MarksEntries");

        migrationBuilder.DropColumn(
            name: "Status",
            table: "MarksEntries");

        migrationBuilder.DropColumn(
            name: "RejectionReason",
            table: "MarksEntries");

        migrationBuilder.DropColumn(
            name: "ApprovedByUserId",
            table: "MarksEntries");

        migrationBuilder.DropColumn(
            name: "ApprovedAt",
            table: "MarksEntries");
    }
}
