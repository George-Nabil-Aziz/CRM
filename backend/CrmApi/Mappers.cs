using CrmApi.Dtos;
using CrmApi.Models;

namespace CrmApi;

public static class Mappers
{
    public static CustomerResponse ToResponse(Customer c) =>
        new(c.Id, c.Name, c.Email, c.Phone, c.Address, c.CreatedAt);

    public static NoteResponse ToResponse(Note n) =>
        new(n.Id, n.CustomerId, n.AuthorId, n.Text, n.AttachmentUrl, n.CreatedAt);

    public static TicketResponse ToResponse(Ticket t) => new(
        t.Id, t.TicketNumber, t.CustomerId, t.Subject, t.Status, t.Category, t.Priority,
        t.AssignedAgentId, t.Escalated, t.EscalatedAt, t.EscalationReason, t.CreatedAt);
}
