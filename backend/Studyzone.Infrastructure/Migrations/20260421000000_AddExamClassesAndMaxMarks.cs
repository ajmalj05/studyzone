using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Studyzone.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddExamClassesAndMaxMarks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE ""Exams""
                    ADD COLUMN IF NOT EXISTS ""MaxMarks"" numeric NULL;
            ");

            migrationBuilder.Sql(@"
                CREATE TABLE IF NOT EXISTS ""ExamClasses"" (
                    ""Id""      uuid NOT NULL DEFAULT gen_random_uuid(),
                    ""ExamId""  uuid NOT NULL,
                    ""ClassId"" uuid NOT NULL,
                    CONSTRAINT ""PK_ExamClasses"" PRIMARY KEY (""Id"")
                );
                CREATE UNIQUE INDEX IF NOT EXISTS ""IX_ExamClasses_ExamId_ClassId"" ON ""ExamClasses"" (""ExamId"", ""ClassId"");
                CREATE INDEX IF NOT EXISTS ""IX_ExamClasses_ExamId"" ON ""ExamClasses"" (""ExamId"");
            ");

            // Migrate existing exams with a ClassId into the junction table
            migrationBuilder.Sql(@"
                INSERT INTO ""ExamClasses"" (""Id"", ""ExamId"", ""ClassId"")
                SELECT gen_random_uuid(), ""Id"", ""ClassId""
                FROM ""Exams""
                WHERE ""ClassId"" IS NOT NULL
                ON CONFLICT DO NOTHING;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"DROP TABLE IF EXISTS ""ExamClasses"";");
            migrationBuilder.Sql(@"ALTER TABLE ""Exams"" DROP COLUMN IF EXISTS ""MaxMarks"";");
        }
    }
}
