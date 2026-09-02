namespace CrmApi.Models;

public class Reminder
{
    public Guid Id { get; set; }
    public Guid TicketId { get; set; }
    public Guid AgentId { get; set; }
    public DateTime DueAt { get; set; }
    public string Note { get; set; } = string.Empty;
    public bool Dismissed { get; set; }

    public Ticket? Ticket { get; set; }
}

public class QuickReply
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string? Category { get; set; }
}

public class InternalNote
{
    public Guid Id { get; set; }
    public Guid TicketId { get; set; }
    public Guid AuthorId { get; set; }
    public string Text { get; set; } = string.Empty;
    public List<Guid> Mentions { get; set; } = new();
    public DateTime CreatedAt { get; set; }

    public Ticket? Ticket { get; set; }
}
