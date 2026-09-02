using CrmApi.Data;
using CrmApi.Dtos;
using CrmApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Controllers;

[ApiController]
[Route("api/reports")]
public class ReportsController(CrmDbContext db) : ControllerBase
{
    // Story 40: Ticket reports
    [HttpGet("tickets")]
    public async Task<ActionResult<List<TicketReportEntry>>> TicketReport(
        [FromQuery] DateTime? dateFrom, [FromQuery] DateTime? dateTo, [FromQuery] string groupBy = "status")
        => Ok(await BuildTicketReportAsync(dateFrom, dateTo, groupBy));

    // Story 41: SLA performance reports
    [HttpGet("sla")]
    public async Task<ActionResult<List<SlaPerformanceEntry>>> SlaPerformance(
        [FromQuery] DateTime? dateFrom, [FromQuery] DateTime? dateTo)
        => Ok(await BuildSlaPerformanceAsync(dateFrom, dateTo));

    // Story 42: Agent performance reports
    [HttpGet("agents")]
    public async Task<ActionResult<List<AgentPerformanceEntry>>> AgentPerformance(
        [FromQuery] DateTime? dateFrom, [FromQuery] DateTime? dateTo)
        => Ok(await BuildAgentPerformanceAsync(dateFrom, dateTo));

    // Story 43: Customer satisfaction reports
    [HttpGet("csat")]
    public async Task<ActionResult<CsatReportResponse>> Csat([FromQuery] DateTime? dateFrom, [FromQuery] DateTime? dateTo)
        => Ok(await BuildCsatAsync(dateFrom, dateTo));

    // Story 44: Management dashboards
    [HttpGet("dashboard")]
    public async Task<ActionResult<DashboardResponse>> Dashboard([FromQuery] DateTime? dateFrom, [FromQuery] DateTime? dateTo)
    {
        var tickets = await BuildTicketReportAsync(dateFrom, dateTo, "status");
        var sla = await BuildSlaPerformanceAsync(dateFrom, dateTo);
        var agents = await BuildAgentPerformanceAsync(dateFrom, dateTo);
        var csat = await BuildCsatAsync(dateFrom, dateTo);

        return Ok(new DashboardResponse(tickets, sla, agents, csat));
    }

    private async Task<List<TicketReportEntry>> BuildTicketReportAsync(DateTime? dateFrom, DateTime? dateTo, string groupBy)
    {
        var query = db.Tickets.AsQueryable();
        if (dateFrom is not null) query = query.Where(t => t.CreatedAt >= dateFrom);
        if (dateTo is not null) query = query.Where(t => t.CreatedAt <= dateTo);
        var tickets = await query.ToListAsync();

        var groups = groupBy.ToLowerInvariant() switch
        {
            "category" => tickets.GroupBy(t => t.Category.ToString()),
            "date" => tickets.GroupBy(t => t.CreatedAt.Date.ToString("yyyy-MM-dd")),
            _ => tickets.GroupBy(t => t.Status.ToString()),
        };

        return groups.Select(g => new TicketReportEntry(g.Key, g.Count())).ToList();
    }

    private async Task<List<SlaPerformanceEntry>> BuildSlaPerformanceAsync(DateTime? dateFrom, DateTime? dateTo)
    {
        var query = db.Tickets.Where(t => t.ResolutionTargetAt != null);
        if (dateFrom is not null) query = query.Where(t => t.CreatedAt >= dateFrom);
        if (dateTo is not null) query = query.Where(t => t.CreatedAt <= dateTo);
        var tickets = await query.ToListAsync();

        return tickets
            .GroupBy(t => (t.Category, t.Priority))
            .Select(g =>
            {
                var total = g.Count();
                var met = g.Count(t => t.ResolvedAt != null && t.ResolvedAt <= t.ResolutionTargetAt);
                return new SlaPerformanceEntry(
                    g.Key.Category.ToString(), g.Key.Priority.ToString(), total, met,
                    total == 0 ? 0 : Math.Round(100.0 * met / total, 1));
            })
            .ToList();
    }

    private async Task<List<AgentPerformanceEntry>> BuildAgentPerformanceAsync(DateTime? dateFrom, DateTime? dateTo)
    {
        var query = db.Tickets.Where(t => t.AssignedAgentId != null);
        if (dateFrom is not null) query = query.Where(t => t.CreatedAt >= dateFrom);
        if (dateTo is not null) query = query.Where(t => t.CreatedAt <= dateTo);
        var tickets = await query.ToListAsync();
        var agentIds = tickets.Select(t => t.AssignedAgentId!.Value).Distinct().ToList();
        var agentNames = await db.Users
            .Where(u => agentIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.Name);

        return tickets
            .GroupBy(t => t.AssignedAgentId!.Value)
            .Select(g =>
            {
                var resolved = g.Where(t => t.ResolvedAt != null).ToList();
                var avgHours = resolved.Count == 0
                    ? 0
                    : resolved.Average(t => (t.ResolvedAt!.Value - t.CreatedAt).TotalHours);
                var name = agentNames.GetValueOrDefault(g.Key, "Unknown agent");
                return new AgentPerformanceEntry(g.Key, name, g.Count(), Math.Round(avgHours, 1));
            })
            .OrderByDescending(a => a.TicketCount)
            .ToList();
    }

    private async Task<CsatReportResponse> BuildCsatAsync(DateTime? dateFrom, DateTime? dateTo)
    {
        var query = db.Feedbacks.AsQueryable();
        if (dateFrom is not null) query = query.Where(f => f.SubmittedAt >= dateFrom);
        if (dateTo is not null) query = query.Where(f => f.SubmittedAt <= dateTo);
        var feedback = await query.ToListAsync();

        if (feedback.Count == 0)
        {
            return new CsatReportResponse(0, 0, 0);
        }

        var avg = feedback.Average(f => f.Rating);
        var satisfied = feedback.Count(f => f.Rating >= 4);

        return new CsatReportResponse(
            feedback.Count, Math.Round(avg, 2), Math.Round(100.0 * satisfied / feedback.Count, 1));
    }
}
