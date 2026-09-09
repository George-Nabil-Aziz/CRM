using CrmApi.Data;
using CrmApi.Dtos;
using CrmApi.Models;
using CrmApi.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController(CrmDbContext db, AuditLogger audit) : ControllerBase
{
    // Story 45: Manage users and roles
    [HttpPost]
    public async Task<ActionResult<UserResponse>> Create(CreateUserRequest request)
    {
        var role = await db.Roles.FindAsync(request.RoleId);
        if (role is null)
        {
            return NotFound(new { message = "roleId does not reference an existing role." });
        }

        var emailTaken = await db.Users.AnyAsync(u => u.Email == request.Email);
        if (emailTaken)
        {
            return Conflict(new { message = "A user with this email already exists." });
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Email = request.Email,
            RoleId = request.RoleId,
            CreatedAt = DateTime.UtcNow
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();
        await audit.LogAsync("create", "user", user.Id);

        return CreatedAtAction(nameof(Get), new { id = user.Id }, ToResponse(user, role.Name));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<UserResponse>> Get(Guid id)
    {
        var user = await db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == id);
        return user is null ? NotFound() : Ok(ToResponse(user, user.Role!.Name));
    }

    // Story 45: the administration screen needs the roster, not just single lookups.
    [HttpGet]
    public async Task<ActionResult<List<UserResponse>>> List([FromQuery] Guid? roleId, [FromQuery] string? q)
    {
        var query = db.Users.Include(u => u.Role).AsQueryable();

        if (roleId is not null)
        {
            query = query.Where(u => u.RoleId == roleId);
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(u => EF.Functions.Like(u.Name, $"%{term}%") || EF.Functions.Like(u.Email, $"%{term}%"));
        }

        var users = await query.OrderBy(u => u.Name).ToListAsync();
        return Ok(users.Select(u => ToResponse(u, u.Role!.Name)).ToList());
    }

    private static UserResponse ToResponse(User u, string roleName) =>
        new(u.Id, u.Name, u.Email, u.RoleId, roleName, u.CreatedAt);
}
