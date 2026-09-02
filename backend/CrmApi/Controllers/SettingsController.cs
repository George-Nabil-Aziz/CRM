using CrmApi.Data;
using CrmApi.Dtos;
using CrmApi.Models;
using CrmApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace CrmApi.Controllers;

[ApiController]
[Route("api/settings")]
public class SettingsController(CrmDbContext db, AuditLogger audit) : ControllerBase
{
    // Story 48: System configuration
    [HttpPatch]
    public async Task<ActionResult<SettingResponse>> Upsert(UpsertSettingRequest request)
    {
        var setting = await db.SystemSettings.FindAsync(request.Key);
        if (setting is null)
        {
            setting = new SystemSetting { Key = request.Key, Value = request.Value };
            db.SystemSettings.Add(setting);
        }
        else
        {
            setting.Value = request.Value;
        }

        await db.SaveChangesAsync();
        await audit.LogAsync("update", "setting", Guid.Empty);

        return Ok(new SettingResponse(setting.Key, setting.Value));
    }

    [HttpGet("{key}")]
    public async Task<ActionResult<SettingResponse>> Get(string key)
    {
        var setting = await db.SystemSettings.FindAsync(key);
        return setting is null ? NotFound() : Ok(new SettingResponse(setting.Key, setting.Value));
    }
}
