using CrmApi.Data;
using CrmApi.Dtos;
using CrmApi.Models;
using CrmApi.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Controllers;

[ApiController]
[Route("api/roles")]
public class RolesController(CrmDbContext db, AuditLogger audit) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<RoleResponse>> Create(CreateRoleRequest request)
    {
        var nameTaken = await db.Roles.AnyAsync(r => r.Name == request.Name);
        if (nameTaken)
        {
            return Conflict(new { message = "A role with this name already exists." });
        }

        var role = new Role
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Permissions = request.Permissions ?? []
        };

        db.Roles.Add(role);
        await db.SaveChangesAsync();
        await audit.LogAsync("create", "role", role.Id);

        return CreatedAtAction(nameof(Get), new { id = role.Id }, ToResponse(role));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<RoleResponse>> Get(Guid id)
    {
        var role = await db.Roles.FindAsync(id);
        return role is null ? NotFound() : Ok(ToResponse(role));
    }

    // Story 46: Configure permissions
    [HttpPatch("{id:guid}/permissions")]
    public async Task<ActionResult<RoleResponse>> UpdatePermissions(Guid id, UpdatePermissionsRequest request)
    {
        var role = await db.Roles.FindAsync(id);
        if (role is null)
        {
            return NotFound();
        }

        role.Permissions = request.Permissions;
        await db.SaveChangesAsync();
        await audit.LogAsync("permission_change", "role", role.Id);

        return Ok(ToResponse(role));
    }

    private static RoleResponse ToResponse(Role r) => new(r.Id, r.Name, r.Permissions);
}
