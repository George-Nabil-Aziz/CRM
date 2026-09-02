using CrmApi.Data;
using CrmApi.Models;

namespace CrmApi.Services;

public class AuditLogger(CrmDbContext db)
{
    public async Task LogAsync(string action, string targetType, Guid targetId, Guid? actorId = null)
    {
        db.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            ActorId = actorId,
            Action = action,
            TargetType = targetType,
            TargetId = targetId,
            Timestamp = DateTime.UtcNow
        });
        await db.SaveChangesAsync();
    }
}
