using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartHR.Data;
using SmartHR.DTOs;
using SmartHR.Models;

namespace SmartHR.Controllers
{
    [Authorize(Roles = "Admin")]
    [ApiController]
    [Route("api/[controller]")]
    public class DepartmentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DepartmentsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Departments
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Department>>> GetDepartments()
        {
            return await _context.Departments
                .Where(d => d.IsActive)
                .Include(d => d.Employees)
                .ToListAsync();
        }

        // GET: api/Departments/1
        [HttpGet("{id}")]
        public async Task<ActionResult<Department>> GetDepartment(int id)
        {
            var department = await _context.Departments
                .Include(d => d.Employees)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (department == null)
            {
                return NotFound(new
                {
                    message = "Department not found"
                });
            }

            return department;
        }

        // POST: api/Departments
        [HttpPost]
        public async Task<ActionResult<Department>> CreateDepartment(
            CreateDepartmentDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest(new
                {
                    message = "Department name is required"
                });
            }

            var departmentExists = await _context.Departments
                .AnyAsync(d =>
                    d.Name.ToLower() == dto.Name.ToLower());

            if (departmentExists)
            {
                return Conflict(new
                {
                    message = "Department already exists"
                });
            }

            var department = new Department
            {
                Name = dto.Name.Trim(),
                Description = dto.Description.Trim(),
                IsActive = true
            };

            _context.Departments.Add(department);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetDepartment),
                new { id = department.Id },
                department);
        }

        // PUT: api/Departments/1
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDepartment(
            int id,
            UpdateDepartmentDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest(new
                {
                    message = "Department name is required"
                });
            }

            var department = await _context.Departments
                .FindAsync(id);

            if (department == null)
            {
                return NotFound(new
                {
                    message = "Department not found"
                });
            }

            var departmentExists = await _context.Departments
                .AnyAsync(d =>
                    d.Id != id &&
                    d.Name.ToLower() == dto.Name.ToLower());

            if (departmentExists)
            {
                return Conflict(new
                {
                    message = "Another department with this name already exists"
                });
            }

            department.Name = dto.Name.Trim();
            department.Description = dto.Description.Trim();
            department.IsActive = dto.IsActive;

            await _context.SaveChangesAsync();

            return Ok(department);
        }

        // DELETE: api/Departments/1
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDepartment(int id)
        {
            var department = await _context.Departments
                .FindAsync(id);

            if (department == null)
            {
                return NotFound(new
                {
                    message = "Department not found"
                });
            }

            if (!department.IsActive)
            {
                return BadRequest(new
                {
                    message = "Department is already inactive"
                });
            }

            department.IsActive = false;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Department deactivated successfully"
            });
        }
    }
}