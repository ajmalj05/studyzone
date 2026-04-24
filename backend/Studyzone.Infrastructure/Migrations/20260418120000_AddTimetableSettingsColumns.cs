using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Studyzone.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTimetableSettingsColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Use raw SQL so re-running on a DB that already has these columns (via
            // the idempotent migration) does not throw.
            migrationBuilder.Sql(@"
                ALTER TABLE ""TimetableSettings""
                    ADD COLUMN IF NOT EXISTS ""SchoolStartTime""      text        NOT NULL DEFAULT '08:00',
                    ADD COLUMN IF NOT EXISTS ""PeriodDurationMinutes"" integer     NOT NULL DEFAULT 45,
                    ADD COLUMN IF NOT EXISTS ""BreaksJson""            text        NULL;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BreaksJson",
                table: "TimetableSettings");

            migrationBuilder.DropColumn(
                name: "PeriodDurationMinutes",
                table: "TimetableSettings");

            migrationBuilder.DropColumn(
                name: "SchoolStartTime",
                table: "TimetableSettings");
        }
    }
}
