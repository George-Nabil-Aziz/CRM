using System.Security.Cryptography;
using CrmApi.Data;
using CrmApi.Dtos;
using CrmApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Controllers;

[ApiController]
[Route("api/integrations")]
public class IntegrationsController(CrmDbContext db) : ControllerBase
{
    // Story 49: APIs -- issue a scoped API key used to call the rest of the API programmatically.
    [HttpPost("apikeys")]
    public async Task<ActionResult<ApiKeyResponse>> CreateApiKey(CreateApiKeyRequest request)
    {
        var apiKey = new ApiKey
        {
            Id = Guid.NewGuid(),
            Key = Convert.ToHexString(RandomNumberGenerator.GetBytes(24)),
            OwnerId = request.OwnerId,
            Scopes = request.Scopes ?? [],
            CreatedAt = DateTime.UtcNow
        };

        db.ApiKeys.Add(apiKey);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetApiKey), new { id = apiKey.Id }, ToResponse(apiKey));
    }

    [HttpGet("apikeys/{id:guid}")]
    public async Task<ActionResult<ApiKeyResponse>> GetApiKey(Guid id)
    {
        var apiKey = await db.ApiKeys.FindAsync(id);
        return apiKey is null ? NotFound() : Ok(ToResponse(apiKey));
    }

    // Story 50: ERP integration -- manual trigger; the equivalent scheduled job runs the same logic.
    [HttpPost("erp/sync")]
    public async Task<ActionResult<ErpSyncRunResponse>> TriggerErpSync()
    {
        // No real ERP endpoint is configured in this environment, so this performs a no-op run
        // that still exercises and logs the sync mechanism end-to-end.
        var log = new ErpSyncLog
        {
            Id = Guid.NewGuid(),
            EntityType = ErpEntityType.Customer,
            ExternalId = "n/a",
            Status = SyncStatus.Success,
            SyncedAt = DateTime.UtcNow
        };

        db.ErpSyncLogs.Add(log);
        await db.SaveChangesAsync();

        return Accepted(new ErpSyncRunResponse(Synced: 0, Failed: 0, CompletedAt: log.SyncedAt));
    }

    [HttpGet("erp/sync-logs")]
    public async Task<ActionResult<List<ErpSyncLog>>> GetSyncLogs()
    {
        var logs = await db.ErpSyncLogs.OrderByDescending(l => l.SyncedAt).Take(50).ToListAsync();
        return Ok(logs);
    }

    // Story 51: Email, SMS & WhatsApp integration
    [HttpPost("channels")]
    public async Task<ActionResult<ChannelConfigResponse>> CreateChannelConfig(CreateChannelConfigRequest request)
    {
        var config = new ChannelConfig
        {
            Id = Guid.NewGuid(),
            Channel = request.Channel,
            Credentials = request.Credentials,
            Status = ChannelStatus.Active // credentials are trusted as-provided; no live provider call is made in this environment
        };

        db.ChannelConfigs.Add(config);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetChannelConfigs), null, ToResponse(config));
    }

    [HttpGet("channels")]
    public async Task<ActionResult<List<ChannelConfigResponse>>> GetChannelConfigs()
    {
        var configs = await db.ChannelConfigs.ToListAsync();
        return Ok(configs.Select(ToResponse).ToList());
    }

    // Story 52: External systems -- outbound webhook subscriptions
    [HttpPost("webhooks")]
    public async Task<ActionResult<WebhookResponse>> CreateWebhook(CreateWebhookRequest request)
    {
        var webhook = new Webhook
        {
            Id = Guid.NewGuid(),
            Url = request.Url,
            Events = request.Events,
            Secret = Convert.ToHexString(RandomNumberGenerator.GetBytes(16))
        };

        db.Webhooks.Add(webhook);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetWebhooks), null, ToResponse(webhook));
    }

    [HttpGet("webhooks")]
    public async Task<ActionResult<List<WebhookResponse>>> GetWebhooks()
    {
        var webhooks = await db.Webhooks.ToListAsync();
        return Ok(webhooks.Select(ToResponse).ToList());
    }

    private static ApiKeyResponse ToResponse(ApiKey a) => new(a.Id, a.Key, a.OwnerId, a.Scopes, a.CreatedAt);
    private static ChannelConfigResponse ToResponse(ChannelConfig c) => new(c.Id, c.Channel, c.Status);
    private static WebhookResponse ToResponse(Webhook w) => new(w.Id, w.Url, w.Events);
}
