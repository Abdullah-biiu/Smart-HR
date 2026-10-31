using System.Text.Json.Serialization;

namespace SmartHR.Models
{
    public class Payroll
    {
        public int Id { get; set; }

        public int EmployeeId { get; set; }

        [JsonIgnore]
        public Employee? Employee { get; set; }

        // Payroll period
        public int Year { get; set; }
        public int Month { get; set; }

        // Salary details
        public decimal BasicSalary { get; set; }
        public decimal Allowances { get; set; }
        public decimal Deductions { get; set; }
        public decimal NetSalary { get; set; }

        // Payroll status
        public string Status { get; set; } = "Pending";

        public DateTime? PaymentDate { get; set; }

        public string Remarks { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}