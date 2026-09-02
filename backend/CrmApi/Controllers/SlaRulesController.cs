using CrmApi.Data;
using CrmApi.Dtos;
using CrmApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Controllers;

[ApiController]
[Route("api/sla-rules")]
public class SlaRulesController(CrmDbContext db) : ControllerBase
{
    // Story 22: Response/resolution targets
    [HttpPost]
    public async Task<ActionResult<SlaRuleResponse>> Create(CreateSlaRuleRequest request)
    {
        var exists = await db.SlaRules.AnyAsync(r => r.Category == request.Category && r.Priority == request.Priority);
        if (exists)
        {
            return Conflict(new { message = "An SLA rule for this category/priority combination already exists." });
        }

        var rule = new SlaRule
        {
            Id = Guid.NewGuid(),
            Category = request.Category,
            Priority = request.Priority,
            ResponseTargetMinutes = request.ResponseTargetMinutes,
            ResolutionTargetMinutes = request.ResolutionTargetMinutes
        };

        db.SlaRules.Add(rule);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = rule.Id }, ToResponse(rule));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<SlaRuleResponse>> Get(Guid id)
    {
        var rule = await db.SlaRules.FindAsync(id);
        return rule is null ? NotFound() : Ok(ToResponse(rule));
    }

    [HttpGet]
    public async Task<ActionResult<List<SlaRuleResponse>>> List()
    {
        var rules = await db.SlaRules.ToListAsync();
        return Ok(rules.Select(ToResponse).ToList());
    }

    private static SlaRuleResponse ToResponse(SlaRule r) =>
        new(r.Id, r.Category, r.Priority, r.ResponseTargetMinutes, r.ResolutionTargetMinutes);
}
