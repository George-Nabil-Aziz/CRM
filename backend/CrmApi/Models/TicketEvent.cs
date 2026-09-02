namespace CrmApi.Models;

public class TicketEvent
{
    public Guid Id { get; set; }
    public Guid TicketId { get; set; }
    public TicketEventType Type { get; set; }
    public Guid? ActorId { get; set; }
    public DateTime Timestamp { get; set; }
    public string Details { get; set; } = string.Empty;

    public Ticket? Ticket { get; set; }
}
