using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartHR.Data;
using SmartHR.DTOs;
using SmartHR.Models;
using Microsoft.AspNetCore.Authorization;
namespace SmartHR.Controllers
{
    [Authorize(Roles = "Admin")]
    [ApiController]
    [Route("api/[controller]")]
    public class DesignationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DesignationsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Designations
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Designation>>> GetDesignations()
        {
            return await _context.Designations
    .Where(d => d.IsActive)
    .ToListAsync();
        }

        // GET: api/Designations/1
        [HttpGet("{id}")]
        public async Task<ActionResult<Designation>> GetDesignation(int id)
        {
            var designation = await _context.Designations
                .FirstOrDefaultAsync(d => d.Id == id);

            if (designation == null)
            {
                return NotFound(new
                {
                    message = "Designation not found"
                });
            }

            return designation;
        }

        // POST: api/Designations
        [HttpPost]
        public async Task<ActionResult<Designation>> CreateDesignation(
            CreateDesignationDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest(new
                {
                    message = "Designation name is required"
                });
            }

            var designationExists = await _context.Designations
                .AnyAsync(d =>
                    d.Name.ToLower() == dto.Name.ToLower());

            if (designationExists)
            {
                return Conflict(new
                {
                    message = "Designation already exists"
                });
            }

            var designation = new Designation
            {
                Name = dto.Name.Trim(),
                Description = dto.Description.Trim(),
                IsActive = true
            };

            _context.Designations.Add(designation);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetDesignation),
                new { id = designation.Id },
                designation);
        }
        // PUT: api/Designations/2
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDesignation(
            int id,
            UpdateDesignationDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest(new
                {
                    message = "Designation name is required"
                });
            }

            var designation = await _context.Designations
                .FindAsync(id);

            if (designation == null)
            {
                return NotFound(new
                {
                    message = "Designation not found"
                });
            }

            var designationExists = await _context.Designations
                .AnyAsync(d =>
                    d.Id != id &&
                    d.Name.ToLower() == dto.Name.ToLower());

            if (designationExists)
            {
                return Conflict(new
                {
                    message = "Another designation with this name already exists"
                });
            }

            designation.Name = dto.Name.Trim();
            designation.Description = dto.Description.Trim();
            designation.IsActive = dto.IsActive;

            await _context.SaveChangesAsync();

            return Ok(designation);
        }
        // DELETE: api/Designations/1
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDesignation(int id)
        {
            var designation = await _context.Designations
                .FindAsync(id);

            if (designation == null)
            {
                return NotFound(new
                {
                    message = "Designation not found"
                });
            }

            if (!designation.IsActive)
            {
                return BadRequest(new
                {
                    message = "Designation is already inactive"
                });
            }

            designation.IsActive = false;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Designation deactivated successfully"
            });
        }
    }
}