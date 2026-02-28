using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Studyzone.Infrastructure.Migrations
{
    [Migration("20260228170000_AddStudentParents")]
    public partial class AddStudentParents : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'StudentParents') THEN
    CREATE TABLE ""StudentParents"" (
      ""Id"" uuid NOT NULL,
      ""StudentId"" uuid NOT NULL,
      ""ParentUserId"" uuid NOT NULL,
      ""IsPrimary"" boolean NOT NULL DEFAULT false,
      ""CreatedAt"" timestamp with time zone NOT NULL,
      CONSTRAINT ""PK_StudentParents"" PRIMARY KEY (""Id"")
    );
    CREATE INDEX ""IX_StudentParents_ParentUserId"" ON ""StudentParents"" (""ParentUserId"");
    CREATE INDEX ""IX_StudentParents_StudentId"" ON ""StudentParents"" (""StudentId"");
    CREATE UNIQUE INDEX ""IX_StudentParents_StudentId_ParentUserId"" ON ""StudentParents"" (""StudentId"", ""ParentUserId"");
  END IF;
END $$;");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"DROP TABLE IF EXISTS ""StudentParents"";");
        }
    }
}
