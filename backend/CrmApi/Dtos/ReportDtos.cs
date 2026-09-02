namespace CrmApi.Dtos;

public record TicketReportEntry(string Group, int Count);

public record SlaPerformanceEntry(string Category, string Priority, int Total, int MetTarget, double CompliancePercent);

public record AgentPerformanceEntry(Guid AgentId, string AgentName, int TicketCount, double AverageResolutionHours);

public record CsatReportResponse(int ResponseCount, double AverageRating, double PercentSatisfied);

public record DashboardResponse(
    List<TicketReportEntry> TicketsByStatus,
    List<SlaPerformanceEntry> SlaPerformance,
    List<AgentPerformanceEntry> AgentPerformance,
    CsatReportResponse Csat
);
