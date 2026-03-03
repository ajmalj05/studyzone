using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Studyzone.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBatchClassTeacherUserId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ClassTeacherUserId",
                table: "Batches",
                type: "uuid",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ClassTeacherUserId",
                table: "Batches");
        }
    }
}
