using CrmApi.Data;
using CrmApi.Dtos;
using CrmApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Controllers;

[ApiController]
[Route("api/tickets/{id:guid}")]
public class TicketExtrasController(CrmDbContext db) : ControllerBase
{
    // Story 18: View customer information in context
    [HttpGet("context")]
    public async Task<ActionResult<TicketContextResponse>> GetContext(Guid id)
    {
        var ticket = await db.Tickets.FindAsync(id);
        if (ticket is null)
        {
            return NotFound();
        }

        var customer = await db.Customers.FindAsync(ticket.CustomerId);
        if (customer is null)
        {
            return NotFound(new { message = "The ticket's customer could not be found." });
        }

        return Ok(new TicketContextResponse(Mappers.ToResponse(ticket), Mappers.ToResponse(customer)));
    }

    // Story 16: Unified multi-channel thread
    [HttpGet("messages")]
    public async Task<ActionResult<List<MessageResponse>>> GetMessages(Guid id)
    {
        var ticketExists = await db.Tickets.AnyAsync(t => t.Id == id);
        if (!ticketExists)
        {
            return NotFound();
        }

        var messages = await db.Messages
            .Where(m => m.TicketId == id)
            .OrderBy(m => m.SentAt)
            .ToListAsync();

        return Ok(messages.Select(m => new MessageResponse(m.Id, m.TicketId, m.Channel.ToString(), m.From, m.Body, m.SentAt)).ToList());
    }

    // Story 19: Manage tasks and reminders
    [HttpPost("reminders")]
    public async Task<ActionResult<ReminderResponse>> AddReminder(Guid id, CreateReminderRequest request)
    {
        var ticketExists = await db.Tickets.AnyAsync(t => t.Id == id);
        if (!ticketExists)
        {
            return NotFound();
        }

        var reminder = new Reminder
        {
            Id = Guid.NewGuid(),
            TicketId = id,
            AgentId = request.AgentId,
            DueAt = request.DueAt,
            Note = request.Note
        };

        db.Reminders.Add(reminder);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetContext), new { id }, ToResponse(reminder));
    }

    // Story 21: Team collaboration
    [HttpPost("internal-notes")]
    public async Task<ActionResult<InternalNoteResponse>> AddInternalNote(Guid id, CreateInternalNoteRequest request)
    {
        var ticketExists = await db.Tickets.AnyAsync(t => t.Id == id);
        if (!ticketExists)
        {
            return NotFound();
        }

        var note = new InternalNote
        {
            Id = Guid.NewGuid(),
            TicketId = id,
            AuthorId = request.AuthorId,
            Text = request.Text,
            Mentions = request.MentionedUserIds ?? [],
            CreatedAt = DateTime.UtcNow
        };

        db.InternalNotes.Add(note);

        foreach (var mentionedUserId in note.Mentions)
        {
            db.Notifications.Add(new Notification
            {
                Id = Guid.NewGuid(),
                UserId = mentionedUserId,
                TicketId = id,
                Type = NotificationType.Mention,
                Message = $"You were mentioned on ticket {id}.",
                SentAt = DateTime.UtcNow
            });
        }

        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetContext), new { id }, ToResponse(note));
    }

    private static ReminderResponse ToResponse(Reminder r) =>
        new(r.Id, r.TicketId, r.AgentId, r.DueAt, r.Note, r.Dismissed);

    private static InternalNoteResponse ToResponse(InternalNote n) =>
        new(n.Id, n.TicketId, n.AuthorId, n.Text, n.Mentions, n.CreatedAt);
}
