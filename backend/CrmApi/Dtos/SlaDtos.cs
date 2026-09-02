using System.ComponentModel.DataAnnotations;
using CrmApi.Models;

namespace CrmApi.Dtos;

public record CreateSlaRuleRequest(
    [Required] TicketCategory Category,
    [Required] TicketPriority Priority,
    [Required, Range(1, int.MaxValue)] int ResponseTargetMinutes,
    [Required, Range(1, int.MaxValue)] int ResolutionTargetMinutes
);

public record SlaRuleResponse(Guid Id, TicketCategory Category, TicketPriority Priority, int ResponseTargetMinutes, int ResolutionTargetMinutes);

public record CreateAssignmentRuleRequest(
    TicketCategory? Category,
    [Required] Guid TargetAgentId,
    int Order
);

public record AssignmentRuleResponse(Guid Id, TicketCategory? Category, Guid TargetAgentId, int Order);
