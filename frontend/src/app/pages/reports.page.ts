import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { I18nService } from '../i18n/i18n.service';
import {
  AgentPerformanceEntry, CsatReport, DateRange, SlaPerformanceEntry, TicketReportEntry
} from '../models';

type GroupBy = 'status' | 'category' | 'date';
type Tab = 'tickets' | 'sla' | 'agents' | 'csat';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h1>Reports</h1>
    <p class="lede">Ticket volume, SLA compliance, agent performance and customer satisfaction.</p>

    <div class="card filters">
      <div class="field">
        <label for="from">From</label>
        <input id="from" type="date" [(ngModel)]="dateFrom" (ngModelChange)="reload()" />
      </div>
      <div class="field">
        <label for="to">To</label>
        <input id="to" type="date" [(ngModel)]="dateTo" (ngModelChange)="reload()" />
      </div>
      @if (dateFrom || dateTo) {
        <button class="btn secondary clear" type="button" (click)="clearDates()">Clear dates</button>
      }
    </div>

    <div class="tabs">
      @for (t of tabs; track t.key) {
        <button type="button" class="tab" [class.on]="tab === t.key" (click)="tab = t.key">{{ t.label }}</button>
      }
    </div>

    @if (loading) {
      <div class="card"><p class="muted">Loading…</p></div>
    } @else if (error) {
      <div class="card"><p class="err">{{ error }}</p></div>
    } @else {

      @if (tab === 'tickets') {
        <div class="card">
          <div class="card-head">
            <h3>Ticket volume</h3>
            <div class="chips">
              @for (g of groupings; track g) {
                <button type="button" class="chip" [class.on]="groupBy === g" (click)="setGrouping(g)">{{ g }}</button>
              }
            </div>
          </div>
          @if (ticketReport.length === 0) {
            <p class="muted">No tickets in this window.</p>
          } @else {
            <div class="bars">
              @for (row of ticketReport; track row.group) {
                <div class="bar-row">
                  <span class="bar-label">{{ row.group }}</span>
                  <span class="bar-track">
                    <span class="bar-fill" [style.width.%]="percentOfMax(row.count, ticketMax)"></span>
                  </span>
                  <span class="bar-value">{{ row.count }}</span>
                </div>
              }
            </div>
            <p class="total">{{ ticketTotal }} tickets total</p>
          }
        </div>
      }

      @if (tab === 'sla') {
        <div class="card">
          <h3>SLA performance</h3>
          @if (slaReport.length === 0) {
            <p class="muted">No SLA-tracked tickets in this window.</p>
          } @else {
            <table>
              <thead>
                <tr><th>Category</th><th>Priority</th><th>Total</th><th>Met target</th><th>Compliance</th></tr>
              </thead>
              <tbody>
                @for (row of slaReport; track row.category + row.priority) {
                  <tr>
                    <td>{{ row.category }}</td>
                    <td><span class="badge" [ngClass]="row.priority">{{ row.priority }}</span></td>
                    <td>{{ row.total }}</td>
                    <td>{{ row.metTarget }}</td>
                    <td>
                      <span class="compliance" [class.good]="row.compliancePercent >= 90"
                            [class.bad]="row.compliancePercent < 60">{{ row.compliancePercent }}%</span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      }

      @if (tab === 'agents') {
        <div class="card">
          <h3>Agent performance</h3>
          @if (agentReport.length === 0) {
            <p class="muted">No assigned tickets in this window.</p>
          } @else {
            <table>
              <thead><tr><th>#</th><th>Agent</th><th>Tickets</th><th>Avg. resolution</th></tr></thead>
              <tbody>
                @for (row of agentReport; track row.agentId; let i = $index) {
                  <tr>
                    <td class="rank">{{ i + 1 }}</td>
                    <td>{{ row.agentName }}</td>
                    <td>{{ row.ticketCount }}</td>
                    <td>{{ row.averageResolutionHours ? row.averageResolutionHours + ' hrs' : '—' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      }

      @if (tab === 'csat') {
        <div class="card">
          <h3>Customer satisfaction</h3>
          @if (!csat || csat.responseCount === 0) {
            <p class="muted">No feedback submitted in this window.</p>
          } @else {
            <div class="grid">
              <div class="stat">
                <div class="stat-label">Responses</div>
                <div class="stat-value">{{ csat.responseCount }}</div>
              </div>
              <div class="stat">
                <div class="stat-label">Average rating</div>
                <div class="stat-value">{{ csat.averageRating }}<span class="of5">/5</span></div>
              </div>
              <div class="stat">
                <div class="stat-label">Satisfied (4★ and up)</div>
                <div class="stat-value">{{ csat.percentSatisfied }}<span class="of5">%</span></div>
              </div>
            </div>
          }
        </div>
      }
    }
  `,
  styles: [`
    .lede { color: var(--muted); margin: -0.25rem 0 1rem; }
    .muted { color: var(--muted); }
    .err { color: var(--danger); }

    .filters { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 1rem; }
    .field { min-width: 150px; }
    .field input { margin: 0; }
    .clear { padding: 0.45rem 0.8rem; }

    .tabs { display: flex; flex-wrap: wrap; gap: 0.4rem; margin: 1rem 0; }
    .tab {
      padding: 0.45rem 0.9rem; border-radius: 8px; cursor: pointer; font: inherit; font-size: 0.88rem;
      background: var(--card); color: var(--muted); border: 1px solid var(--border);
    }
    .tab:hover { color: var(--text); border-color: var(--primary); }
    .tab.on { background: var(--primary); border-color: var(--primary); color: #fff; font-weight: 600; }

    .card-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.75rem; }
    .card-head h3 { margin: 0; }
    .chips { display: flex; gap: 0.3rem; }
    .chip {
      padding: 0.25rem 0.65rem; border-radius: 999px; cursor: pointer; font: inherit; font-size: 0.78rem;
      background: var(--card); color: var(--muted); border: 1px solid var(--border); text-transform: capitalize;
    }
    .chip.on { background: var(--primary); border-color: var(--primary); color: #fff; font-weight: 600; }

    .bars { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem; }
    .bar-row { display: grid; grid-template-columns: minmax(90px, 130px) 1fr auto; align-items: center; gap: 0.75rem; }
    .bar-label { font-size: 0.85rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .bar-track { height: 0.6rem; border-radius: 999px; background: var(--border); overflow: hidden; }
    .bar-fill { display: block; height: 100%; border-radius: 999px; background: var(--primary); }
    .bar-value { font-size: 0.85rem; font-weight: 600; min-width: 2.5ch; text-align: end; }
    .total { color: var(--muted); font-size: 0.85rem; margin: 1rem 0 0; }

    .compliance { font-weight: 600; }
    .compliance.good { color: var(--success); }
    .compliance.bad { color: var(--danger); }
    .rank { color: var(--muted); width: 2rem; }

    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-top: 0.75rem; }
    .stat-label { color: var(--muted); font-size: 0.85rem; }
    .stat-value { font-size: 1.8rem; font-weight: 700; margin-top: 0.25rem; }
    .of5 { font-size: 1rem; color: var(--muted); }
  `]
})
export class ReportsPage implements OnInit {
  readonly i18n = inject(I18nService);

  readonly tabs: { key: Tab; label: string }[] = [
    { key: 'tickets', label: 'Tickets' },
    { key: 'sla', label: 'SLA' },
    { key: 'agents', label: 'Agents' },
    { key: 'csat', label: 'Satisfaction' },
  ];
  readonly groupings: GroupBy[] = ['status', 'category', 'date'];

  tab: Tab = 'tickets';
  groupBy: GroupBy = 'status';
  dateFrom = '';
  dateTo = '';
  loading = true;
  error = '';

  ticketReport: TicketReportEntry[] = [];
  slaReport: SlaPerformanceEntry[] = [];
  agentReport: AgentPerformanceEntry[] = [];
  csat: CsatReport | null = null;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.reload();
  }

  reload() {
    this.loading = true;
    this.error = '';

    // One dashboard call covers SLA, agents and CSAT; only the ticket grouping needs its own
    // request, because the dashboard always groups by status.
    this.api.getDashboard(this.range).subscribe({
      next: (d) => {
        this.slaReport = d.slaPerformance;
        this.agentReport = d.agentPerformance;
        this.csat = d.csat;
        this.loadTicketReport();
      },
      error: () => {
        this.loading = false;
        this.error = 'Could not load reports. Is the API running?';
      },
    });
  }

  setGrouping(g: GroupBy) {
    if (this.groupBy === g) return;
    this.groupBy = g;
    this.loadTicketReport();
  }

  clearDates() {
    this.dateFrom = '';
    this.dateTo = '';
    this.reload();
  }

  percentOfMax(value: number, max: number): number {
    return max === 0 ? 0 : Math.max(2, Math.round((100 * value) / max));
  }

  get ticketMax(): number {
    return this.ticketReport.reduce((m, r) => Math.max(m, r.count), 0);
  }

  get ticketTotal(): number {
    return this.ticketReport.reduce((n, r) => n + r.count, 0);
  }

  private get range(): DateRange {
    return { dateFrom: this.dateFrom || undefined, dateTo: this.dateTo || undefined };
  }

  private loadTicketReport() {
    this.loading = true;
    this.api.getTicketReport(this.range, this.groupBy).subscribe({
      next: (rows) => {
        // Date buckets read backwards otherwise; everything else keeps the API's order.
        this.ticketReport = this.groupBy === 'date'
          ? [...rows].sort((a, b) => a.group.localeCompare(b.group))
          : rows;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Could not load the ticket report.';
      },
    });
  }
}
