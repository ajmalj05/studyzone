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
        migrationBuilder.Sql("""
            ALTER TABLE "MarksEntries" ADD COLUMN IF NOT EXISTS "ApprovedAt" timestamp with time zone NULL;
            ALTER TABLE "MarksEntries" ADD COLUMN IF NOT EXISTS "ApprovedByUserId" uuid NULL;
            ALTER TABLE "MarksEntries" ADD COLUMN IF NOT EXISTS "RejectionReason" text NULL;
            ALTER TABLE "MarksEntries" ADD COLUMN IF NOT EXISTS "Status" text NOT NULL DEFAULT 'Approved';
            CREATE INDEX IF NOT EXISTS "IX_MarksEntries_ExamId_Status" ON "MarksEntries" ("ExamId", "Status");
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DROP INDEX IF EXISTS "IX_MarksEntries_ExamId_Status";
            ALTER TABLE "MarksEntries" DROP COLUMN IF EXISTS "Status";
            ALTER TABLE "MarksEntries" DROP COLUMN IF EXISTS "RejectionReason";
            ALTER TABLE "MarksEntries" DROP COLUMN IF EXISTS "ApprovedByUserId";
            ALTER TABLE "MarksEntries" DROP COLUMN IF EXISTS "ApprovedAt";
            """);
    }
}
