using CrmApi.Data;
using CrmApi.Dtos;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Controllers;

[ApiController]
[Route("api/audit-logs")]
public class AuditLogsController(CrmDbContext db) : ControllerBase
{
    // Story 47: Audit logs
    [HttpGet]
    public async Task<ActionResult<List<AuditLogResponse>>> List(
        [FromQuery] Guid? actorId, [FromQuery] string? targetType,
        [FromQuery] DateTime? dateFrom, [FromQuery] DateTime? dateTo)
    {
        var query = db.AuditLogs.AsQueryable();

        if (actorId is not null) query = query.Where(a => a.ActorId == actorId);
        if (!string.IsNullOrWhiteSpace(targetType)) query = query.Where(a => a.TargetType == targetType);
        if (dateFrom is not null) query = query.Where(a => a.Timestamp >= dateFrom);
        if (dateTo is not null) query = query.Where(a => a.Timestamp <= dateTo);

        var logs = await query
            .OrderByDescending(a => a.Timestamp)
            .Select(a => new AuditLogResponse(a.Id, a.ActorId, a.Action, a.TargetType, a.TargetId, a.Timestamp))
            .ToListAsync();

        return Ok(logs);
    }
}
