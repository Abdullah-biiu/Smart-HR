




namespace SmartHR.Models
{
    public class Employee
    {
        public int Id { get; set; }

        public string EmployeeCode { get; set; } = string.Empty;

        public string FirstName { get; set; } = string.Empty;

        public string LastName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string Phone { get; set; } = string.Empty;

        public int DepartmentId { get; set; }

        public Department? Department { get; set; }

        public int DesignationId { get; set; }

        public Designation? Designation { get; set; }

        public DateOnly DateOfJoining { get; set; }

        public decimal Salary { get; set; }

        public bool IsActive { get; set; } = true;
    }
}