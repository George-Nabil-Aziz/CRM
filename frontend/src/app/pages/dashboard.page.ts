import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../api.service';
import { I18nService } from '../i18n/i18n.service';
import { DashboardResponse, Ticket } from '../models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <h1>{{ i18n.t('dashboard.title') }}</h1>

    @if (dashboard) {
      <div class="grid">
        <div class="card stat">
          <div class="stat-label">{{ i18n.t('dashboard.openTickets') }}</div>
          <div class="stat-value">{{ countFor('Open') }}</div>
        </div>
        <div class="card stat">
          <div class="stat-label">{{ i18n.t('dashboard.pendingTickets') }}</div>
          <div class="stat-value">{{ countFor('Pending') }}</div>
        </div>
        <div class="card stat">
          <div class="stat-label">{{ i18n.t('dashboard.resolvedTickets') }}</div>
          <div class="stat-value">{{ countFor('Resolved') }}</div>
        </div>
        <div class="card stat">
          <div class="stat-label">{{ i18n.t('dashboard.avgCsat') }}</div>
          <div class="stat-value">{{ dashboard.csat.averageRating || '—' }}<span class="of5" *ngIf="dashboard.csat.averageRating">/5</span></div>
        </div>
      </div>

      <div class="card">
        <h3>{{ i18n.t('dashboard.slaPerformance') }}</h3>
        @if (dashboard.slaPerformance.length === 0) {
          <p class="muted">{{ i18n.t('dashboard.noSla') }}</p>
        } @else {
          <table>
            <thead><tr>
              <th>{{ i18n.t('field.category') }}</th>
              <th>{{ i18n.t('field.priority') }}</th>
              <th>{{ i18n.t('field.total') }}</th>
              <th>{{ i18n.t('field.metTarget') }}</th>
              <th>{{ i18n.t('field.compliance') }}</th>
            </tr></thead>
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
        <h3>{{ i18n.t('dashboard.agentPerformance') }}</h3>
        @if (dashboard.agentPerformance.length === 0) {
          <p class="muted">{{ i18n.t('dashboard.noAgents') }}</p>
        } @else {
          <table>
            <thead><tr>
              <th>{{ i18n.t('field.agent') }}</th>
              <th>{{ i18n.t('field.tickets') }}</th>
              <th>{{ i18n.t('field.avgResolution') }}</th>
            </tr></thead>
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
      <h3>{{ i18n.t('dashboard.recentTickets') }}</h3>
      @if (recentTickets.length === 0) {
        <p class="muted">
          {{ i18n.t('dashboard.noTickets') }}
          <a routerLink="/tickets">{{ i18n.t('dashboard.createOne') }}</a>
        </p>
      } @else {
        <table>
          <thead><tr>
            <th>{{ i18n.t('field.number') }}</th>
            <th>{{ i18n.t('field.subject') }}</th>
            <th>{{ i18n.t('field.status') }}</th>
            <th>{{ i18n.t('field.priority') }}</th>
          </tr></thead>
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
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
    .stat-label { color: var(--muted); font-size: 0.85rem; }
    .stat-value { font-size: 1.8rem; font-weight: 700; margin-top: 0.25rem; }
    .of5 { font-size: 1rem; color: var(--muted); }
    .muted { color: var(--muted); }
  `]
})
export class DashboardPage implements OnInit {
  readonly i18n = inject(I18nService);

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
