using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartHR.Data;
using SmartHR.DTOs;
using SmartHR.Models;
using System.Security.Claims;

namespace SmartHR.Controllers
{
    [Authorize(Roles = "Admin,Employee")]
    [ApiController]
    [Route("api/[controller]")]
    public class PayrollsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PayrollsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Payrolls
        [HttpGet]
        public async Task<IActionResult> GetPayrolls()
        {
            IQueryable<Payroll> query = _context.Payrolls
                .Include(p => p.Employee);

            if (!User.IsInRole("Admin"))
            {
                var employeeId = await GetLoggedInEmployeeId();

                if (employeeId == null)
                {
                    return Forbid();
                }

                query = query.Where(p =>
                    p.EmployeeId == employeeId.Value);
            }

            var payrolls = await query
                .OrderByDescending(p => p.Year)
                .ThenByDescending(p => p.Month)
                .Select(p => new PayrollResponseDto
                {
                    Id = p.Id,
                    EmployeeId = p.EmployeeId,
                    EmployeeCode = p.Employee.EmployeeCode,
                    EmployeeName = p.Employee.FirstName + " " +
                                   p.Employee.LastName,
                    Year = p.Year,
                    Month = p.Month,
                    BasicSalary = p.BasicSalary,
                    Allowances = p.Allowances,
                    Deductions = p.Deductions,
                    NetSalary = p.NetSalary,
                    Status = p.Status,
                    PaymentDate = p.PaymentDate,
                    Remarks = p.Remarks,
                    CreatedAt = p.CreatedAt
                })
                .ToListAsync();

            return Ok(payrolls);
        }

        // GET: api/Payrolls/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetPayroll(int id)
        {
            var payroll = await _context.Payrolls
                .Where(p => p.Id == id)
                .Select(p => new PayrollResponseDto
                {
                    Id = p.Id,
                    EmployeeId = p.EmployeeId,
                    EmployeeCode = p.Employee.EmployeeCode,
                    EmployeeName = p.Employee.FirstName + " " +
                                   p.Employee.LastName,
                    Year = p.Year,
                    Month = p.Month,
                    BasicSalary = p.BasicSalary,
                    Allowances = p.Allowances,
                    Deductions = p.Deductions,
                    NetSalary = p.NetSalary,
                    Status = p.Status,
                    PaymentDate = p.PaymentDate,
                    Remarks = p.Remarks,
                    CreatedAt = p.CreatedAt
                })
                .FirstOrDefaultAsync();

            if (payroll == null)
            {
                return NotFound(new
                {
                    message = "Payroll record not found"
                });
            }

            if (!User.IsInRole("Admin"))
            {
                var employeeId = await GetLoggedInEmployeeId();

                if (employeeId == null ||
                    payroll.EmployeeId != employeeId.Value)
                {
                    return Forbid();
                }
            }

            return Ok(payroll);
        }

        // POST: api/Payrolls
        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> CreatePayroll(
            PayrollCreateDto dto)
        {
            var employee = await _context.Employees
                .FirstOrDefaultAsync(e =>
                    e.Id == dto.EmployeeId &&
                    e.IsActive);

            if (employee == null)
            {
                return BadRequest(new
                {
                    message = "Invalid or inactive EmployeeId"
                });
            }

            if (dto.Deductions >
                dto.BasicSalary + dto.Allowances)
            {
                return BadRequest(new
                {
                    message =
                        "Deductions cannot be greater than total earnings"
                });
            }

            var existingPayroll = await _context.Payrolls
                .AnyAsync(p =>
                    p.EmployeeId == dto.EmployeeId &&
                    p.Year == dto.Year &&
                    p.Month == dto.Month);

            if (existingPayroll)
            {
                return Conflict(new
                {
                    message =
                        "Payroll already exists for this employee and month"
                });
            }

            if (dto.Status == "Paid" &&
                dto.PaymentDate == null)
            {
                return BadRequest(new
                {
                    message =
                        "Payment date is required for paid payroll"
                });
            }

            var payroll = new Payroll
            {
                EmployeeId = dto.EmployeeId,
                Year = dto.Year,
                Month = dto.Month,
                BasicSalary = dto.BasicSalary,
                Allowances = dto.Allowances,
                Deductions = dto.Deductions,
                NetSalary =
                    dto.BasicSalary +
                    dto.Allowances -
                    dto.Deductions,
                Status = dto.Status.Trim(),
                PaymentDate = dto.PaymentDate,
                Remarks = dto.Remarks?.Trim() ?? string.Empty
            };

            _context.Payrolls.Add(payroll);

            await _context.SaveChangesAsync();

            var response = await GetPayrollResponse(payroll.Id);

            return CreatedAtAction(
                nameof(GetPayroll),
                new { id = payroll.Id },
                response);
        }

        // PUT: api/Payrolls/5
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePayroll(
            int id,
            PayrollUpdateDto dto)
        {
            var payroll = await _context.Payrolls
                .FirstOrDefaultAsync(p => p.Id == id);

            if (payroll == null)
            {
                return NotFound(new
                {
                    message = "Payroll record not found"
                });
            }

            if (dto.Deductions >
                dto.BasicSalary + dto.Allowances)
            {
                return BadRequest(new
                {
                    message =
                        "Deductions cannot be greater than total earnings"
                });
            }

            if (dto.Status == "Paid" &&
                dto.PaymentDate == null)
            {
                return BadRequest(new
                {
                    message =
                        "Payment date is required for paid payroll"
                });
            }

            payroll.BasicSalary = dto.BasicSalary;
            payroll.Allowances = dto.Allowances;
            payroll.Deductions = dto.Deductions;

            payroll.NetSalary =
                dto.BasicSalary +
                dto.Allowances -
                dto.Deductions;

            payroll.Status = dto.Status.Trim();
            payroll.PaymentDate = dto.PaymentDate;
            payroll.Remarks = dto.Remarks?.Trim() ?? string.Empty;

            await _context.SaveChangesAsync();

            var response = await GetPayrollResponse(payroll.Id);

            return Ok(response);
        }

        // DELETE: api/Payrolls/5
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePayroll(int id)
        {
            var payroll = await _context.Payrolls
                .FirstOrDefaultAsync(p => p.Id == id);

            if (payroll == null)
            {
                return NotFound(new
                {
                    message = "Payroll record not found"
                });
            }

            _context.Payrolls.Remove(payroll);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Payroll deleted successfully"
            });
        }

        // Maps payroll to response DTO
        private async Task<PayrollResponseDto?> GetPayrollResponse(
            int id)
        {
            return await _context.Payrolls
                .Where(p => p.Id == id)
                .Select(p => new PayrollResponseDto
                {
                    Id = p.Id,
                    EmployeeId = p.EmployeeId,
                    EmployeeCode = p.Employee.EmployeeCode,
                    EmployeeName = p.Employee.FirstName + " " +
                                   p.Employee.LastName,
                    Year = p.Year,
                    Month = p.Month,
                    BasicSalary = p.BasicSalary,
                    Allowances = p.Allowances,
                    Deductions = p.Deductions,
                    NetSalary = p.NetSalary,
                    Status = p.Status,
                    PaymentDate = p.PaymentDate,
                    Remarks = p.Remarks,
                    CreatedAt = p.CreatedAt
                })
                .FirstOrDefaultAsync();
        }

        // Gets the EmployeeId linked to the logged-in user
        private async Task<int?> GetLoggedInEmployeeId()
        {
            var userIdClaim = User.FindFirstValue(
                ClaimTypes.NameIdentifier);

            if (string.IsNullOrWhiteSpace(userIdClaim) ||
                !int.TryParse(userIdClaim, out var userId))
            {
                return null;
            }

            var user = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u =>
                    u.Id == userId &&
                    u.IsActive);

            return user?.EmployeeId;
        }
    }
}