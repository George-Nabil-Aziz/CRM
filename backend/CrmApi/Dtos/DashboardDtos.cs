using System.ComponentModel.DataAnnotations;
using CrmApi.Models;

namespace CrmApi.Dtos;

public record TicketContextResponse(TicketResponse Ticket, CustomerResponse Customer);

public record CreateReminderRequest(
    [Required] Guid AgentId,
    [Required] DateTime DueAt,
    [Required, MinLength(1)] string Note
);

public record ReminderResponse(Guid Id, Guid TicketId, Guid AgentId, DateTime DueAt, string Note, bool Dismissed);

public record CreateQuickReplyRequest(
    [Required, MinLength(1)] string Title,
    [Required, MinLength(1)] string Body,
    string? Category
);

public record QuickReplyResponse(Guid Id, string Title, string Body, string? Category);

public record CreateInternalNoteRequest(
    [Required, MinLength(1)] string Text,
    [Required] Guid AuthorId,
    List<Guid>? MentionedUserIds
);

public record InternalNoteResponse(Guid Id, Guid TicketId, Guid AuthorId, string Text, List<Guid> Mentions, DateTime CreatedAt);
