namespace CrmApi.Models;

public class Note
{
    public Guid Id { get; set; }
    public Guid CustomerId { get; set; }
    public Guid? AuthorId { get; set; }
    public string Text { get; set; } = string.Empty;
    public string? AttachmentUrl { get; set; }
    public DateTime CreatedAt { get; set; }

    public Customer? Customer { get; set; }
}
