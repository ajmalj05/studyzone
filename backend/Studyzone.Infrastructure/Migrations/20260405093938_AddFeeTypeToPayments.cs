using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Studyzone.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFeeTypeToPayments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FeeType",
                table: "Payments",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FeeType",
                table: "Payments");
        }
    }
}
