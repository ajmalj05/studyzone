using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Studyzone.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTeacherSalaryPayments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TeacherSalaryPayments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TeacherUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Year = table.Column<int>(type: "integer", nullable: false),
                    Month = table.Column<int>(type: "integer", nullable: false),
                    BaseAmount = table.Column<decimal>(type: "numeric", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    PaidAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TeacherSalaryPayments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TeacherSalaryPaymentLines",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TeacherSalaryPaymentId = table.Column<Guid>(type: "uuid", nullable: false),
                    LineType = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TeacherSalaryPaymentLines", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TeacherSalaryPaymentLines_TeacherSalaryPayments_TeacherSala~",
                        column: x => x.TeacherSalaryPaymentId,
                        principalTable: "TeacherSalaryPayments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TeacherSalaryPaymentLines_TeacherSalaryPaymentId",
                table: "TeacherSalaryPaymentLines",
                column: "TeacherSalaryPaymentId");

            migrationBuilder.CreateIndex(
                name: "IX_TeacherSalaryPayments_TeacherUserId",
                table: "TeacherSalaryPayments",
                column: "TeacherUserId");

            migrationBuilder.CreateIndex(
                name: "IX_TeacherSalaryPayments_TeacherUserId_Year_Month",
                table: "TeacherSalaryPayments",
                columns: new[] { "TeacherUserId", "Year", "Month" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TeacherSalaryPayments_Year_Month",
                table: "TeacherSalaryPayments",
                columns: new[] { "Year", "Month" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TeacherSalaryPaymentLines");

            migrationBuilder.DropTable(
                name: "TeacherSalaryPayments");
        }
    }
}
