using System.Text.Json.Serialization;

namespace SmartHR.Models
{
    public class Attendance
    {
        public int Id { get; set; }

        public int EmployeeId { get; set; }

        [JsonIgnore]
        public Employee? Employee { get; set; }

        public DateOnly AttendanceDate { get; set; }

        public TimeOnly? CheckIn { get; set; }

        public TimeOnly? CheckOut { get; set; }

        public string Status { get; set; } = "Present";

        public string Remarks { get; set; } = string.Empty;
    }
}