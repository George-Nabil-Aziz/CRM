using System.ComponentModel.DataAnnotations;
using CrmApi.Models;

namespace CrmApi.Dtos;

public record PortalCreateTicketRequest(
    [Required] Guid CustomerId,
    [Required, MinLength(1)] string Subject,
    [Required] TicketCategory Category,
    [Required, MinLength(1)] string Description
);

public record SubmitFeedbackRequest(
    [Required, Range(1, 5)] int Rating,
    string? Comment
);

public record FeedbackResponse(Guid Id, Guid TicketId, int Rating, string? Comment, DateTime SubmittedAt);
