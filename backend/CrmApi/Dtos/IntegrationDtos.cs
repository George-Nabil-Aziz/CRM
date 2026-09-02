using System.ComponentModel.DataAnnotations;
using CrmApi.Models;

namespace CrmApi.Dtos;

public record CreateApiKeyRequest(
    [Required] Guid OwnerId,
    List<string>? Scopes
);

public record ApiKeyResponse(Guid Id, string Key, Guid OwnerId, List<string> Scopes, DateTime CreatedAt);

public record ErpSyncRunResponse(int Synced, int Failed, DateTime CompletedAt);

public record CreateChannelConfigRequest(
    [Required] IntegrationChannel Channel,
    [Required, MinLength(1)] string Credentials
);

public record ChannelConfigResponse(Guid Id, IntegrationChannel Channel, ChannelStatus Status);

public record CreateWebhookRequest(
    [Required, Url] string Url,
    [Required] List<string> Events
);

public record WebhookResponse(Guid Id, string Url, List<string> Events);
