using CrmApi.Data;
using CrmApi.Models;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Services;

// Runs the automation described in stories 22-25 and 32 whenever a ticket is created.
public class TicketAutomationService(CrmDbContext db)
{
    public async Task ApplyOnCreateAsync(Ticket ticket)
    {
        var slaRule = await db.SlaRules
            .FirstOrDefaultAsync(r => r.Category == ticket.Category && r.Priority == ticket.Priority);

        if (slaRule is not null)
        {
            ticket.ResponseTargetAt = ticket.CreatedAt.AddMinutes(slaRule.ResponseTargetMinutes);
            ticket.ResolutionTargetAt = ticket.CreatedAt.AddMinutes(slaRule.ResolutionTargetMinutes);
        }

        var assignmentRule = await db.AssignmentRules
            .Where(r => r.Category == null || r.Category == ticket.Category)
            .OrderBy(r => r.Category == null ? 1 : 0) // category-specific rules win over catch-all rules
            .ThenBy(r => r.Order)
            .FirstOrDefaultAsync();

        if (assignmentRule is not null)
        {
            ticket.AssignedAgentId = assignmentRule.TargetAgentId;
            db.TicketEvents.Add(new TicketEvent
            {
                Id = Guid.NewGuid(),
                TicketId = ticket.Id,
                Type = TicketEventType.Assignment,
                Timestamp = DateTime.UtcNow,
                Details = $"Auto-assigned to agent {assignmentRule.TargetAgentId} by rule {assignmentRule.Id}."
            });
        }
    }
}
