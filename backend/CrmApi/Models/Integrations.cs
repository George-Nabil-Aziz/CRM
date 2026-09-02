namespace CrmApi.Models;

public class ApiKey
{
    public Guid Id { get; set; }
    public string Key { get; set; } = string.Empty;
    public Guid OwnerId { get; set; }
    public List<string> Scopes { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public enum ErpEntityType
{
    Customer,
    Order
}

public enum SyncStatus
{
    Success,
    Failed,
    InProgress
}

public class ErpSyncLog
{
    public Guid Id { get; set; }
    public ErpEntityType EntityType { get; set; }
    public string ExternalId { get; set; } = string.Empty;
    public SyncStatus Status { get; set; }
    public DateTime SyncedAt { get; set; }
}

public enum IntegrationChannel
{
    Email,
    Sms,
    Whatsapp
}

public enum ChannelStatus
{
    Active,
    Inactive,
    Error
}

public class ChannelConfig
{
    public Guid Id { get; set; }
    public IntegrationChannel Channel { get; set; }
    public string Credentials { get; set; } = string.Empty;
    public ChannelStatus Status { get; set; } = ChannelStatus.Inactive;
}

public class Webhook
{
    public Guid Id { get; set; }
    public string Url { get; set; } = string.Empty;
    public List<string> Events { get; set; } = new();
    public string Secret { get; set; } = string.Empty;
}
