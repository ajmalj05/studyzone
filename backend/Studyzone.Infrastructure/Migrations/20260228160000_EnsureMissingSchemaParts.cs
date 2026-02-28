using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Studyzone.Infrastructure.Migrations
{
    /// <inheritdoc />
    [Migration("20260228160000_EnsureMissingSchemaParts")]
    public partial class EnsureMissingSchemaParts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Idempotent: add Applications.BatchId if missing (for DBs created before AddBatchIdToApplication)
            migrationBuilder.Sql(@"
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Applications' AND column_name = 'BatchId'
  ) THEN
    ALTER TABLE ""Applications"" ADD COLUMN ""BatchId"" uuid NULL;
  END IF;
END $$;");

            // Idempotent: create PortalRequests if missing (for DBs created before table was in model)
            migrationBuilder.Sql(@"
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'PortalRequests') THEN
    CREATE TABLE ""PortalRequests"" (
      ""Id"" uuid NOT NULL,
      ""UserId"" uuid NOT NULL,
      ""Role"" text NOT NULL,
      ""RequestType"" text NOT NULL,
      ""Subject"" text NOT NULL,
      ""Message"" text NOT NULL,
      ""Status"" text NOT NULL,
      ""AdminComment"" text NULL,
      ""CreatedAt"" timestamp with time zone NOT NULL,
      ""UpdatedAt"" timestamp with time zone NULL,
      CONSTRAINT ""PK_PortalRequests"" PRIMARY KEY (""Id"")
    );
    CREATE INDEX ""IX_PortalRequests_UserId"" ON ""PortalRequests"" (""UserId"");
    CREATE INDEX ""IX_PortalRequests_Role"" ON ""PortalRequests"" (""Role"");
    CREATE INDEX ""IX_PortalRequests_Status"" ON ""PortalRequests"" (""Status"");
  END IF;
END $$;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Applications' AND column_name = 'BatchId') THEN
    ALTER TABLE ""Applications"" DROP COLUMN ""BatchId"";
  END IF;
END $$;");
            migrationBuilder.Sql(@"DROP TABLE IF EXISTS ""PortalRequests"";");
        }
    }
}
