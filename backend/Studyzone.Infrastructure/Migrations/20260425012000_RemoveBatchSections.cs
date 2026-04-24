using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Studyzone.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveBatchSections : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE "Batches" DROP COLUMN IF EXISTS "Section";
                ALTER TABLE "StudentEnrollments" DROP COLUMN IF EXISTS "Section";
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE "Batches" ADD COLUMN IF NOT EXISTS "Section" text NULL;
                ALTER TABLE "StudentEnrollments" ADD COLUMN IF NOT EXISTS "Section" text NULL;
                """);
        }
    }
}
