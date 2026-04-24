using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Studyzone.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddStudentFeeOffer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                CREATE TABLE IF NOT EXISTS "StudentFeeOffers" (
                    "Id"             uuid NOT NULL,
                    "StudentId"      uuid NOT NULL,
                    "AcademicYearId" uuid NOT NULL,
                    "OfferType"      text NOT NULL,
                    "Value"          numeric NOT NULL,
                    "Reason"         text NULL,
                    "EffectiveFrom"  timestamp with time zone NULL,
                    "EffectiveTo"    timestamp with time zone NULL,
                    "CreatedAt"      timestamp with time zone NOT NULL,
                    CONSTRAINT "PK_StudentFeeOffers" PRIMARY KEY ("Id"),
                    CONSTRAINT "FK_StudentFeeOffers_AcademicYears_AcademicYearId"
                        FOREIGN KEY ("AcademicYearId") REFERENCES "AcademicYears" ("Id") ON DELETE CASCADE,
                    CONSTRAINT "FK_StudentFeeOffers_Students_StudentId"
                        FOREIGN KEY ("StudentId") REFERENCES "Students" ("Id") ON DELETE CASCADE
                );

                CREATE INDEX IF NOT EXISTS "IX_StudentFeeOffers_AcademicYearId"
                    ON "StudentFeeOffers" ("AcademicYearId");
                CREATE INDEX IF NOT EXISTS "IX_StudentFeeOffers_StudentId"
                    ON "StudentFeeOffers" ("StudentId");
                CREATE UNIQUE INDEX IF NOT EXISTS "IX_StudentFeeOffers_StudentId_AcademicYearId"
                    ON "StudentFeeOffers" ("StudentId", "AcademicYearId");
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"DROP TABLE IF EXISTS ""StudentFeeOffers"";");
        }
    }
}
