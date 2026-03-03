using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Studyzone.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAcademicYearToBatchAndFeeStructure : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AcademicYearId",
                table: "Batches",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "AcademicYearId",
                table: "FeeStructures",
                type: "uuid",
                nullable: true);

            // Ensure at least one academic year exists for backfill
            migrationBuilder.Sql(@"
                INSERT INTO ""AcademicYears"" (""Id"", ""Name"", ""StartDate"", ""EndDate"", ""IsCurrent"", ""IsArchived"", ""CreatedAt"")
                SELECT gen_random_uuid(), '2024-2025', '2024-04-01'::timestamptz, '2025-03-31'::timestamptz, true, false, NOW()
                WHERE NOT EXISTS (SELECT 1 FROM ""AcademicYears"" LIMIT 1);
            ");

            // Backfill Batches: set AcademicYearId to current or latest academic year
            migrationBuilder.Sql(@"
                UPDATE ""Batches""
                SET ""AcademicYearId"" = COALESCE(
                    (SELECT ""Id"" FROM ""AcademicYears"" WHERE ""IsCurrent"" = true LIMIT 1),
                    (SELECT ""Id"" FROM ""AcademicYears"" ORDER BY ""StartDate"" DESC LIMIT 1)
                )
                WHERE ""AcademicYearId"" IS NULL;
            ");

            // Backfill FeeStructures
            migrationBuilder.Sql(@"
                UPDATE ""FeeStructures""
                SET ""AcademicYearId"" = COALESCE(
                    (SELECT ""Id"" FROM ""AcademicYears"" WHERE ""IsCurrent"" = true LIMIT 1),
                    (SELECT ""Id"" FROM ""AcademicYears"" ORDER BY ""StartDate"" DESC LIMIT 1)
                )
                WHERE ""AcademicYearId"" IS NULL;
            ");

            migrationBuilder.AlterColumn<Guid>(
                name: "AcademicYearId",
                table: "Batches",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "AcademicYearId",
                table: "FeeStructures",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Batches_AcademicYearId",
                table: "Batches",
                column: "AcademicYearId");

            migrationBuilder.CreateIndex(
                name: "IX_Batches_ClassId_AcademicYearId_Name",
                table: "Batches",
                columns: new[] { "ClassId", "AcademicYearId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FeeStructures_AcademicYearId",
                table: "FeeStructures",
                column: "AcademicYearId");

            migrationBuilder.CreateIndex(
                name: "IX_FeeStructures_ClassId_AcademicYearId_Name",
                table: "FeeStructures",
                columns: new[] { "ClassId", "AcademicYearId", "Name" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Batches_AcademicYears_AcademicYearId",
                table: "Batches",
                column: "AcademicYearId",
                principalTable: "AcademicYears",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_FeeStructures_AcademicYears_AcademicYearId",
                table: "FeeStructures",
                column: "AcademicYearId",
                principalTable: "AcademicYears",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Batches_AcademicYears_AcademicYearId",
                table: "Batches");

            migrationBuilder.DropForeignKey(
                name: "FK_FeeStructures_AcademicYears_AcademicYearId",
                table: "FeeStructures");

            migrationBuilder.DropIndex(
                name: "IX_Batches_AcademicYearId",
                table: "Batches");

            migrationBuilder.DropIndex(
                name: "IX_Batches_ClassId_AcademicYearId_Name",
                table: "Batches");

            migrationBuilder.DropIndex(
                name: "IX_FeeStructures_AcademicYearId",
                table: "FeeStructures");

            migrationBuilder.DropIndex(
                name: "IX_FeeStructures_ClassId_AcademicYearId_Name",
                table: "FeeStructures");

            migrationBuilder.DropColumn(
                name: "AcademicYearId",
                table: "Batches");

            migrationBuilder.DropColumn(
                name: "AcademicYearId",
                table: "FeeStructures");
        }
    }
}
