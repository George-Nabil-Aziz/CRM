import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { AssignmentRule, Notification, SlaRule, User } from '../models';

type Tab = 'sla' | 'assignment' | 'escalation' | 'alerts';

const CATEGORIES = ['General', 'Billing', 'Technical', 'Account', 'FeatureRequest'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

@Component({
  selector: 'app-automation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h1>SLA &amp; Automation</h1>
    <p class="lede">Response and resolution targets, automatic assignment, escalation and alerts.</p>

    <div class="tabs">
      @for (t of tabs; track t.key) {
        <button type="button" class="tab" [class.on]="tab === t.key" (click)="tab = t.key">{{ t.label }}</button>
      }
    </div>

    @if (error) {
      <div class="card"><p class="err">{{ error }}</p></div>
    }

    <!-- SLA TARGETS -->
    @if (tab === 'sla') {
      <div class="card">
        <h3>Add an SLA target</h3>
        <form (ngSubmit)="createSla()" novalidate>
          <div class="row">
            <div class="field">
              <label for="s-cat">Category</label>
              <select id="s-cat" [(ngModel)]="slaForm.category" name="category">
                @for (c of categories; track c) { <option [value]="c">{{ c }}</option> }
              </select>
            </div>
            <div class="field">
              <label for="s-pri">Priority</label>
              <select id="s-pri" [(ngModel)]="slaForm.priority" name="priority">
                @for (p of priorities; track p) { <option [value]="p">{{ p }}</option> }
              </select>
            </div>
            <div class="field">
              <label for="s-resp">Respond within (minutes)</label>
              <input id="s-resp" type="number" min="1" [(ngModel)]="slaForm.responseTargetMinutes" name="response" />
            </div>
            <div class="field">
              <label for="s-res">Resolve within (minutes)</label>
              <input id="s-res" type="number" min="1" [(ngModel)]="slaForm.resolutionTargetMinutes" name="resolution" />
            </div>
          </div>
          @if (slaError) { <p class="field-error">{{ slaError }}</p> }
          <button class="btn" type="submit" [disabled]="savingSla">{{ savingSla ? 'Adding…' : 'Add target' }}</button>
        </form>
      </div>

      <div class="card">
        <h3>SLA targets</h3>
        @if (slaRules.length === 0) {
          <p class="muted">No targets configured. Tickets created now get no SLA clock.</p>
        } @else {
          <table>
            <thead>
              <tr><th>Category</th><th>Priority</th><th>Respond within</th><th>Resolve within</th></tr>
            </thead>
            <tbody>
              @for (r of slaRules; track r.id) {
                <tr>
                  <td>{{ r.category }}</td>
                  <td><span class="badge" [ngClass]="r.priority">{{ r.priority }}</span></td>
                  <td>{{ humanMinutes(r.responseTargetMinutes) }}</td>
                  <td>{{ humanMinutes(r.resolutionTargetMinutes) }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    }

    <!-- AUTOMATIC ASSIGNMENT -->
    @if (tab === 'assignment') {
      <div class="card">
        <h3>Add an assignment rule</h3>
        <p class="muted hint">Rules are evaluated in order. The first match assigns the ticket.</p>
        <form (ngSubmit)="createAssignment()" novalidate>
          <div class="row">
            <div class="field">
              <label for="a-cat">When category is</label>
              <select id="a-cat" [(ngModel)]="assignForm.category" name="acategory">
                <option value="">Any category</option>
                @for (c of categories; track c) { <option [value]="c">{{ c }}</option> }
              </select>
            </div>
            <div class="field">
              <label for="a-agent">Assign to</label>
              <select id="a-agent" [(ngModel)]="assignForm.targetAgentId" name="agent">
                <option value="">Select an agent…</option>
                @for (u of agents; track u.id) { <option [value]="u.id">{{ u.name }} — {{ u.roleName }}</option> }
              </select>
            </div>
            <div class="field">
              <label for="a-order">Order</label>
              <input id="a-order" type="number" min="0" [(ngModel)]="assignForm.order" name="order" />
            </div>
          </div>
          @if (assignError) { <p class="field-error">{{ assignError }}</p> }
          <button class="btn" type="submit" [disabled]="savingAssign">{{ savingAssign ? 'Adding…' : 'Add rule' }}</button>
        </form>
      </div>

      <div class="card">
        <h3>Assignment rules</h3>
        @if (assignmentRules.length === 0) {
          <p class="muted">No rules yet. New tickets stay unassigned until someone picks them up.</p>
        } @else {
          <table>
            <thead><tr><th>Order</th><th>Category</th><th>Assign to</th></tr></thead>
            <tbody>
              @for (r of assignmentRules; track r.id) {
                <tr>
                  <td class="rank">{{ r.order }}</td>
                  <td>{{ r.category ?? 'Any' }}</td>
                  <td>{{ agentName(r.targetAgentId) }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    }

    <!-- ESCALATION -->
    @if (tab === 'escalation') {
      <div class="card">
        <h3>Escalation rules</h3>
        <p class="muted">
          Escalation runs off the SLA targets above: a ticket that passes its resolution target,
          or one an agent escalates by hand, is flagged and a notification is raised.
        </p>
        <p class="muted hint">
          The API exposes escalation per ticket (<code>POST /api/tickets/&#123;id&#125;/escalate</code>)
          rather than as a separate rule set, so there is nothing to configure here beyond the
          targets — this tab shows what is currently escalated.
        </p>
      </div>

      <div class="card">
        <h3>Currently escalated</h3>
        @if (loadingEscalated) {
          <p class="muted">Loading…</p>
        } @else if (escalated.length === 0) {
          <p class="muted">Nothing is escalated right now.</p>
        } @else {
          <table>
            <thead><tr><th>Number</th><th>Subject</th><th>Priority</th><th>Reason</th><th>Since</th></tr></thead>
            <tbody>
              @for (t of escalated; track t.id) {
                <tr>
                  <td class="nowrap">{{ t.ticketNumber }}</td>
                  <td>{{ t.subject }}</td>
                  <td><span class="badge" [ngClass]="t.priority">{{ t.priority }}</span></td>
                  <td>{{ t.escalationReason || '—' }}</td>
                  <td class="nowrap">{{ t.escalatedAt ? (t.escalatedAt | date: 'short') : '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    }

    <!-- ALERTS -->
    @if (tab === 'alerts') {
      <div class="card">
        <div class="card-head">
          <h3>Notifications</h3>
          <div class="head-controls">
            <div class="field">
              <label for="n-user">For user</label>
              <select id="n-user" [(ngModel)]="notifyUserId" (ngModelChange)="loadNotifications()" name="nuser">
                <option value="">Select a user…</option>
                @for (u of agents; track u.id) { <option [value]="u.id">{{ u.name }}</option> }
              </select>
            </div>
            <label class="toggle">
              <input type="checkbox" [(ngModel)]="unreadOnly" (ngModelChange)="loadNotifications()" name="unread" />
              <span>Unread only</span>
            </label>
          </div>
        </div>

        @if (!notifyUserId) {
          <p class="muted">Pick a user to see the alerts raised for them.</p>
        } @else if (notifications.length === 0) {
          <p class="muted">No alerts for this user.</p>
        } @else {
          <ul class="alerts">
            @for (n of notifications; track n.id) {
              <li [class.unread]="!n.read">
                <div class="alert-body">
                  <span class="badge">{{ n.type }}</span>
                  <span>{{ n.message }}</span>
                </div>
                <div class="alert-meta">
                  <span class="muted">{{ n.sentAt | date: 'short' }}</span>
                  @if (!n.read) {
                    <button type="button" class="link" (click)="markRead(n)">Mark read</button>
                  }
                </div>
              </li>
            }
          </ul>
        }
      </div>
    }
  `,
  styles: [`
    .lede { color: var(--muted); margin: -0.25rem 0 1rem; }
    .muted { color: var(--muted); }
    .err { color: var(--danger); }
    .hint { font-size: 0.85rem; }
    .nowrap { white-space: nowrap; }
    .rank { color: var(--muted); width: 3rem; }

    .tabs { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 1rem; }
    .tab {
      padding: 0.45rem 0.9rem; border-radius: 8px; cursor: pointer; font: inherit; font-size: 0.88rem;
      background: var(--card); color: var(--muted); border: 1px solid var(--border);
    }
    .tab:hover { color: var(--text); border-color: var(--primary); }
    .tab.on { background: var(--primary); border-color: var(--primary); color: #fff; font-weight: 600; }

    .row { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 0.75rem; }
    .field input, .field select { margin-bottom: 0; }
    form .btn { margin-top: 0.9rem; }

    .card-head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 0.75rem; margin-bottom: 0.75rem; }
    .card-head h3 { margin: 0; }
    .head-controls { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 1rem; }
    .head-controls .field { min-width: 180px; }
    .toggle { display: flex; align-items: center; gap: 0.4rem; margin: 0 0 0.4rem; font-size: 0.82rem; cursor: pointer; }
    .toggle input { width: auto; margin: 0; }

    .link { background: none; border: none; padding: 0; font: inherit; font-size: 0.85rem; color: var(--primary); cursor: pointer; }
    .link:hover { text-decoration: underline; }
    .alerts { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.4rem; }
    .alerts li {
      display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.75rem;
      padding: 0.6rem 0.75rem; border: 1px solid var(--border); border-radius: 9px; background: var(--bg);
      font-size: 0.87rem;
    }
    .alerts li.unread { border-inline-start: 3px solid var(--primary); }
    .alert-body { display: flex; align-items: center; gap: 0.6rem; }
    .alert-meta { display: flex; align-items: center; gap: 0.75rem; font-size: 0.8rem; }
  `]
})
export class AutomationPage implements OnInit {
  private api = inject(ApiService);

  readonly tabs: { key: Tab; label: string }[] = [
    { key: 'sla', label: 'Response & resolution' },
    { key: 'assignment', label: 'Automatic assignment' },
    { key: 'escalation', label: 'Escalation' },
    { key: 'alerts', label: 'Alerts' },
  ];
  readonly categories = CATEGORIES;
  readonly priorities = PRIORITIES;

  tab: Tab = 'sla';
  error = '';

  slaRules: SlaRule[] = [];
  slaForm = { category: 'General', priority: 'Medium', responseTargetMinutes: 60, resolutionTargetMinutes: 1440 };
  slaError = '';
  savingSla = false;

  agents: User[] = [];
  assignmentRules: AssignmentRule[] = [];
  assignForm = { category: '', targetAgentId: '', order: 0 };
  assignError = '';
  savingAssign = false;

  escalated: import('../models').Ticket[] = [];
  loadingEscalated = false;

  notifications: Notification[] = [];
  notifyUserId = '';
  unreadOnly = false;

  ngOnInit() {
    this.loadSla();
    this.loadAssignment();
    this.loadEscalated();
    this.api.listUsers().subscribe({
      next: (u) => (this.agents = u),
      error: () => (this.error = 'Could not load users. Is the API running?'),
    });
  }

  /** 90 → "1h 30m". Targets are stored in minutes but read badly at that scale. */
  humanMinutes(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (hours < 24) return rest ? `${hours}h ${rest}m` : `${hours}h`;
    const days = Math.floor(hours / 24);
    const restHours = hours % 24;
    return restHours ? `${days}d ${restHours}h` : `${days}d`;
  }

  agentName(id: string): string {
    return this.agents.find((a) => a.id === id)?.name ?? id.slice(0, 8);
  }

  // --- SLA ---

  loadSla() {
    this.api.listSlaRules().subscribe({
      next: (r) => (this.slaRules = r),
      error: () => (this.error = 'Could not load SLA targets.'),
    });
  }

  createSla() {
    this.slaError = '';
    if (this.slaForm.responseTargetMinutes < 1 || this.slaForm.resolutionTargetMinutes < 1) {
      this.slaError = 'Both targets must be at least one minute.';
      return;
    }
    if (this.slaForm.resolutionTargetMinutes < this.slaForm.responseTargetMinutes) {
      this.slaError = 'The resolution target cannot be shorter than the response target.';
      return;
    }

    this.savingSla = true;
    this.api.createSlaRule(this.slaForm).subscribe({
      next: () => {
        this.savingSla = false;
        this.loadSla();
      },
      error: (e) => {
        this.savingSla = false;
        // 409 when a rule for this category/priority pair already exists.
        this.slaError = e?.error?.message ?? 'Could not add the target.';
      },
    });
  }

  // --- assignment ---

  loadAssignment() {
    this.api.listAssignmentRules().subscribe({
      next: (r) => (this.assignmentRules = r),
      error: () => (this.error = 'Could not load assignment rules.'),
    });
  }

  createAssignment() {
    this.assignError = '';
    if (!this.assignForm.targetAgentId) {
      this.assignError = 'Pick the agent the ticket should go to.';
      return;
    }

    this.savingAssign = true;
    this.api.createAssignmentRule({
      category: this.assignForm.category || null,
      targetAgentId: this.assignForm.targetAgentId,
      order: this.assignForm.order,
    }).subscribe({
      next: () => {
        this.savingAssign = false;
        this.assignForm = { category: '', targetAgentId: '', order: 0 };
        this.loadAssignment();
      },
      error: () => {
        this.savingAssign = false;
        this.assignError = 'Could not add the rule.';
      },
    });
  }

  // --- escalation ---

  loadEscalated() {
    this.loadingEscalated = true;
    this.api.listTickets().subscribe({
      next: (t) => {
        this.escalated = t.filter((x) => x.escalated);
        this.loadingEscalated = false;
      },
      error: () => (this.loadingEscalated = false),
    });
  }

  // --- alerts ---

  loadNotifications() {
    if (!this.notifyUserId) {
      this.notifications = [];
      return;
    }
    this.api.listNotifications(this.notifyUserId, this.unreadOnly).subscribe({
      next: (n) => (this.notifications = n),
      error: () => (this.notifications = []),
    });
  }

  markRead(n: Notification) {
    this.api.markNotificationRead(n.id).subscribe({
      next: () => {
        n.read = true;
        if (this.unreadOnly) this.loadNotifications();
      },
      error: () => (this.error = 'Could not mark that alert as read.'),
    });
  }
}
