using CrmApi.Data;
using CrmApi.Dtos;
using CrmApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Controllers;

[ApiController]
[Route("api/quick-replies")]
public class QuickRepliesController(CrmDbContext db) : ControllerBase
{
    // Story 20: Use quick replies
    [HttpGet]
    public async Task<ActionResult<List<QuickReplyResponse>>> List([FromQuery] string? category)
    {
        var query = db.QuickReplies.AsQueryable();
        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(q => q.Category == category);
        }

        var replies = await query
            .Select(q => new QuickReplyResponse(q.Id, q.Title, q.Body, q.Category))
            .ToListAsync();

        return Ok(replies);
    }

    [HttpPost]
    public async Task<ActionResult<QuickReplyResponse>> Create(CreateQuickReplyRequest request)
    {
        var reply = new QuickReply
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Body = request.Body,
            Category = request.Category
        };

        db.QuickReplies.Add(reply);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(List), new QuickReplyResponse(reply.Id, reply.Title, reply.Body, reply.Category));
    }
}
