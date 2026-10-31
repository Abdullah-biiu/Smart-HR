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
    public class LeavesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;


    public LeavesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Leaves
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Leave>>> GetLeaves()
        {
            // Admin can view all leave applications.
            if (User.IsInRole("Admin"))
            {
                return await _context.Leaves
                    .OrderByDescending(l => l.StartDate)
                    .ToListAsync();
            }

            // Employee can view only their own applications.
            var employeeId = await GetLoggedInEmployeeId();

            if (employeeId == null)
                return Forbid();

            return await _context.Leaves
                .Where(l => l.EmployeeId == employeeId.Value)
                .OrderByDescending(l => l.StartDate)
                .ToListAsync();
        }

        // GET: api/Leaves/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Leave>> GetLeave(int id)
        {
            var leave = await _context.Leaves
                .FirstOrDefaultAsync(l => l.Id == id);

            if (leave == null)
            {
                return NotFound(new
                {
                    message = "Leave not found"
                });
            }

            if (User.IsInRole("Admin"))
                return leave;

            var employeeId = await GetLoggedInEmployeeId();

            if (employeeId == null ||
                leave.EmployeeId != employeeId.Value)
            {
                return Forbid();
            }

            return leave;
        }

        // GET: api/Leaves/employee/{employeeId}
        [HttpGet("employee/{employeeId}")]
        public async Task<ActionResult<IEnumerable<Leave>>> GetEmployeeLeaves(
            int employeeId)
        {
            if (User.IsInRole("Employee"))
            {
                var loggedInEmployeeId =
                    await GetLoggedInEmployeeId();

                if (loggedInEmployeeId == null ||
                    loggedInEmployeeId.Value != employeeId)
                {
                    return Forbid();
                }
            }

            var employeeExists = await _context.Employees
                .AnyAsync(e => e.Id == employeeId);

            if (!employeeExists)
            {
                return NotFound(new
                {
                    message = "Employee not found"
                });
            }

            return await _context.Leaves
                .Where(l => l.EmployeeId == employeeId)
                .OrderByDescending(l => l.StartDate)
                .ToListAsync();
        }

        // POST: api/Leaves
        [HttpPost]
        public async Task<ActionResult<Leave>> CreateLeave(
            CreateLeaveDto dto)
        {
            int employeeId = dto.EmployeeId;

            // Employees can apply only for themselves.
            if (User.IsInRole("Employee"))
            {
                var loggedInEmployeeId =
                    await GetLoggedInEmployeeId();

                if (loggedInEmployeeId == null)
                    return Forbid();

                if (dto.EmployeeId != loggedInEmployeeId.Value)
                    return Forbid();

                employeeId = loggedInEmployeeId.Value;
            }

            var employeeExists = await _context.Employees
                .AnyAsync(e =>
                    e.Id == employeeId &&
                    e.IsActive);

            if (!employeeExists)
            {
                return BadRequest(new
                {
                    message = "Invalid EmployeeId"
                });
            }

            if (dto.StartDate == default ||
                dto.EndDate == default ||
                dto.EndDate < dto.StartDate)
            {
                return BadRequest(new
                {
                    message = "Please provide valid leave dates."
                });
            }

            var leaveType = dto.LeaveType?.Trim();

            if (leaveType == null ||
                !new[] { "Casual", "Sick", "Earned", "Unpaid" }
                    .Contains(leaveType))
            {
                return BadRequest(new
                {
                    message = "Invalid leave type."
                });
            }

            // Prevent overlapping Pending or Approved applications.
            var overlappingLeave = await _context.Leaves
                .AnyAsync(l =>
                    l.EmployeeId == employeeId &&
                    l.Status != "Rejected" &&
                    dto.StartDate <= l.EndDate &&
                    dto.EndDate >= l.StartDate);

            if (overlappingLeave)
            {
                return Conflict(new
                {
                    message =
                        "An overlapping pending or approved leave already exists."
                });
            }

            var leave = new Leave
            {
                EmployeeId = employeeId,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                LeaveType = leaveType,

                // Employees cannot approve their own applications.
                Status = "Pending",

                Reason = dto.Reason?.Trim() ?? string.Empty,
                Remarks = string.Empty
            };

            _context.Leaves.Add(leave);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetLeave),
                new { id = leave.Id },
                leave);
        }

        // PUT: api/Leaves/{id}
        // Only Admin can update or approve/reject leave.
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateLeave(
            int id,
            UpdateLeaveDto dto)
        {
            var leave = await _context.Leaves
                .FirstOrDefaultAsync(l => l.Id == id);

            if (leave == null)
            {
                return NotFound(new
                {
                    message = "Leave not found"
                });
            }

            var employeeExists = await _context.Employees
                .AnyAsync(e =>
                    e.Id == dto.EmployeeId &&
                    e.IsActive);

            if (!employeeExists)
            {
                return BadRequest(new
                {
                    message = "Invalid EmployeeId"
                });
            }

            if (dto.StartDate == default ||
                dto.EndDate == default ||
                dto.EndDate < dto.StartDate)
            {
                return BadRequest(new
                {
                    message = "Please provide valid leave dates."
                });
            }

            var leaveType = dto.LeaveType?.Trim();
            var status = dto.Status?.Trim();

            if (leaveType == null ||
                !new[] { "Casual", "Sick", "Earned", "Unpaid" }
                    .Contains(leaveType))
            {
                return BadRequest(new
                {
                    message = "Invalid leave type."
                });
            }

            if (status == null ||
                !new[] { "Pending", "Approved", "Rejected" }
                    .Contains(status))
            {
                return BadRequest(new
                {
                    message = "Invalid leave status."
                });
            }

            var overlappingLeave = await _context.Leaves
                .AnyAsync(l =>
                    l.Id != id &&
                    l.EmployeeId == dto.EmployeeId &&
                    l.Status != "Rejected" &&
                    status != "Rejected" &&
                    dto.StartDate <= l.EndDate &&
                    dto.EndDate >= l.StartDate);

            if (overlappingLeave)
            {
                return Conflict(new
                {
                    message =
                        "Another pending or approved leave overlaps these dates."
                });
            }

            leave.EmployeeId = dto.EmployeeId;
            leave.StartDate = dto.StartDate;
            leave.EndDate = dto.EndDate;
            leave.LeaveType = leaveType;
            leave.Status = status;
            leave.Reason = dto.Reason?.Trim() ?? string.Empty;
            leave.Remarks = dto.Remarks?.Trim() ?? string.Empty;

            await _context.SaveChangesAsync();

            return Ok(leave);
        }

        // DELETE: api/Leaves/{id}
        // Only Admin can delete leave applications.
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLeave(int id)
        {
            var leave = await _context.Leaves
                .FindAsync(id);

            if (leave == null)
            {
                return NotFound(new
                {
                    message = "Leave not found"
                });
            }

            _context.Leaves.Remove(leave);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Leave deleted successfully"
            });
        }

        // Get EmployeeId associated with the logged-in user.
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
