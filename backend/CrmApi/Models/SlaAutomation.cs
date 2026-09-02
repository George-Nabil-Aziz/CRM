namespace CrmApi.Models;

public class SlaRule
{
    public Guid Id { get; set; }
    public TicketCategory Category { get; set; }
    public TicketPriority Priority { get; set; }
    public int ResponseTargetMinutes { get; set; }
    public int ResolutionTargetMinutes { get; set; }
}

public class AssignmentRule
{
    public Guid Id { get; set; }
    public TicketCategory? Category { get; set; }
    public Guid TargetAgentId { get; set; }
    public int Order { get; set; }
}

public enum NotificationType
{
    SlaBreach,
    SlaWarning,
    Mention,
    Reminder,
    Assignment
}

public class Notification
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid? TicketId { get; set; }
    public NotificationType Type { get; set; }
    public string Message { get; set; } = string.Empty;
    public bool Read { get; set; }
    public DateTime SentAt { get; set; }
}
