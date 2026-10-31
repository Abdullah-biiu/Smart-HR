using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace SmartHR.Migrations
{
    /// <inheritdoc />
    public partial class AddDesignations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Create the Designations table
            migrationBuilder.CreateTable(
                name: "Designations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation(
                            "Npgsql:ValueGenerationStrategy",
                            NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),

                    Name = table.Column<string>(
                        type: "text",
                        nullable: false),

                    Description = table.Column<string>(
                        type: "text",
                        nullable: false),

                    IsActive = table.Column<bool>(
                        type: "boolean",
                        nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Designations", x => x.Id);
                });

            // 2. Insert the existing designation
            migrationBuilder.InsertData(
                table: "Designations",
                columns: new[] { "Name", "Description", "IsActive" },
                values: new object[]
                {
            "Software Developer",
            "Software development and application engineering",
            true
                });

            // 3. Add DesignationId temporarily as nullable
            migrationBuilder.AddColumn<int>(
                name: "DesignationId",
                table: "Employees",
                type: "integer",
                nullable: true);

            // 4. Connect existing employees to Software Developer (Id = 1)
            migrationBuilder.Sql(
                """
        UPDATE "Employees"
        SET "DesignationId" = 1
        WHERE "Designation" = 'Software Developer';
        """);

            // 5. Make DesignationId required
            migrationBuilder.AlterColumn<int>(
                name: "DesignationId",
                table: "Employees",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            // 6. Remove the old Designation text column
            migrationBuilder.DropColumn(
                name: "Designation",
                table: "Employees");

            // 7. Create index
            migrationBuilder.CreateIndex(
                name: "IX_Employees_DesignationId",
                table: "Employees",
                column: "DesignationId");

            // 8. Create foreign key
            migrationBuilder.AddForeignKey(
                name: "FK_Employees_Designations_DesignationId",
                table: "Employees",
                column: "DesignationId",
                principalTable: "Designations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Employees_Designations_DesignationId",
                table: "Employees");

            migrationBuilder.DropTable(
                name: "Designations");

            migrationBuilder.DropIndex(
                name: "IX_Employees_DesignationId",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "DesignationId",
                table: "Employees");

            migrationBuilder.AddColumn<string>(
                name: "Designation",
                table: "Employees",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}
