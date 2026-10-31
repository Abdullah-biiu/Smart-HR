using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartHR.Data;
using SmartHR.DTOs;
using SmartHR.Models;

namespace SmartHR.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,Employee")]
    public class EmployeesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public EmployeesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Employees
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Employee>>> GetEmployees()
        {
            return await _context.Employees
                .Where(e => e.IsActive)
                .Include(e => e.Department)
                .Include(e => e.Designation)
                .ToListAsync();
        }

        // GET: api/Employees/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Employee>> GetEmployee(int id)
        {
            var employee = await _context.Employees
                .Include(e => e.Department)
                .Include(e => e.Designation)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (employee == null)
            {
                return NotFound(new
                {
                    message = "Employee not found"
                });
            }

            return employee;
        }

        // POST: api/Employees
        [HttpPost]
        public async Task<IActionResult> CreateEmployee(
            CreateEmployeeDto dto)
        {
            // =========================================
            // Validate Employee Code
            // =========================================

            var employeeCode = dto.EmployeeCode.Trim();

            var existingEmployee = await _context.Employees
                .FirstOrDefaultAsync(e =>
                    e.EmployeeCode.ToLower() == employeeCode.ToLower());

            if (existingEmployee != null)
            {
                return Conflict(new
                {
                    message = "Employee code already exists."
                });
            }

            // =========================================
            // Validate Department Name
            // =========================================

            var departmentName = dto.DepartmentName.Trim();

            if (string.IsNullOrWhiteSpace(departmentName))
            {
                return BadRequest(new
                {
                    message = "Department name is required."
                });
            }

            // =========================================
            // Find Department
            // =========================================

            var department = await _context.Departments
                .FirstOrDefaultAsync(d =>
                    d.Name.ToLower() == departmentName.ToLower());

            // =========================================
            // Create Department If It Doesn't Exist
            // =========================================

            if (department == null)
            {
                department = new Department
                {
                    Name = departmentName,
                    Description = string.Empty,
                    IsActive = true
                };

                _context.Departments.Add(department);

                await _context.SaveChangesAsync();
            }
            else if (!department.IsActive)
            {
                // Reactivate an existing inactive department
                department.IsActive = true;

                await _context.SaveChangesAsync();
            }

            // =========================================
            // Validate Designation Name
            // =========================================

            var designationName = dto.DesignationName.Trim();

            if (string.IsNullOrWhiteSpace(designationName))
            {
                return BadRequest(new
                {
                    message = "Designation name is required."
                });
            }

            // =========================================
            // Find Designation
            // =========================================

            var designation = await _context.Designations
                .FirstOrDefaultAsync(d =>
                    d.Name.ToLower() == designationName.ToLower());

            // =========================================
            // Create Designation If It Doesn't Exist
            // =========================================

            if (designation == null)
            {
                designation = new Designation
                {
                    Name = designationName,
                    Description = string.Empty,
                    IsActive = true
                };

                _context.Designations.Add(designation);

                await _context.SaveChangesAsync();
            }
            else if (!designation.IsActive)
            {
                // Reactivate an existing inactive designation
                designation.IsActive = true;

                await _context.SaveChangesAsync();
            }

            // =========================================
            // Create Employee
            // =========================================

            var employee = new Employee
            {
                EmployeeCode = employeeCode,
                FirstName = dto.FirstName.Trim(),
                LastName = dto.LastName.Trim(),
                Email = dto.Email.Trim(),
                Phone = dto.Phone.Trim(),

                DepartmentId = department.Id,
                DesignationId = designation.Id,

                DateOfJoining = dto.DateOfJoining,
                Salary = dto.Salary,
                IsActive = true
            };

            // =========================================
            // Save Employee
            // =========================================

            _context.Employees.Add(employee);

            await _context.SaveChangesAsync();

            // =========================================
            // Return Created Employee
            // =========================================

            var createdEmployee = await _context.Employees
                .Include(e => e.Department)
                .Include(e => e.Designation)
                .FirstOrDefaultAsync(e => e.Id == employee.Id);

            return CreatedAtAction(
                nameof(GetEmployee),
                new { id = employee.Id },
                createdEmployee);
        }

        // PUT: api/Employees/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEmployee(
            int id,
            UpdateEmployeeDto dto)
        {
            // =========================================
            // Find Employee
            // =========================================

            var employee = await _context.Employees
                .FirstOrDefaultAsync(e => e.Id == id);

            if (employee == null)
            {
                return NotFound(new
                {
                    message = "Employee not found"
                });
            }

            // =========================================
            // Validate Employee Code
            // =========================================

            if (string.IsNullOrWhiteSpace(dto.EmployeeCode))
            {
                return BadRequest(new
                {
                    message = "Employee code is required."
                });
            }

            var employeeCode = dto.EmployeeCode.Trim();

            var employeeExists = await _context.Employees
                .AnyAsync(e =>
                    e.Id != id &&
                    e.EmployeeCode.ToLower() == employeeCode.ToLower());

            if (employeeExists)
            {
                return Conflict(new
                {
                    message = "Employee code already exists."
                });
            }

            // =========================================
            // Validate Department Name
            // =========================================

            if (string.IsNullOrWhiteSpace(dto.DepartmentName))
            {
                return BadRequest(new
                {
                    message = "Department name is required."
                });
            }

            var departmentName = dto.DepartmentName.Trim();

            // =========================================
            // Find Department
            // =========================================

            var department = await _context.Departments
                .FirstOrDefaultAsync(d =>
                    d.Name.ToLower() == departmentName.ToLower());

            // =========================================
            // Create Department If It Doesn't Exist
            // =========================================

            if (department == null)
            {
                department = new Department
                {
                    Name = departmentName,
                    Description = string.Empty,
                    IsActive = true
                };

                _context.Departments.Add(department);

                await _context.SaveChangesAsync();
            }
            else if (!department.IsActive)
            {
                // Reactivate existing inactive department
                department.IsActive = true;

                await _context.SaveChangesAsync();
            }

            // =========================================
            // Validate Designation Name
            // =========================================

            if (string.IsNullOrWhiteSpace(dto.DesignationName))
            {
                return BadRequest(new
                {
                    message = "Designation name is required."
                });
            }

            var designationName = dto.DesignationName.Trim();

            // =========================================
            // Find Designation
            // =========================================

            var designation = await _context.Designations
                .FirstOrDefaultAsync(d =>
                    d.Name.ToLower() == designationName.ToLower());

            // =========================================
            // Create Designation If It Doesn't Exist
            // =========================================

            if (designation == null)
            {
                designation = new Designation
                {
                    Name = designationName,
                    Description = string.Empty,
                    IsActive = true
                };

                _context.Designations.Add(designation);

                await _context.SaveChangesAsync();
            }
            else if (!designation.IsActive)
            {
                // Reactivate existing inactive designation
                designation.IsActive = true;

                await _context.SaveChangesAsync();
            }

            // =========================================
            // Update Employee
            // =========================================

            employee.EmployeeCode = employeeCode;
            employee.FirstName = dto.FirstName.Trim();
            employee.LastName = dto.LastName.Trim();
            employee.Email = dto.Email.Trim();
            employee.Phone = dto.Phone.Trim();

            employee.DepartmentId = department.Id;
            employee.DesignationId = designation.Id;

            employee.DateOfJoining = dto.DateOfJoining;
            employee.Salary = dto.Salary;
            employee.IsActive = dto.IsActive;

            // =========================================
            // Save Employee
            // =========================================

            await _context.SaveChangesAsync();

            // =========================================
            // Reload Employee With Relationships
            // =========================================

            var updatedEmployee = await _context.Employees
                .Include(e => e.Department)
                .Include(e => e.Designation)
                .FirstOrDefaultAsync(e => e.Id == id);

            return Ok(updatedEmployee);
        }

        // DELETE: api/Employees/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEmployee(int id)
        {
            var employee = await _context.Employees.FindAsync(id);

            if (employee == null)
            {
                return NotFound(new
                {
                    message = "Employee not found"
                });
            }

            if (!employee.IsActive)
            {
                return BadRequest(new
                {
                    message = "Employee is already inactive"
                });
            }

            employee.IsActive = false;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Employee deactivated successfully"
            });
        }
    }
}