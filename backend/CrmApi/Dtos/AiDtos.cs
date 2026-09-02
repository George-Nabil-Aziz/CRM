using System.ComponentModel.DataAnnotations;

namespace CrmApi.Dtos;

public record AiSummaryResponse(Guid TicketId, string SummaryText);

public record AiSuggestedReplyResponse(Guid TicketId, string SuggestedText);

public record SuggestedSolution(Guid TicketId, string TicketNumber, string Subject);

public record ChatbotMessageRequest([Required, MinLength(1)] string Message, Guid? SessionId);

public record ChatbotMessageResponse(Guid SessionId, string Reply, bool HandedOff);
