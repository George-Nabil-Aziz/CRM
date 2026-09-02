using CrmApi.Data;
using CrmApi.Dtos;
using CrmApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Controllers;

[ApiController]
[Route("api/assignment-rules")]
public class AssignmentRulesController(CrmDbContext db) : ControllerBase
{
    // Supports Story 23: Automatic assignment
    [HttpPost]
    public async Task<ActionResult<AssignmentRuleResponse>> Create(CreateAssignmentRuleRequest request)
    {
        var rule = new AssignmentRule
        {
            Id = Guid.NewGuid(),
            Category = request.Category,
            TargetAgentId = request.TargetAgentId,
            Order = request.Order
        };

        db.AssignmentRules.Add(rule);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(List), null, ToResponse(rule));
    }

    [HttpGet]
    public async Task<ActionResult<List<AssignmentRuleResponse>>> List()
    {
        var rules = await db.AssignmentRules.OrderBy(r => r.Order).ToListAsync();
        return Ok(rules.Select(ToResponse).ToList());
    }

    private static AssignmentRuleResponse ToResponse(AssignmentRule r) =>
        new(r.Id, r.Category, r.TargetAgentId, r.Order);
}
