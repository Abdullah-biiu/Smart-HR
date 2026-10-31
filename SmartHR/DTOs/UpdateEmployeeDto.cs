using System.ComponentModel.DataAnnotations;

namespace SmartHR.DTOs
{
    public class UpdateEmployeeDto
    {
        [Required]
        public string EmployeeCode { get; set; } = string.Empty;

        [Required]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        public string LastName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Phone { get; set; } = string.Empty;

        [Required]
        public string DepartmentName { get; set; } = string.Empty;

        [Required]
        public string DesignationName { get; set; } = string.Empty;

        [Required]
        public DateOnly DateOfJoining { get; set; }

        [Range(0, double.MaxValue)]
        public decimal Salary { get; set; }

        public bool IsActive { get; set; } = true;
    }
}