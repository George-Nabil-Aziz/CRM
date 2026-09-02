using System.ComponentModel.DataAnnotations;

namespace CrmApi.Dtos;

public record InboundEmailRequest(
    [Required, EmailAddress] string From,
    [Required, MinLength(1)] string Subject,
    [Required, MinLength(1)] string Body,
    string? ProviderDeliveryId
);

public record InboundPhoneMessageRequest(
    [Required, MinLength(1)] string From,
    [Required, MinLength(1)] string Body,
    string? ProviderDeliveryId
);

public record WebFormRequest(
    [Required, MinLength(1)] string Name,
    [Required, EmailAddress] string Email,
    [Required, MinLength(1)] string Subject,
    [Required, MinLength(1)] string Message
);

public record SendChatMessageRequest(
    [Required, MinLength(1)] string From,
    [Required, MinLength(1)] string Body
);

public record MessageResponse(Guid Id, Guid TicketId, string Channel, string From, string Body, DateTime SentAt);
