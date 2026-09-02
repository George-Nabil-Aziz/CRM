using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using CrmApi.Data;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Services;

// Story 52: fires subscribed webhooks when a CRM event occurs (e.g. ticket.created).
// Best-effort delivery: failures are logged, not retried synchronously, so they never block
// the request that triggered the event.
public class WebhookDispatcher(CrmDbContext db, IHttpClientFactory httpClientFactory, ILogger<WebhookDispatcher> logger)
{
    // Matches the API's own JSON conventions (string enums) so webhook payloads look like API responses.
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        Converters = { new JsonStringEnumConverter() }
    };

    public async Task DispatchAsync(string eventName, object payload)
    {
        var allWebhooks = await db.Webhooks.ToListAsync();
        var subscribers = allWebhooks.Where(w => w.Events.Contains(eventName)).ToList();
        if (subscribers.Count == 0)
        {
            return;
        }

        var json = JsonSerializer.Serialize(payload, JsonOptions);
        var client = httpClientFactory.CreateClient(nameof(WebhookDispatcher));

        foreach (var webhook in subscribers)
        {
            try
            {
                var signature = Convert.ToHexString(HMACSHA256.HashData(Encoding.UTF8.GetBytes(webhook.Secret), Encoding.UTF8.GetBytes(json)));
                using var request = new HttpRequestMessage(HttpMethod.Post, webhook.Url)
                {
                    Content = new StringContent(json, Encoding.UTF8, "application/json")
                };
                request.Headers.Add("X-Crm-Event", eventName);
                request.Headers.Add("X-Crm-Signature", signature);

                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
                await client.SendAsync(request, cts.Token);
            }
            catch (Exception ex)
            {
                // Best-effort: one subscriber's failure must not affect delivery to the others,
                // or the request that triggered this event.
                logger.LogWarning(ex, "Webhook delivery to {Url} failed for event {Event}", webhook.Url, eventName);
            }
        }
    }
}
