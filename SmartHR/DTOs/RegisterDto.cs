using System.ComponentModel.DataAnnotations;

namespace SmartHR.DTOs
{
    public class RegisterDto
    {
        [Required]
        [StringLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;

        [Required]
        [RegularExpression(
            "^(Admin|Employee)$",
            ErrorMessage = "Role must be Admin or Employee.")]
        public string Role { get; set; } = "Employee";

        public int? EmployeeId { get; set; }
    }
}