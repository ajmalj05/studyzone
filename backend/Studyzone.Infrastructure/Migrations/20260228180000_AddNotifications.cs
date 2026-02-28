using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Studyzone.Infrastructure.Migrations
{
    [Migration("20260228180000_AddNotifications")]
    public partial class AddNotifications : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Notifications') THEN
    CREATE TABLE ""Notifications"" (
      ""Id"" uuid NOT NULL,
      ""UserId"" uuid NOT NULL,
      ""Type"" text NOT NULL,
      ""Title"" text NOT NULL,
      ""RelatedEntityId"" uuid NULL,
      ""CreatedAt"" timestamp with time zone NOT NULL,
      CONSTRAINT ""PK_Notifications"" PRIMARY KEY (""Id"")
    );
    CREATE INDEX ""IX_Notifications_UserId"" ON ""Notifications"" (""UserId"");
    CREATE INDEX ""IX_Notifications_CreatedAt"" ON ""Notifications"" (""CreatedAt"");
  END IF;
END $$;");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"DROP TABLE IF EXISTS ""Notifications"";");
        }
    }
}
