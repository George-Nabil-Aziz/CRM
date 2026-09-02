using System.ComponentModel.DataAnnotations;

namespace CrmApi.Dtos;

public record CreateCustomerRequest(
    [Required, MinLength(1)] string Name,
    [Required, EmailAddress] string Email,
    [Required, MinLength(1)] string Phone
);

public record UpdateCustomerContactRequest(
    string? Phone,
    [EmailAddress] string? Email,
    string? Address
);

public record CustomerResponse(
    Guid Id,
    string Name,
    string Email,
    string Phone,
    string? Address,
    DateTime CreatedAt
);

public record InteractionEntry(
    Guid Id,
    string Type,
    Guid? TicketId,
    DateTime Timestamp,
    string Summary
);

public record AddNoteRequest(
    [Required, MinLength(1)] string Text,
    string? AttachmentUrl
);

public record NoteResponse(
    Guid Id,
    Guid CustomerId,
    Guid? AuthorId,
    string Text,
    string? AttachmentUrl,
    DateTime CreatedAt
);
