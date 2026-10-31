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
    public class AttendanceController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AttendanceController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Attendance
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Attendance>>> GetAttendances()
        {
            // Admin can see all attendance records
            if (User.IsInRole("Admin"))
            {
                return await _context.Attendances
                    .Include(a => a.Employee)
                    .OrderByDescending(a => a.AttendanceDate)
                    .ToListAsync();
            }

            // Employee can see only their own attendance
            var employeeId = await GetLoggedInEmployeeId();

            if (employeeId == null)
            {
                return Forbid();
            }

            return await _context.Attendances
                .Include(a => a.Employee)
                .Where(a => a.EmployeeId == employeeId.Value)
                .OrderByDescending(a => a.AttendanceDate)
                .ToListAsync();
        }

        // GET: api/Attendance/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Attendance>> GetAttendance(int id)
        {
            var attendance = await _context.Attendances
                .Include(a => a.Employee)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (attendance == null)
            {
                return NotFound(new
                {
                    message = "Attendance not found"
                });
            }

            // Admin can view any attendance
            if (User.IsInRole("Admin"))
            {
                return attendance;
            }

            // Employee can view only their own attendance
            var employeeId = await GetLoggedInEmployeeId();

            if (employeeId == null ||
                attendance.EmployeeId != employeeId.Value)
            {
                return Forbid();
            }

            return attendance;
        }

        // POST: api/Attendance
        [HttpPost]
        public async Task<ActionResult<Attendance>> CreateAttendance(
            CreateAttendanceDto dto)
        {
            // Employee can create only their own attendance
            if (User.IsInRole("Employee"))
            {
                var loggedInEmployeeId =
                    await GetLoggedInEmployeeId();

                if (loggedInEmployeeId == null)
                {
                    return Forbid();
                }

                if (dto.EmployeeId != loggedInEmployeeId.Value)
                {
                    return Forbid();
                }
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

            var attendanceExists = await _context.Attendances
                .AnyAsync(a =>
                    a.EmployeeId == dto.EmployeeId &&
                    a.AttendanceDate == dto.AttendanceDate);

            if (attendanceExists)
            {
                return Conflict(new
                {
                    message =
                        "Attendance already exists for this employee on this date"
                });
            }

            var attendance = new Attendance
            {
                EmployeeId = dto.EmployeeId,
                AttendanceDate = dto.AttendanceDate,
                CheckIn = dto.CheckIn,
                CheckOut = dto.CheckOut,
                Status = dto.Status.Trim(),
                Remarks = dto.Remarks.Trim()
            };

            _context.Attendances.Add(attendance);

            await _context.SaveChangesAsync();

            var createdAttendance = await _context.Attendances
                .Include(a => a.Employee)
                .FirstOrDefaultAsync(a => a.Id == attendance.Id);

            return CreatedAtAction(
                nameof(GetAttendance),
                new { id = attendance.Id },
                createdAttendance);
        }

        // PUT: api/Attendance/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAttendance(
            int id,
            UpdateAttendanceDto dto)
        {
            var attendance = await _context.Attendances
                .FirstOrDefaultAsync(a => a.Id == id);

            if (attendance == null)
            {
                return NotFound(new
                {
                    message = "Attendance not found"
                });
            }

            // Employee can update only their own attendance
            if (User.IsInRole("Employee"))
            {
                var loggedInEmployeeId =
                    await GetLoggedInEmployeeId();

                if (loggedInEmployeeId == null)
                {
                    return Forbid();
                }

                if (attendance.EmployeeId != loggedInEmployeeId.Value ||
                    dto.EmployeeId != loggedInEmployeeId.Value)
                {
                    return Forbid();
                }
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

            var attendanceExists = await _context.Attendances
                .AnyAsync(a =>
                    a.Id != id &&
                    a.EmployeeId == dto.EmployeeId &&
                    a.AttendanceDate == dto.AttendanceDate);

            if (attendanceExists)
            {
                return Conflict(new
                {
                    message =
                        "Attendance already exists for this employee on this date"
                });
            }

            attendance.EmployeeId = dto.EmployeeId;
            attendance.AttendanceDate = dto.AttendanceDate;
            attendance.CheckIn = dto.CheckIn;
            attendance.CheckOut = dto.CheckOut;
            attendance.Status = dto.Status.Trim();
            attendance.Remarks = dto.Remarks.Trim();

            await _context.SaveChangesAsync();

            var updatedAttendance = await _context.Attendances
                .Include(a => a.Employee)
                .FirstOrDefaultAsync(a => a.Id == id);

            return Ok(updatedAttendance);
        }

        // DELETE: api/Attendance/{id}
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAttendance(int id)
        {
            var attendance = await _context.Attendances
                .FindAsync(id);

            if (attendance == null)
            {
                return NotFound(new
                {
                    message = "Attendance not found"
                });
            }

            _context.Attendances.Remove(attendance);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Attendance deleted successfully"
            });
        }

        // Get EmployeeId associated with the logged-in user
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