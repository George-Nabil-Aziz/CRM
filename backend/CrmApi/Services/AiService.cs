using CrmApi.Data;
using CrmApi.Models;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Services;

// Implements stories 30-34 with a lightweight, keyword-based engine that requires no external
// LLM credentials. Swap the method bodies here for real model calls when credentials are available;
// the controller-facing contract (methods below) stays the same either way.
public class AiService(CrmDbContext db)
{
    private static readonly Dictionary<TicketCategory, string[]> CategoryKeywords = new()
    {
        [TicketCategory.Billing] = ["invoice", "charge", "refund", "payment", "bill"],
        [TicketCategory.Technical] = ["error", "bug", "crash", "not working", "login", "broken"],
        [TicketCategory.Account] = ["password", "account", "profile", "email address", "access"],
        [TicketCategory.FeatureRequest] = ["feature", "suggestion", "please add", "would be nice"],
    };

    public async Task<string> SummarizeAsync(Guid ticketId)
    {
        var ticket = await db.Tickets.FindAsync(ticketId)
            ?? throw new KeyNotFoundException();
        var messages = await db.Messages.Where(m => m.TicketId == ticketId).OrderBy(m => m.SentAt).ToListAsync();

        if (messages.Count == 0)
        {
            return $"Ticket {ticket.TicketNumber} ({ticket.Category}, {ticket.Priority}): {ticket.Subject}. No messages yet.";
        }

        var first = Truncate(messages.First().Body, 160);
        var last = messages.Count > 1 ? Truncate(messages.Last().Body, 160) : null;

        return last is null
            ? $"Ticket {ticket.TicketNumber} ({ticket.Category}, {ticket.Priority}): {first}"
            : $"Ticket {ticket.TicketNumber} ({ticket.Category}, {ticket.Priority}, {messages.Count} messages). Opened with: {first} Most recent: {last}";
    }

    public async Task<string> SuggestReplyAsync(Guid ticketId)
    {
        var ticket = await db.Tickets.FindAsync(ticketId)
            ?? throw new KeyNotFoundException();

        return ticket.Category switch
        {
            TicketCategory.Billing => "Thanks for reaching out about your billing concern. I've located your account and I'm reviewing the charge now -- I'll follow up shortly with a resolution.",
            TicketCategory.Technical => "Sorry for the trouble. Could you confirm the exact error message and the steps that lead to it? That will help me reproduce and fix the issue quickly.",
            TicketCategory.Account => "I can help with your account. For security, could you confirm the email address on file so I can verify your identity before making changes?",
            TicketCategory.FeatureRequest => "Thanks for the suggestion! I've logged this for our product team to review. I'll update this ticket if it gets scheduled.",
            _ => "Thanks for contacting support. I'm looking into this now and will follow up shortly.",
        };
    }

    public TicketCategory Categorize(string subject, string body)
    {
        var text = $"{subject} {body}".ToLowerInvariant();
        foreach (var (category, keywords) in CategoryKeywords)
        {
            if (keywords.Any(k => text.Contains(k)))
            {
                return category;
            }
        }
        return TicketCategory.General;
    }

    public async Task<List<(Guid TicketId, string TicketNumber, string Subject)>> SuggestSolutionsAsync(Guid ticketId)
    {
        var ticket = await db.Tickets.FindAsync(ticketId)
            ?? throw new KeyNotFoundException();

        var similar = await db.Tickets
            .Where(t => t.Id != ticketId && t.Category == ticket.Category
                && (t.Status == TicketStatus.Resolved || t.Status == TicketStatus.Closed))
            .OrderByDescending(t => t.ResolvedAt)
            .Take(3)
            .Select(t => new { t.Id, t.TicketNumber, t.Subject })
            .ToListAsync();

        return similar.Select(t => (t.Id, t.TicketNumber, t.Subject)).ToList();
    }

    public async Task<(string Reply, bool HandOff)> ChatbotReplyAsync(string message)
    {
        var lower = message.ToLowerInvariant();

        var match = await db.Articles
            .Where(a => a.Published)
            .ToListAsync();

        var hit = match.FirstOrDefault(a =>
            lower.Split(' ', StringSplitOptions.RemoveEmptyEntries)
                 .Any(word => word.Length > 3 && (a.Title.ToLowerInvariant().Contains(word) || a.Body.ToLowerInvariant().Contains(word))));

        if (hit is not null)
        {
            return (Truncate(hit.Body, 300), false);
        }

        return ("I couldn't find a confident answer to that in our knowledge base. I'll connect you with a human agent.", true);
    }

    private static string Truncate(string s, int max) => s.Length <= max ? s : s[..max] + "...";
}
