import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../api.service';
import { DashboardResponse, Ticket } from '../models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <h1>Dashboard</h1>

    @if (dashboard) {
      <div class="grid">
        <div class="card stat">
          <div class="stat-label">Open tickets</div>
          <div class="stat-value">{{ countFor('Open') }}</div>
        </div>
        <div class="card stat">
          <div class="stat-label">Pending tickets</div>
          <div class="stat-value">{{ countFor('Pending') }}</div>
        </div>
        <div class="card stat">
          <div class="stat-label">Resolved tickets</div>
          <div class="stat-value">{{ countFor('Resolved') }}</div>
        </div>
        <div class="card stat">
          <div class="stat-label">Avg. CSAT</div>
          <div class="stat-value">{{ dashboard.csat.averageRating || '—' }}<span class="of5" *ngIf="dashboard.csat.averageRating">/5</span></div>
        </div>
      </div>

      <div class="card">
        <h3>SLA Performance</h3>
        @if (dashboard.slaPerformance.length === 0) {
          <p class="muted">No SLA-tracked tickets yet.</p>
        } @else {
          <table>
            <thead><tr><th>Category</th><th>Priority</th><th>Total</th><th>Met Target</th><th>Compliance</th></tr></thead>
            <tbody>
              @for (row of dashboard.slaPerformance; track row.category + row.priority) {
                <tr>
                  <td>{{ row.category }}</td>
                  <td>{{ row.priority }}</td>
                  <td>{{ row.total }}</td>
                  <td>{{ row.metTarget }}</td>
                  <td>{{ row.compliancePercent }}%</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <div class="card">
        <h3>Agent Performance</h3>
        @if (dashboard.agentPerformance.length === 0) {
          <p class="muted">No assigned tickets yet.</p>
        } @else {
          <table>
            <thead><tr><th>Agent</th><th>Tickets</th><th>Avg. resolution (hrs)</th></tr></thead>
            <tbody>
              @for (row of dashboard.agentPerformance; track row.agentId) {
                <tr><td>{{ row.agentName }}</td><td>{{ row.ticketCount }}</td><td>{{ row.averageResolutionHours }}</td></tr>
              }
            </tbody>
          </table>
        }
      </div>
    }

    <div class="card">
      <h3>Recent tickets</h3>
      @if (recentTickets.length === 0) {
        <p class="muted">No tickets yet. <a routerLink="/tickets">Create one</a>.</p>
      } @else {
        <table>
          <thead><tr><th>Number</th><th>Subject</th><th>Status</th><th>Priority</th></tr></thead>
          <tbody>
            @for (t of recentTickets; track t.id) {
              <tr [routerLink]="['/tickets', t.id]" style="cursor:pointer">
                <td>{{ t.ticketNumber }}</td>
                <td>{{ t.subject }}</td>
                <td><span class="badge" [ngClass]="t.status">{{ t.status }}</span></td>
                <td><span class="badge" [ngClass]="t.priority">{{ t.priority }}</span></td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `,
  styles: [`
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1rem; }
    .stat-label { color: var(--muted); font-size: 0.85rem; }
    .stat-value { font-size: 1.8rem; font-weight: 700; margin-top: 0.25rem; }
    .of5 { font-size: 1rem; color: var(--muted); }
    .muted { color: var(--muted); }
  `]
})
export class DashboardPage implements OnInit {
  dashboard: DashboardResponse | null = null;
  recentTickets: Ticket[] = [];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getDashboard().subscribe(d => (this.dashboard = d));
    this.api.listTickets().subscribe(t => (this.recentTickets = t.slice(0, 10)));
  }

  countFor(status: string): number {
    return this.dashboard?.ticketsByStatus.find(g => g.group === status)?.count ?? 0;
  }
}
