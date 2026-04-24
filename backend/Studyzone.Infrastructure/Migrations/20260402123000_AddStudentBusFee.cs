using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Studyzone.Infrastructure.Migrations
{
    public partial class AddStudentBusFee : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE "StudentEnrollments"
                    ADD COLUMN IF NOT EXISTS "BusFeeAmount" numeric NULL;
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE "StudentEnrollments"
                    DROP COLUMN IF EXISTS "BusFeeAmount";
                """);
        }
    }
}
