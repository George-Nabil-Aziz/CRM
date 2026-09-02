namespace CrmApi.Models;

public enum MessageChannel
{
    Email,
    Whatsapp,
    Sms,
    Chat,
    Webform
}

public class Message
{
    public Guid Id { get; set; }
    public Guid TicketId { get; set; }
    public MessageChannel Channel { get; set; }
    public string From { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string? ProviderDeliveryId { get; set; }
    public DateTime SentAt { get; set; }

    public Ticket? Ticket { get; set; }
}
