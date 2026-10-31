using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SmartHR.Data;
using SmartHR.DTOs;
using SmartHR.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace SmartHR.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly PasswordHasher<User> _passwordHasher;
        private readonly IConfiguration _configuration;

        public AuthController(
            ApplicationDbContext context,
            IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
            _passwordHasher = new PasswordHasher<User>();
        }

        // ============================================
        // REGISTER
        // ============================================

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto dto)
        {
            var email = dto.Email.Trim().ToLowerInvariant();

            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == email);

            if (existingUser != null)
            {
                return Conflict(new
                {
                    message = "Email is already registered"
                });
            }

            if (dto.EmployeeId.HasValue)
            {
                var employeeExists = await _context.Employees
                    .AnyAsync(e =>
                        e.Id == dto.EmployeeId.Value &&
                        e.IsActive);

                if (!employeeExists)
                {
                    return BadRequest(new
                    {
                        message = "Invalid or inactive EmployeeId"
                    });
                }
            }

            var user = new User
            {
                FullName = dto.FullName.Trim(),
                Email = email,
                Role = dto.Role.Trim(),
                EmployeeId = dto.EmployeeId,
                IsActive = true
            };

            user.PasswordHash = _passwordHasher.HashPassword(
                user,
                dto.Password
            );

            _context.Users.Add(user);

            await _context.SaveChangesAsync();

            return StatusCode(201, new
            {
                message = "User registered successfully",

                user = new
                {
                    user.Id,
                    user.FullName,
                    user.Email,
                    user.Role,
                    user.EmployeeId,
                    user.IsActive,
                    user.CreatedAt
                }
            });
        }

        // ============================================
        // LOGIN
        // ============================================

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            var email = dto.Email.Trim().ToLowerInvariant();

            var user = await _context.Users
                .FirstOrDefaultAsync(u =>
                    u.Email == email &&
                    u.IsActive);

            if (user == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid email or password"
                });
            }

            var passwordResult = _passwordHasher.VerifyHashedPassword(
                user,
                user.PasswordHash,
                dto.Password
            );

            if (passwordResult == PasswordVerificationResult.Failed)
            {
                return Unauthorized(new
                {
                    message = "Invalid email or password"
                });
            }

            // --------------------------------------------
            // Validate employee account
            // --------------------------------------------

            Employee? employee = null;

            if (string.Equals(
                user.Role,
                "Employee",
                StringComparison.OrdinalIgnoreCase))
            {
                if (!user.EmployeeId.HasValue)
                {
                    return BadRequest(new
                    {
                        message =
                            "This employee account is not linked to an employee record."
                    });
                }

                employee = await _context.Employees
                    .FirstOrDefaultAsync(e =>
                        e.Id == user.EmployeeId.Value &&
                        e.IsActive);

                if (employee == null)
                {
                    return BadRequest(new
                    {
                        message =
                            "The linked employee record does not exist or is inactive."
                    });
                }
            }

            // --------------------------------------------
            // Validate JWT configuration
            // --------------------------------------------

            var jwtKey = _configuration["Jwt:Key"];
            var issuer = _configuration["Jwt:Issuer"];
            var audience = _configuration["Jwt:Audience"];

            if (string.IsNullOrWhiteSpace(jwtKey) ||
                string.IsNullOrWhiteSpace(issuer) ||
                string.IsNullOrWhiteSpace(audience))
            {
                return StatusCode(500, new
                {
                    message = "JWT configuration is incomplete."
                });
            }

            if (Encoding.UTF8.GetByteCount(jwtKey) < 32)
            {
                return StatusCode(500, new
                {
                    message =
                        "The JWT key must contain at least 32 bytes for HS256."
                });
            }

            // --------------------------------------------
            // Create an eight-hour session
            // --------------------------------------------

            var nowUtc = DateTime.UtcNow;
            var expiresAtUtc = nowUtc.AddHours(8);

            await using var transaction =
                await _context.Database.BeginTransactionAsync();

            try
            {
                // End previous active sessions for this user.
                var previousSessions = await _context.UserSessions
                    .Where(s =>
                        s.UserId == user.Id &&
                        s.IsActive)
                    .ToListAsync();

                foreach (var previousSession in previousSessions)
                {
                    previousSession.IsActive = false;
                    previousSession.EndedAtUtc = nowUtc;
                }

                // ----------------------------------------
                // Automatically mark attendance
                // ----------------------------------------

                if (employee != null)
                {
                    // Uses the application's local server time.
                    var localNow = DateTime.Now;
                    var attendanceDate =
                        DateOnly.FromDateTime(localNow);

                    var attendance = await _context.Attendances
                        .FirstOrDefaultAsync(a =>
                            a.EmployeeId == employee.Id &&
                            a.AttendanceDate == attendanceDate);

                    if (attendance == null)
                    {
                        attendance = new Attendance
                        {
                            EmployeeId = employee.Id,
                            AttendanceDate = attendanceDate,
                            CheckIn = TimeOnly.FromDateTime(localNow),
                            CheckOut = null,
                            Status = "Present",
                            Remarks = "Automatically marked at login."
                        };

                        _context.Attendances.Add(attendance);
                    }
                    else
                    {
                        // Preserve the first check-in of the day.
                        if (attendance.CheckIn == null)
                        {
                            attendance.CheckIn =
                                TimeOnly.FromDateTime(localNow);
                        }

                        // The employee has started a new active session.
                        attendance.CheckOut = null;
                        attendance.Status = "Present";
                    }
                }

                // ----------------------------------------
                // Save the new login session
                // ----------------------------------------

                var session = new UserSession
                {
                    UserId = user.Id,
                    StartedAtUtc = nowUtc,
                    ExpiresAtUtc = expiresAtUtc,
                    EndedAtUtc = null,
                    IsActive = true
                };

                _context.UserSessions.Add(session);

                await _context.SaveChangesAsync();

                // SaveChanges generates the session ID,
                // which is included in the JWT as "sid".
                var claims = new List<Claim>
                {
                    new Claim(
                        JwtRegisteredClaimNames.Sub,
                        user.Id.ToString()),

                    new Claim(
                        ClaimTypes.NameIdentifier,
                        user.Id.ToString()),

                    new Claim(
                        ClaimTypes.Name,
                        user.FullName),

                    new Claim(
                        ClaimTypes.Email,
                        user.Email),

                    new Claim(
                        ClaimTypes.Role,
                        user.Role),

                    new Claim(
                        "sid",
                        session.Id.ToString())
                };

                var key = new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(jwtKey));

                var credentials = new SigningCredentials(
                    key,
                    SecurityAlgorithms.HmacSha256);

                var token = new JwtSecurityToken(
                    issuer: issuer,
                    audience: audience,
                    claims: claims,
                    notBefore: nowUtc,
                    expires: expiresAtUtc,
                    signingCredentials: credentials
                );

                var tokenString =
                    new JwtSecurityTokenHandler().WriteToken(token);

                await transaction.CommitAsync();

                return Ok(new
                {
                    message = "Login successful",

                    token = tokenString,

                    expiresAt = expiresAtUtc,

                    sessionId = session.Id,

                    user = new
                    {
                        user.Id,
                        user.FullName,
                        user.Email,
                        user.Role,
                        user.EmployeeId
                    }
                });
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        // ============================================
        // LOGOUT
        // ============================================

        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var userIdClaim =
                User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);

            var sessionIdClaim = User.FindFirstValue("sid");

            if (!int.TryParse(userIdClaim, out var userId) ||
                !int.TryParse(sessionIdClaim, out var sessionId))
            {
                return Unauthorized(new
                {
                    message = "Invalid login session."
                });
            }

            var session = await _context.UserSessions
                .FirstOrDefaultAsync(s =>
                    s.Id == sessionId &&
                    s.UserId == userId);

            if (session == null)
            {
                return NotFound(new
                {
                    message = "Login session not found."
                });
            }

            if (!session.IsActive || session.EndedAtUtc != null)
            {
                return Ok(new
                {
                    message = "Session has already ended."
                });
            }

            var nowUtc = DateTime.UtcNow;

            await using var transaction =
                await _context.Database.BeginTransactionAsync();

            try
            {
                session.IsActive = false;
                session.EndedAtUtc = nowUtc;

                // ----------------------------------------
                // Automatically record employee check-out
                // ----------------------------------------

                var loggedInUser = await _context.Users
                    .FirstOrDefaultAsync(u =>
                        u.Id == userId &&
                        u.IsActive);

                if (loggedInUser != null &&
                    string.Equals(
                        loggedInUser.Role,
                        "Employee",
                        StringComparison.OrdinalIgnoreCase) &&
                    loggedInUser.EmployeeId.HasValue)
                {
                    // Match the attendance date used at login.
                    var sessionLocalStart =
                        session.StartedAtUtc.ToLocalTime();

                    var attendanceDate =
                        DateOnly.FromDateTime(sessionLocalStart);

                    var attendance = await _context.Attendances
                        .FirstOrDefaultAsync(a =>
                            a.EmployeeId == loggedInUser.EmployeeId.Value &&
                            a.AttendanceDate == attendanceDate);

                    if (attendance != null)
                    {
                        attendance.CheckOut =
                            TimeOnly.FromDateTime(DateTime.Now);

                        if (string.IsNullOrWhiteSpace(attendance.Remarks))
                        {
                            attendance.Remarks =
                                "Check-out recorded at logout.";
                        }
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new
                {
                    message = "Logout successful",
                    loggedOutAt = nowUtc
                });
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }
}