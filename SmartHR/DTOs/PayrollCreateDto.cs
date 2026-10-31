using System.ComponentModel.DataAnnotations;

namespace SmartHR.DTOs
{
    public class PayrollCreateDto
    {
        [Required]
        public int EmployeeId { get; set; }

        [Range(2000, 2100)]
        public int Year { get; set; }

        [Range(1, 12)]
        public int Month { get; set; }

        [Range(0, double.MaxValue)]
        public decimal BasicSalary { get; set; }

        [Range(0, double.MaxValue)]
        public decimal Allowances { get; set; }

        [Range(0, double.MaxValue)]
        public decimal Deductions { get; set; }

        [RegularExpression(
            "^(Pending|Paid|Cancelled)$",
            ErrorMessage = "Status must be Pending, Paid, or Cancelled.")]
        public string Status { get; set; } = "Pending";

        public DateTime? PaymentDate { get; set; }

        public string Remarks { get; set; } = string.Empty;
    }
}