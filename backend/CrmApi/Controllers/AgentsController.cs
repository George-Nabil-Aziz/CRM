using CrmApi.Data;
using CrmApi.Dtos;
using CrmApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Controllers;

[ApiController]
[Route("api/agents")]
public class AgentsController(CrmDbContext db) : ControllerBase
{
    // Story 17: View assigned tickets
    // "me" is resolved from the `agentId` query param until real authentication is wired in (see Security & Administration area).
    [HttpGet("me/tickets")]
    public async Task<ActionResult<List<TicketResponse>>> GetAssignedTickets(
        [FromQuery] Guid agentId, [FromQuery] TicketStatus? status, [FromQuery] TicketPriority? priority)
    {
        var query = db.Tickets.Where(t => t.AssignedAgentId == agentId);

        if (status is not null) query = query.Where(t => t.Status == status);
        if (priority is not null) query = query.Where(t => t.Priority == priority);

        var tickets = await query
            .OrderByDescending(t => t.Priority)
            .ThenBy(t => t.CreatedAt)
            .ToListAsync();

        return Ok(tickets.Select(Mappers.ToResponse).ToList());
    }
}
