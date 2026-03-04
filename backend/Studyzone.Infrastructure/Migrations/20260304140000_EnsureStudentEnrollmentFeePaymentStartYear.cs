using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Studyzone.Infrastructure.Migrations
{
    /// <summary>
    /// Idempotent: ensures FeePaymentStartYear exists on StudentEnrollments (fixes DBs where 20260304120000 did not apply).
    /// </summary>
    [Migration("20260304140000_EnsureStudentEnrollmentFeePaymentStartYear")]
    public partial class EnsureStudentEnrollmentFeePaymentStartYear : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'StudentEnrollments' AND column_name = 'FeePaymentStartYear'
  ) THEN
    ALTER TABLE ""StudentEnrollments"" ADD COLUMN ""FeePaymentStartYear"" integer NULL;
  END IF;
END $$;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'StudentEnrollments' AND column_name = 'FeePaymentStartYear'
  ) THEN
    ALTER TABLE ""StudentEnrollments"" DROP COLUMN ""FeePaymentStartYear"";
  END IF;
END $$;");
        }
    }
}
