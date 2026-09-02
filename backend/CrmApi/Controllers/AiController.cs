using CrmApi.Data;
using CrmApi.Dtos;
using CrmApi.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Controllers;

[ApiController]
[Route("api")]
public class AiController(CrmDbContext db, AiService ai) : ControllerBase
{
    // Story 30: AI ticket summaries
    [HttpGet("tickets/{id:guid}/ai/summary")]
    public async Task<ActionResult<AiSummaryResponse>> Summary(Guid id)
    {
        var exists = await db.Tickets.AnyAsync(t => t.Id == id);
        if (!exists) return NotFound();

        var summary = await ai.SummarizeAsync(id);
        return Ok(new AiSummaryResponse(id, summary));
    }

    // Story 31: AI suggested replies
    [HttpPost("tickets/{id:guid}/ai/suggest-reply")]
    public async Task<ActionResult<AiSuggestedReplyResponse>> SuggestReply(Guid id)
    {
        var exists = await db.Tickets.AnyAsync(t => t.Id == id);
        if (!exists) return NotFound();

        var reply = await ai.SuggestReplyAsync(id);
        return Ok(new AiSuggestedReplyResponse(id, reply));
    }

    // Story 33: AI suggested solutions
    [HttpGet("tickets/{id:guid}/ai/suggest-solutions")]
    public async Task<ActionResult<List<SuggestedSolution>>> SuggestSolutions(Guid id)
    {
        var exists = await db.Tickets.AnyAsync(t => t.Id == id);
        if (!exists) return NotFound();

        var solutions = await ai.SuggestSolutionsAsync(id);
        return Ok(solutions.Select(s => new SuggestedSolution(s.TicketId, s.TicketNumber, s.Subject)).ToList());
    }

    // Story 34: AI chatbot
    [HttpPost("chatbot/message")]
    public async Task<ActionResult<ChatbotMessageResponse>> ChatbotMessage(ChatbotMessageRequest request)
    {
        var (reply, handOff) = await ai.ChatbotReplyAsync(request.Message);
        var sessionId = request.SessionId ?? Guid.NewGuid();

        return Ok(new ChatbotMessageResponse(sessionId, reply, handOff));
    }
}
