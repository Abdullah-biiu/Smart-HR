using System.Text.Json.Serialization;

namespace SmartHR.Models
{
    public class Leave
    {
        public int Id { get; set; }

        public int EmployeeId { get; set; }

        [JsonIgnore]
        public Employee? Employee { get; set; }

        public DateOnly StartDate { get; set; }

        public DateOnly EndDate { get; set; }

        public string LeaveType { get; set; } = "Casual";

        public string Status { get; set; } = "Pending";

        public string Reason { get; set; } = string.Empty;

        public string Remarks { get; set; } = string.Empty;
    }
}