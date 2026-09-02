using CrmApi.Dtos;
using CrmApi.Models;
using CrmApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace CrmApi.Controllers;

[ApiController]
[Route("api/channels")]
public class ChannelsController(ChannelIngestionService ingestion) : ControllerBase
{
    // Story 11: Contact via email
    [HttpPost("email/inbound")]
    public async Task<ActionResult<MessageResponse>> InboundEmail(InboundEmailRequest request)
    {
        var (_, message) = await ingestion.IngestAsync(
            MessageChannel.Email, request.From, senderKeyIsEmail: true, request.Body, request.Subject, request.ProviderDeliveryId);

        return Accepted(ToResponse(message));
    }

    // Story 12: Contact via WhatsApp
    [HttpPost("whatsapp/inbound")]
    public async Task<ActionResult<MessageResponse>> InboundWhatsapp(InboundPhoneMessageRequest request)
    {
        var (_, message) = await ingestion.IngestAsync(
            MessageChannel.Whatsapp, request.From, senderKeyIsEmail: false, request.Body, null, request.ProviderDeliveryId);

        return Accepted(ToResponse(message));
    }

    // Story 14: Contact via SMS
    [HttpPost("sms/inbound")]
    public async Task<ActionResult<MessageResponse>> InboundSms(InboundPhoneMessageRequest request)
    {
        var (_, message) = await ingestion.IngestAsync(
            MessageChannel.Sms, request.From, senderKeyIsEmail: false, request.Body, null, request.ProviderDeliveryId);

        return Accepted(ToResponse(message));
    }

    // Story 15: Submit via web form
    [HttpPost("webform")]
    public async Task<ActionResult<MessageResponse>> WebForm(WebFormRequest request)
    {
        var (_, message) = await ingestion.IngestAsync(
            MessageChannel.Webform, request.Email, senderKeyIsEmail: true, request.Message, request.Subject, null);

        return Accepted(ToResponse(message));
    }

    // Story 13: Contact via live chat (simplified as HTTP send + poll rather than a raw WebSocket)
    [HttpPost("chat/messages")]
    public async Task<ActionResult<MessageResponse>> SendChatMessage(SendChatMessageRequest request)
    {
        var (_, message) = await ingestion.IngestAsync(
            MessageChannel.Chat, request.From, senderKeyIsEmail: false, request.Body, null, null);

        return Accepted(ToResponse(message));
    }

    private static MessageResponse ToResponse(Message m) =>
        new(m.Id, m.TicketId, m.Channel.ToString(), m.From, m.Body, m.SentAt);
}
