namespace CrmApi.Models;

public class Feedback
{
    public Guid Id { get; set; }
    public Guid TicketId { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public DateTime SubmittedAt { get; set; }

    public Ticket? Ticket { get; set; }
}
