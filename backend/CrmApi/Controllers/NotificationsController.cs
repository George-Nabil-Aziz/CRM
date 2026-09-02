using CrmApi.Data;
using CrmApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Controllers;

[ApiController]
[Route("api/notifications")]
public class NotificationsController(CrmDbContext db) : ControllerBase
{
    // Story 25: Alerts and notifications
    [HttpGet]
    public async Task<ActionResult<List<Notification>>> List([FromQuery] Guid userId, [FromQuery] bool unreadOnly = false)
    {
        var query = db.Notifications.Where(n => n.UserId == userId);
        if (unreadOnly)
        {
            query = query.Where(n => !n.Read);
        }

        var notifications = await query.OrderByDescending(n => n.SentAt).ToListAsync();
        return Ok(notifications);
    }

    [HttpPost("{id:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid id)
    {
        var notification = await db.Notifications.FindAsync(id);
        if (notification is null)
        {
            return NotFound();
        }

        notification.Read = true;
        await db.SaveChangesAsync();
        return NoContent();
    }
}
