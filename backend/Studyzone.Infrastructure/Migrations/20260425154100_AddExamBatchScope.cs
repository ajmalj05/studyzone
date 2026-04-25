using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Studyzone.Infrastructure.Migrations
{
    public partial class AddExamBatchScope : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE "ExamClasses"
                    ADD COLUMN IF NOT EXISTS "BatchId" uuid NULL;
                """);

            migrationBuilder.Sql("""
                DROP INDEX IF EXISTS "IX_ExamClasses_ExamId_ClassId";
                CREATE UNIQUE INDEX IF NOT EXISTS "IX_ExamClasses_ExamId_ClassId_BatchId"
                    ON "ExamClasses" ("ExamId", "ClassId", "BatchId");
                CREATE INDEX IF NOT EXISTS "IX_ExamClasses_BatchId" ON "ExamClasses" ("BatchId");
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DROP INDEX IF EXISTS "IX_ExamClasses_ExamId_ClassId_BatchId";
                DROP INDEX IF EXISTS "IX_ExamClasses_BatchId";
                CREATE UNIQUE INDEX IF NOT EXISTS "IX_ExamClasses_ExamId_ClassId"
                    ON "ExamClasses" ("ExamId", "ClassId");
                ALTER TABLE "ExamClasses"
                    DROP COLUMN IF EXISTS "BatchId";
                """);
        }
    }
}
