using CrmApi.Data;
using CrmApi.Models;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Services;

// Story 24 (escalation-rules) + Story 25 (alerts-notifications): scans open tickets past their
// SLA target and escalates + notifies. Runs as a scheduled background job, not an HTTP endpoint.
public class SlaMonitorService(IServiceScopeFactory scopeFactory, ILogger<SlaMonitorService> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(1);
    private static readonly TimeSpan WarningWindow = TimeSpan.FromMinutes(15);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(Interval);
        while (!stoppingToken.IsCancellationRequested && await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                await RunOnceAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                // A failed run must not crash the host or block the next scheduled run.
                logger.LogError(ex, "SLA monitor run failed");
            }
        }
    }

    public async Task RunOnceAsync(CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<CrmDbContext>();
        var webhooks = scope.ServiceProvider.GetRequiredService<WebhookDispatcher>();

        var now = DateTime.UtcNow;
        var openStatuses = new[] { TicketStatus.Open, TicketStatus.Pending };

        var breached = await db.Tickets
            .Where(t => openStatuses.Contains(t.Status) && !t.Escalated
                && t.ResolutionTargetAt != null && t.ResolutionTargetAt < now)
            .ToListAsync(ct);

        foreach (var ticket in breached)
        {
            ticket.Escalated = true;
            ticket.EscalatedAt = now;
            ticket.EscalationReason = "SLA resolution target breached.";

            db.TicketEvents.Add(new TicketEvent
            {
                Id = Guid.NewGuid(),
                TicketId = ticket.Id,
                Type = TicketEventType.Escalation,
                Timestamp = now,
                Details = "Auto-escalated: SLA resolution target breached."
            });

            if (ticket.AssignedAgentId is not null)
            {
                db.Notifications.Add(new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = ticket.AssignedAgentId.Value,
                    TicketId = ticket.Id,
                    Type = NotificationType.SlaBreach,
                    Message = $"Ticket {ticket.TicketNumber} breached its SLA and was auto-escalated.",
                    SentAt = now
                });
            }
        }

        var approaching = await db.Tickets
            .Where(t => openStatuses.Contains(t.Status) && !t.Escalated
                && t.ResolutionTargetAt != null
                && t.ResolutionTargetAt >= now && t.ResolutionTargetAt <= now.Add(WarningWindow))
            .ToListAsync(ct);

        foreach (var ticket in approaching)
        {
            var alreadyWarned = await db.Notifications.AnyAsync(
                n => n.TicketId == ticket.Id && n.Type == NotificationType.SlaWarning, ct);
            if (alreadyWarned || ticket.AssignedAgentId is null)
            {
                continue;
            }

            db.Notifications.Add(new Notification
            {
                Id = Guid.NewGuid(),
                UserId = ticket.AssignedAgentId.Value,
                TicketId = ticket.Id,
                Type = NotificationType.SlaWarning,
                Message = $"Ticket {ticket.TicketNumber} is approaching its SLA deadline.",
                SentAt = now
            });
        }

        if (breached.Count > 0 || approaching.Count > 0)
        {
            await db.SaveChangesAsync(ct);
            foreach (var ticket in breached)
            {
                await webhooks.DispatchAsync("ticket.escalated", new
                {
                    ticket.Id, ticket.TicketNumber, ticket.Status, ticket.Category, ticket.Priority
                });
            }
        }
    }
}
