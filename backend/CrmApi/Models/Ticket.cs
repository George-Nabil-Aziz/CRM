namespace CrmApi.Models;

public class Ticket
{
    public Guid Id { get; set; }
    public string TicketNumber { get; set; } = string.Empty;
    public Guid CustomerId { get; set; }
    public string Subject { get; set; } = string.Empty;
    public TicketStatus Status { get; set; } = TicketStatus.Open;
    public TicketCategory Category { get; set; }
    public TicketPriority Priority { get; set; }
    public Guid? AssignedAgentId { get; set; }
    public bool Escalated { get; set; }
    public DateTime? EscalatedAt { get; set; }
    public string? EscalationReason { get; set; }
    public DateTime? ResponseTargetAt { get; set; }
    public DateTime? ResolutionTargetAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public DateTime CreatedAt { get; set; }

    public Customer? Customer { get; set; }
    public List<TicketEvent> Events { get; set; } = new();
    public List<Message> Messages { get; set; } = new();
}
