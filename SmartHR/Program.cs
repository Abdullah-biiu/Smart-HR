using Microsoft.EntityFrameworkCore;
using SmartHR.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace SmartHR
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // ============================================
            // PostgreSQL Database
            // ============================================

            builder.Services.AddDbContext<ApplicationDbContext>(options =>
                options.UseNpgsql(
                    builder.Configuration.GetConnectionString("DefaultConnection")
                ));

            // ============================================
            // Controllers
            // ============================================

            builder.Services.AddControllers();

            // ============================================
            // CORS
            // ============================================

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("ReactFrontend", policy =>
                {
                    policy
                        .WithOrigins("http://localhost:5173")
                        .AllowAnyHeader()
                        .AllowAnyMethod();
                });
            });

            // ============================================
            // Swagger
            // ============================================

            builder.Services.AddEndpointsApiExplorer();

            builder.Services.AddSwaggerGen(options =>
            {
                options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Type = SecuritySchemeType.Http,
                    Scheme = "bearer",
                    BearerFormat = "JWT",
                    Description = "JWT Authorization header using the Bearer scheme."
                });

                options.AddSecurityRequirement(document =>
                    new OpenApiSecurityRequirement
                    {
                        [new OpenApiSecuritySchemeReference("Bearer", document)] = []
                    });
            });

            // ============================================
            // JWT Authentication
            // ============================================

            var jwtKey = builder.Configuration["Jwt:Key"];

            if (string.IsNullOrWhiteSpace(jwtKey))
            {
                throw new InvalidOperationException(
                    "JWT key is missing from configuration.");
            }

            if (Encoding.UTF8.GetByteCount(jwtKey) < 32)
            {
                throw new InvalidOperationException(
                    "The JWT key must contain at least 32 bytes for HS256.");
            }

            builder.Services
                .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters =
                        new TokenValidationParameters
                        {
                            ValidateIssuer = true,
                            ValidateAudience = true,
                            ValidateLifetime = true,
                            ValidateIssuerSigningKey = true,

                            ValidIssuer =
                                builder.Configuration["Jwt:Issuer"],

                            ValidAudience =
                                builder.Configuration["Jwt:Audience"],

                            IssuerSigningKey =
                                new SymmetricSecurityKey(
                                    Encoding.UTF8.GetBytes(jwtKey)
                                ),

                            // Read the JWT subject as NameIdentifier.
                            NameClaimType = ClaimTypes.NameIdentifier,

                            // Read the JWT role as the standard role claim.
                            RoleClaimType = ClaimTypes.Role
                        };

                    // ========================================
                    // Validate the database session
                    // on every authenticated API request.
                    // ========================================

                    options.Events = new JwtBearerEvents
                    {
                        OnTokenValidated = async context =>
                        {
                            var principal = context.Principal;

                            var userIdClaim =
                                principal?.FindFirst(
                                    ClaimTypes.NameIdentifier)?.Value
                                ?? principal?.FindFirst(
                                    JwtRegisteredClaimNames.Sub)?.Value;

                            var sessionIdClaim =
                                principal?.FindFirst("sid")?.Value;

                            if (!int.TryParse(
                                    userIdClaim,
                                    out var userId) ||
                                !int.TryParse(
                                    sessionIdClaim,
                                    out var sessionId))
                            {
                                context.Fail(
                                    "The token does not contain a valid login session.");

                                return;
                            }

                            // Resolve the existing scoped database context.
                            var dbContext = context.HttpContext
                                .RequestServices
                                .GetRequiredService<ApplicationDbContext>();

                            var nowUtc = DateTime.UtcNow;

                            var session = await dbContext.UserSessions
                                .AsNoTracking()
                                .FirstOrDefaultAsync(s =>
                                    s.Id == sessionId &&
                                    s.UserId == userId);

                            // Reject logged-out, replaced, or expired sessions.
                            if (session == null ||
                                !session.IsActive ||
                                session.EndedAtUtc != null ||
                                session.ExpiresAtUtc <= nowUtc)
                            {
                                context.Fail(
                                    "Your login session has expired or ended. Please log in again.");

                                return;
                            }

                            // Also reject accounts that have been deactivated.
                            var userIsActive = await dbContext.Users
                                .AsNoTracking()
                                .AnyAsync(u =>
                                    u.Id == userId &&
                                    u.IsActive);

                            if (!userIsActive)
                            {
                                context.Fail(
                                    "This user account is inactive.");

                                return;
                            }
                        }
                    };
                });

            // ============================================
            // Authorization
            // ============================================

            builder.Services.AddAuthorization();

            var app = builder.Build();

            // ============================================
            // Swagger
            // ============================================

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();

            // ============================================
            // Middleware
            // ============================================

            app.UseCors("ReactFrontend");

            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();

            app.Run();
        }
    }
}