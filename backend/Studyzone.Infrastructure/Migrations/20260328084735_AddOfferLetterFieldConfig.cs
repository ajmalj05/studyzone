using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Studyzone.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOfferLetterFieldConfig : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                CREATE TABLE IF NOT EXISTS "OfferLetterFieldConfigs" (
                    "Id"           uuid NOT NULL,
                    "FieldKey"     text NOT NULL,
                    "Label"        text NOT NULL,
                    "DefaultValue" text NULL,
                    "IsVisible"    boolean NOT NULL,
                    "ShowInPdf"    boolean NOT NULL,
                    "IsRequired"   boolean NOT NULL,
                    "DisplayOrder" integer NOT NULL,
                    "FieldType"    text NOT NULL,
                    "Section"      text NULL,
                    "CreatedAt"    timestamp with time zone NOT NULL,
                    "UpdatedAt"    timestamp with time zone NULL,
                    CONSTRAINT "PK_OfferLetterFieldConfigs" PRIMARY KEY ("Id")
                );

                CREATE INDEX IF NOT EXISTS "IX_OfferLetterFieldConfigs_DisplayOrder"
                    ON "OfferLetterFieldConfigs" ("DisplayOrder");
                CREATE UNIQUE INDEX IF NOT EXISTS "IX_OfferLetterFieldConfigs_FieldKey"
                    ON "OfferLetterFieldConfigs" ("FieldKey");
                CREATE INDEX IF NOT EXISTS "IX_OfferLetterFieldConfigs_Section"
                    ON "OfferLetterFieldConfigs" ("Section");
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"DROP TABLE IF EXISTS ""OfferLetterFieldConfigs"";");
        }
    }
}
