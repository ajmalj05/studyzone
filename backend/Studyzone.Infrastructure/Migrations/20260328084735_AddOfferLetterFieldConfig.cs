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
            migrationBuilder.CreateTable(
                name: "OfferLetterFieldConfigs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FieldKey = table.Column<string>(type: "text", nullable: false),
                    Label = table.Column<string>(type: "text", nullable: false),
                    DefaultValue = table.Column<string>(type: "text", nullable: true),
                    IsVisible = table.Column<bool>(type: "boolean", nullable: false),
                    ShowInPdf = table.Column<bool>(type: "boolean", nullable: false),
                    IsRequired = table.Column<bool>(type: "boolean", nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    FieldType = table.Column<string>(type: "text", nullable: false),
                    Section = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OfferLetterFieldConfigs", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_OfferLetterFieldConfigs_DisplayOrder",
                table: "OfferLetterFieldConfigs",
                column: "DisplayOrder");

            migrationBuilder.CreateIndex(
                name: "IX_OfferLetterFieldConfigs_FieldKey",
                table: "OfferLetterFieldConfigs",
                column: "FieldKey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OfferLetterFieldConfigs_Section",
                table: "OfferLetterFieldConfigs",
                column: "Section");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OfferLetterFieldConfigs");
        }
    }
}
