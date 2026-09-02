using CrmApi.Data;
using CrmApi.Models;
using Microsoft.EntityFrameworkCore;
using static CrmApi.Mappers;

namespace CrmApi.Services;

// Shared inbound-message handling for stories 11-15: finds or creates the sending customer,
// finds or creates an open ticket for them, and appends the message to it.
public class ChannelIngestionService(CrmDbContext db, TicketAutomationService automation, AiService ai, WebhookDispatcher webhooks)
{
    public async Task<(Ticket Ticket, Message Message)> IngestAsync(
        MessageChannel channel, string senderKey, bool senderKeyIsEmail, string body, string? subjectHint, string? providerDeliveryId)
    {
        if (providerDeliveryId is not null)
        {
            var existing = await db.Messages.FirstOrDefaultAsync(m => m.ProviderDeliveryId == providerDeliveryId);
            if (existing is not null)
            {
                var existingTicket = await db.Tickets.FirstAsync(t => t.Id == existing.TicketId);
                return (existingTicket, existing);
            }
        }

        var customer = senderKeyIsEmail
            ? await db.Customers.FirstOrDefaultAsync(c => c.Email == senderKey)
            : await db.Customers.FirstOrDefaultAsync(c => c.Phone == senderKey);

        if (customer is null)
        {
            customer = new Customer
            {
                Id = Guid.NewGuid(),
                Name = senderKey,
                Email = senderKeyIsEmail ? senderKey : $"{Guid.NewGuid():N}@unknown.local",
                Phone = senderKeyIsEmail ? string.Empty : senderKey,
                CreatedAt = DateTime.UtcNow
            };
            db.Customers.Add(customer);
        }

        var openStatuses = new[] { TicketStatus.Open, TicketStatus.Pending };
        var ticket = await db.Tickets
            .Where(t => t.CustomerId == customer.Id && openStatuses.Contains(t.Status))
            .OrderByDescending(t => t.CreatedAt)
            .FirstOrDefaultAsync();

        var isNewTicket = ticket is null;
        if (ticket is null)
        {
            var subject = subjectHint ?? (body.Length > 80 ? body[..80] : body);
            ticket = new Ticket
            {
                Id = Guid.NewGuid(),
                TicketNumber = $"TCK-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}",
                CustomerId = customer.Id,
                Subject = subject,
                Status = TicketStatus.Open,
                Category = ai.Categorize(subject, body), // Story 32: automatic categorization
                Priority = TicketPriority.Medium,
                CreatedAt = DateTime.UtcNow
            };
            db.Tickets.Add(ticket);
            await automation.ApplyOnCreateAsync(ticket);
        }

        var message = new Message
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            Channel = channel,
            From = senderKey,
            Body = body,
            ProviderDeliveryId = providerDeliveryId,
            SentAt = DateTime.UtcNow
        };
        db.Messages.Add(message);

        await db.SaveChangesAsync();

        if (isNewTicket)
        {
            await webhooks.DispatchAsync("ticket.created", Mappers.ToResponse(ticket));
        }

        return (ticket, message);
    }
}
