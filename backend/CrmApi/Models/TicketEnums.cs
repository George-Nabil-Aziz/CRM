namespace CrmApi.Models;

public enum TicketStatus
{
    Open,
    Pending,
    Resolved,
    Closed
}

public enum TicketCategory
{
    Billing,
    Technical,
    Account,
    General,
    FeatureRequest
}

public enum TicketPriority
{
    Low,
    Medium,
    High,
    Urgent
}

public enum TicketEventType
{
    StatusChange,
    Assignment,
    Escalation,
    Message,
    Note
}
