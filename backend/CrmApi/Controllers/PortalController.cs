using CrmApi.Data;
using CrmApi.Dtos;
using CrmApi.Models;
using CrmApi.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Controllers;

[ApiController]
[Route("api/portal")]
public class PortalController(CrmDbContext db, TicketAutomationService automation, WebhookDispatcher webhooks) : ControllerBase
{
    // Story 35: Submit tickets via portal
    [HttpPost("tickets")]
    public async Task<ActionResult<TicketResponse>> CreateTicket(PortalCreateTicketRequest request)
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
            Priority = TicketPriority.Medium,
            CreatedAt = DateTime.UtcNow
        };

        db.Tickets.Add(ticket);
        await automation.ApplyOnCreateAsync(ticket);

        db.Messages.Add(new Message
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            Channel = MessageChannel.Webform,
            From = request.CustomerId.ToString(),
            Body = request.Description,
            SentAt = DateTime.UtcNow
        });

        await db.SaveChangesAsync();
        await webhooks.DispatchAsync("ticket.created", Mappers.ToResponse(ticket));

        return CreatedAtAction(nameof(GetTicket), new { id = ticket.Id }, Mappers.ToResponse(ticket));
    }

    // Story 36: Track requests
    [HttpGet("tickets/{id:guid}")]
    public async Task<ActionResult<TicketResponse>> GetTicket(Guid id, [FromQuery] Guid customerId)
    {
        var ticket = await db.Tickets.FirstOrDefaultAsync(t => t.Id == id && t.CustomerId == customerId);
        return ticket is null ? NotFound() : Ok(Mappers.ToResponse(ticket));
    }

    // Story 37: View history
    [HttpGet("tickets")]
    public async Task<ActionResult<List<TicketResponse>>> ListTickets(
        [FromQuery] Guid customerId, [FromQuery] TicketStatus? status)
    {
        var query = db.Tickets.Where(t => t.CustomerId == customerId);
        if (status is not null)
        {
            query = query.Where(t => t.Status == status);
        }

        var tickets = await query.OrderByDescending(t => t.CreatedAt).ToListAsync();
        return Ok(tickets.Select(Mappers.ToResponse).ToList());
    }

    // Story 38: Access FAQs
    [HttpGet("kb")]
    public async Task<ActionResult<List<ArticleSummaryResponse>>> BrowseKb([FromQuery] string? q)
    {
        var query = db.Articles.Where(a => a.Published);
        if (!string.IsNullOrWhiteSpace(q))
        {
            query = query.Where(a => EF.Functions.Like(a.Title, $"%{q}%") || EF.Functions.Like(a.Body, $"%{q}%"));
        }

        var results = await query
            .Select(a => new ArticleSummaryResponse(a.Id, a.Title, a.Category, a.Type))
            .ToListAsync();

        return Ok(results);
    }

    // Story 39: Submit feedback
    [HttpPost("tickets/{id:guid}/feedback")]
    public async Task<ActionResult<FeedbackResponse>> SubmitFeedback(Guid id, SubmitFeedbackRequest request)
    {
        var ticket = await db.Tickets.FindAsync(id);
        if (ticket is null)
        {
            return NotFound();
        }

        if (ticket.Status is not (TicketStatus.Resolved or TicketStatus.Closed))
        {
            return BadRequest(new { message = "Feedback can only be submitted once the ticket is resolved or closed." });
        }

        var alreadySubmitted = await db.Feedbacks.AnyAsync(f => f.TicketId == id);
        if (alreadySubmitted)
        {
            return Conflict(new { message = "Feedback has already been submitted for this ticket." });
        }

        var feedback = new Feedback
        {
            Id = Guid.NewGuid(),
            TicketId = id,
            Rating = request.Rating,
            Comment = request.Comment,
            SubmittedAt = DateTime.UtcNow
        };

        db.Feedbacks.Add(feedback);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTicket), new { id }, ToResponse(feedback));
    }

    private static FeedbackResponse ToResponse(Feedback f) =>
        new(f.Id, f.TicketId, f.Rating, f.Comment, f.SubmittedAt);
}
