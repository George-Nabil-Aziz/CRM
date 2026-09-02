using CrmApi.Data;
using CrmApi.Dtos;
using CrmApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Controllers;

[ApiController]
[Route("api")]
public class PlatformController(CrmDbContext db) : ControllerBase
{
    // Story 55: Multi-department
    [HttpPost("departments")]
    public async Task<ActionResult<DepartmentResponse>> CreateDepartment(CreateDepartmentRequest request)
    {
        var department = new Department { Id = Guid.NewGuid(), Name = request.Name };
        db.Departments.Add(department);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetDepartments), null, new DepartmentResponse(department.Id, department.Name));
    }

    [HttpGet("departments")]
    public async Task<ActionResult<List<DepartmentResponse>>> GetDepartments()
    {
        var departments = await db.Departments.Select(d => new DepartmentResponse(d.Id, d.Name)).ToListAsync();
        return Ok(departments);
    }

    // Story 56: Multi-branch
    [HttpPost("branches")]
    public async Task<ActionResult<BranchResponse>> CreateBranch(CreateBranchRequest request)
    {
        var branch = new Branch { Id = Guid.NewGuid(), Name = request.Name, Location = request.Location };
        db.Branches.Add(branch);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetBranches), null, new BranchResponse(branch.Id, branch.Name, branch.Location));
    }

    [HttpGet("branches")]
    public async Task<ActionResult<List<BranchResponse>>> GetBranches()
    {
        var branches = await db.Branches.Select(b => new BranchResponse(b.Id, b.Name, b.Location)).ToListAsync();
        return Ok(branches);
    }

    // Story 57: Custom branding
    [HttpPatch("settings/branding")]
    public async Task<ActionResult<BrandingResponse>> UpdateBranding(UpdateBrandingRequest request)
    {
        var branding = await db.BrandingConfigs.FirstOrDefaultAsync();
        if (branding is null)
        {
            branding = new BrandingConfig();
            db.BrandingConfigs.Add(branding);
        }

        if (request.LogoUrl is not null) branding.LogoUrl = request.LogoUrl;
        if (request.PrimaryColor is not null) branding.PrimaryColor = request.PrimaryColor;
        if (request.SecondaryColor is not null) branding.SecondaryColor = request.SecondaryColor;

        await db.SaveChangesAsync();
        return Ok(new BrandingResponse(branding.LogoUrl, branding.PrimaryColor, branding.SecondaryColor));
    }

    [HttpGet("settings/branding")]
    public async Task<ActionResult<BrandingResponse>> GetBranding()
    {
        var branding = await db.BrandingConfigs.FirstOrDefaultAsync() ?? new BrandingConfig();
        return Ok(new BrandingResponse(branding.LogoUrl, branding.PrimaryColor, branding.SecondaryColor));
    }
}
