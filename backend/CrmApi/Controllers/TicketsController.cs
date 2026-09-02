using CrmApi.Data;
using CrmApi.Dtos;
using CrmApi.Models;
using CrmApi.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Controllers;

[ApiController]
[Route("api/tickets")]
public class TicketsController(CrmDbContext db, TicketAutomationService automation, WebhookDispatcher webhooks) : ControllerBase
{
    private static readonly Dictionary<TicketStatus, TicketStatus[]> AllowedTransitions = new()
    {
        [TicketStatus.Open] = [TicketStatus.Pending, TicketStatus.Resolved],
        [TicketStatus.Pending] = [TicketStatus.Open, TicketStatus.Resolved],
        [TicketStatus.Resolved] = [TicketStatus.Closed, TicketStatus.Open],
        [TicketStatus.Closed] = [TicketStatus.Open],
    };

    [HttpGet]
    public async Task<ActionResult<List<TicketResponse>>> List([FromQuery] TicketStatus? status)
    {
        var query = db.Tickets.AsQueryable();
        if (status is not null) query = query.Where(t => t.Status == status);

        var tickets = await query.OrderByDescending(t => t.CreatedAt).Take(200).ToListAsync();
        return Ok(tickets.Select(Mappers.ToResponse).ToList());
    }

    // Story 05: Create and track tickets
    [HttpPost]
    public async Task<ActionResult<TicketResponse>> Create(CreateTicketRequest request)
    {
        var customerExists = await db.Customers.AnyAsync(c => c.Id == request.CustomerId);
        if (!customerExists)
        {
            return NotFound(new { message = "customerId does not reference an existing customer." });
        }

        var ticket = new Ticket
        {
            Id = Guid.NewGuid(),
            TicketNumber = $"TCK-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}",
            CustomerId = request.CustomerId,
            Subject = request.Subject,
            Status = TicketStatus.Open,
            Category = request.Category,
            Priority = request.Priority,
            CreatedAt = DateTime.UtcNow
        };

        db.Tickets.Add(ticket);
        await automation.ApplyOnCreateAsync(ticket);
        await db.SaveChangesAsync();
        await webhooks.DispatchAsync("ticket.created", Mappers.ToResponse(ticket));

        return CreatedAtAction(nameof(GetHistory), new { id = ticket.Id }, Mappers.ToResponse(ticket));
    }

    // Story 06: Categories and priorities
    [HttpPatch("{id:guid}")]
    public async Task<ActionResult<TicketResponse>> UpdateCategoryPriority(Guid id, UpdateTicketCategoryPriorityRequest request)
    {
        var ticket = await db.Tickets.FindAsync(id);
        if (ticket is null)
        {
            return NotFound();
        }

        if (request.Category is not null)
        {
            ticket.Category = request.Category.Value;
        }

        if (request.Priority is not null)
        {
            ticket.Priority = request.Priority.Value;
        }

        await db.SaveChangesAsync();
        return Ok(Mappers.ToResponse(ticket));
    }

    // Story 07: Assign tickets to agents
    [HttpPost("{id:guid}/assign")]
    public async Task<ActionResult<TicketResponse>> Assign(Guid id, AssignTicketRequest request)
    {
        var ticket = await db.Tickets.FindAsync(id);
        if (ticket is null)
        {
            return NotFound();
        }

        ticket.AssignedAgentId = request.AgentId;

        db.TicketEvents.Add(new TicketEvent
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            Type = TicketEventType.Assignment,
            Timestamp = DateTime.UtcNow,
            Details = $"Assigned to agent {request.AgentId}."
        });

        await db.SaveChangesAsync();
        return Ok(Mappers.ToResponse(ticket));
    }

    // Story 08: Update ticket status
    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<TicketResponse>> UpdateStatus(Guid id, UpdateTicketStatusRequest request)
    {
        var ticket = await db.Tickets.FindAsync(id);
        if (ticket is null)
        {
            return NotFound();
        }

        if (ticket.Status == request.Status)
        {
            return Ok(Mappers.ToResponse(ticket));
        }

        if (!AllowedTransitions[ticket.Status].Contains(request.Status))
        {
            return BadRequest(new
            {
                message = $"Cannot transition ticket from '{ticket.Status}' to '{request.Status}'.",
                allowedTransitions = AllowedTransitions[ticket.Status]
            });
        }

        var previousStatus = ticket.Status;
        ticket.Status = request.Status;
        if (request.Status == TicketStatus.Resolved && ticket.ResolvedAt is null)
        {
            ticket.ResolvedAt = DateTime.UtcNow;
        }

        db.TicketEvents.Add(new TicketEvent
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            Type = TicketEventType.StatusChange,
            Timestamp = DateTime.UtcNow,
            Details = $"Status changed from '{previousStatus}' to '{request.Status}'."
        });

        await db.SaveChangesAsync();
        await webhooks.DispatchAsync("ticket.updated", Mappers.ToResponse(ticket));
        return Ok(Mappers.ToResponse(ticket));
    }

    // Story 09: Escalate tickets
    [HttpPost("{id:guid}/escalate")]
    public async Task<ActionResult<TicketResponse>> Escalate(Guid id, EscalateTicketRequest request)
    {
        var ticket = await db.Tickets.FindAsync(id);
        if (ticket is null)
        {
            return NotFound();
        }

        if (ticket.Escalated)
        {
            return Ok(Mappers.ToResponse(ticket));
        }

        ticket.Escalated = true;
        ticket.EscalatedAt = DateTime.UtcNow;
        ticket.EscalationReason = request.Reason;

        db.TicketEvents.Add(new TicketEvent
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            Type = TicketEventType.Escalation,
            Timestamp = DateTime.UtcNow,
            Details = $"Escalated: {request.Reason}"
        });

        await db.SaveChangesAsync();
        await webhooks.DispatchAsync("ticket.escalated", Mappers.ToResponse(ticket));
        return Ok(Mappers.ToResponse(ticket));
    }

    // Story 10: View ticket history
    [HttpGet("{id:guid}/history")]
    public async Task<ActionResult<List<TicketEventResponse>>> GetHistory(Guid id)
    {
        var ticketExists = await db.Tickets.AnyAsync(t => t.Id == id);
        if (!ticketExists)
        {
            return NotFound();
        }

        var events = await db.TicketEvents
            .Where(e => e.TicketId == id)
            .OrderBy(e => e.Timestamp)
            .Select(e => new TicketEventResponse(e.Id, e.Type, e.ActorId, e.Timestamp, e.Details))
            .ToListAsync();

        return Ok(events);
    }
}
