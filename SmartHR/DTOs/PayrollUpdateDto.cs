using System.ComponentModel.DataAnnotations;

namespace SmartHR.DTOs
{
    public class PayrollUpdateDto
    {
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