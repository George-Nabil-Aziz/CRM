using System.ComponentModel.DataAnnotations;
using CrmApi.Models;

namespace CrmApi.Dtos;

public record CreateTicketRequest(
    [Required] Guid CustomerId,
    [Required, MinLength(1)] string Subject,
    [Required] TicketCategory Category,
    [Required] TicketPriority Priority
);

public record UpdateTicketCategoryPriorityRequest(
    TicketCategory? Category,
    TicketPriority? Priority
);

public record AssignTicketRequest(
    [Required] Guid AgentId
);

public record UpdateTicketStatusRequest(
    [Required] TicketStatus Status
);

public record EscalateTicketRequest(
    [Required, MinLength(1)] string Reason
);

public record TicketResponse(
    Guid Id,
    string TicketNumber,
    Guid CustomerId,
    string Subject,
    TicketStatus Status,
    TicketCategory Category,
    TicketPriority Priority,
    Guid? AssignedAgentId,
    bool Escalated,
    DateTime? EscalatedAt,
    string? EscalationReason,
    DateTime CreatedAt
);

public record TicketEventResponse(
    Guid Id,
    TicketEventType Type,
    Guid? ActorId,
    DateTime Timestamp,
    string Details
);
