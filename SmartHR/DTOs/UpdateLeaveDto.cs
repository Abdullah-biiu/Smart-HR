using System.ComponentModel.DataAnnotations;

namespace SmartHR.DTOs
{
    public class UpdateLeaveDto
    {
        [Required]
        public int EmployeeId { get; set; }

        [Required]
        public DateOnly StartDate { get; set; }

        [Required]
        public DateOnly EndDate { get; set; }

        [RegularExpression(
            "^(Casual|Sick|Earned|Unpaid)$",
            ErrorMessage = "LeaveType must be Casual, Sick, Earned, or Unpaid.")]
        public string LeaveType { get; set; } = "Casual";

        [RegularExpression(
            "^(Pending|Approved|Rejected)$",
            ErrorMessage = "Status must be Pending, Approved, or Rejected.")]
        public string Status { get; set; } = "Pending";

        public string Reason { get; set; } = string.Empty;

        public string Remarks { get; set; } = string.Empty;
    }
}