namespace CrmApi.Models;

public class Customer
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Address { get; set; }
    public DateTime CreatedAt { get; set; }

    public List<Note> Notes { get; set; } = new();
    public List<Ticket> Tickets { get; set; } = new();
}
