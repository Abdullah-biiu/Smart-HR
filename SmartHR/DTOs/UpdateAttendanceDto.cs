using System.ComponentModel.DataAnnotations;

namespace SmartHR.DTOs
{
    public class UpdateAttendanceDto
    {
        [Required]
        public int EmployeeId { get; set; }

        [Required]
        public DateOnly AttendanceDate { get; set; }

        public TimeOnly? CheckIn { get; set; }

        public TimeOnly? CheckOut { get; set; }

        public string Status { get; set; } = "Present";

        public string Remarks { get; set; } = string.Empty;
    }
}