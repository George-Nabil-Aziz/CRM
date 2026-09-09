import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../api.service';
import { I18nService } from '../i18n/i18n.service';
import { InternalNote, Notification, QuickReply, Reminder, Ticket, User } from '../models';

type Tab = 'queue' | 'replies' | 'alerts';

@Component({
  selector: 'app-agent-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <h1>Agent Workspace</h1>
    <p class="lede">
      One agent's queue, their quick replies and their alerts.
      The demo sign-in carries no agent identity, so pick who you are working as.
    </p>

    <div class="card who">
      <div class="field">
        <label for="agent">Working as</label>
        <select id="agent" [(ngModel)]="agentId" (ngModelChange)="onAgentChange()" name="agent">
          @if (agents.length === 0) {
            <option value="">No agents found</option>
          }
          @for (a of agents; track a.id) {
            <option [value]="a.id">{{ a.name }} — {{ a.roleName }}</option>
          }
        </select>
      </div>
      @if (unreadCount > 0) {
        <span class="alert-pill">{{ unreadCount }} unread {{ unreadCount === 1 ? 'alert' : 'alerts' }}</span>
      }
    </div>

    <div class="tabs">
      @for (t of tabs; track t.key) {
        <button type="button" class="tab" [class.on]="tab === t.key" (click)="tab = t.key">{{ t.label }}</button>
      }
    </div>

    @if (error) {
      <div class="card"><p class="err">{{ error }}</p></div>
    }

    <!-- QUEUE -->
    @if (tab === 'queue') {
      <div class="grid">
        <div class="card stat">
          <div class="stat-label">Assigned</div>
          <div class="stat-value">{{ tickets.length }}</div>
        </div>
        <div class="card stat">
          <div class="stat-label">Open</div>
          <div class="stat-value">{{ countBy('Open') }}</div>
        </div>
        <div class="card stat">
          <div class="stat-label">Pending</div>
          <div class="stat-value">{{ countBy('Pending') }}</div>
        </div>
        <div class="card stat">
          <div class="stat-label">Escalated</div>
          <div class="stat-value" [class.danger]="escalatedCount > 0">{{ escalatedCount }}</div>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <h3>My tickets</h3>
          <div class="chips">
            @for (f of statusFilters; track f) {
              <button type="button" class="chip" [class.on]="statusFilter === f" (click)="setStatus(f)">{{ f }}</button>
            }
          </div>
        </div>

        @if (loadingTickets) {
          <p class="muted">Loading…</p>
        } @else if (tickets.length === 0) {
          <p class="muted">Nothing assigned to this agent.</p>
        } @else {
          <table>
            <thead><tr><th>Number</th><th>Subject</th><th>Status</th><th>Priority</th><th></th></tr></thead>
            <tbody>
              @for (t of tickets; track t.id) {
                <tr>
                  <td class="nowrap">
                    {{ t.ticketNumber }}
                    @if (t.escalated) { <span class="flag" title="Escalated">▲</span> }
                  </td>
                  <td>{{ t.subject }}</td>
                  <td><span class="badge" [ngClass]="t.status">{{ t.status }}</span></td>
                  <td><span class="badge" [ngClass]="t.priority">{{ t.priority }}</span></td>
                  <td class="nowrap actions">
                    <button type="button" class="link" (click)="openDetail(t)">
                      {{ selected?.id === t.id ? 'Hide' : 'Collaborate' }}
                    </button>
                    <a [routerLink]="['/tickets', t.id]">Open</a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      @if (selected) {
        <div class="card detail">
          <div class="card-head">
            <h3>{{ selected.ticketNumber }} — {{ selected.subject }}</h3>
            <button type="button" class="link" (click)="selected = null">Close</button>
          </div>

          <h4>Internal notes</h4>
          @if (notes.length === 0) {
            <p class="muted">No internal notes on this ticket yet.</p>
          } @else {
            <div class="notes">
              @for (n of notes; track n.id) {
                <div class="note">
                  <div class="note-head">
                    <strong>{{ agentName(n.authorId) }}</strong>
                    <span class="muted">{{ n.createdAt | date: 'short' }}</span>
                  </div>
                  <p>{{ n.text }}</p>
                  @if (n.mentions.length > 0) {
                    <p class="mentions">Mentioned: {{ mentionNames(n.mentions) }}</p>
                  }
                </div>
              }
            </div>
          }

          <form (ngSubmit)="addNote()" class="note-form">
            <div class="field">
              <label for="note">Add an internal note</label>
              <textarea id="note" rows="2" [(ngModel)]="noteText" name="noteText"
                        placeholder="Only visible to the team…"></textarea>
            </div>
            <div class="field">
              <label for="mention">Mention a teammate (optional)</label>
              <select id="mention" [(ngModel)]="mentionId" name="mentionId">
                <option value="">Nobody</option>
                @for (a of agents; track a.id) {
                  <option [value]="a.id">{{ a.name }}</option>
                }
              </select>
            </div>
            <button class="btn" type="submit" [disabled]="!noteText.trim() || savingNote">
              {{ savingNote ? 'Posting…' : 'Post note' }}
            </button>
          </form>

          <h4>Reminders</h4>
          @if (reminders.length === 0) {
            <p class="muted">Nothing scheduled on this ticket.</p>
          } @else {
            <ul class="reminders">
              @for (r of reminders; track r.id) {
                <li [class.overdue]="isOverdue(r)">
                  <span class="due">{{ r.dueAt | date: 'short' }}</span>
                  <span class="note-text">{{ r.note }}</span>
                  <button type="button" class="link" (click)="dismiss(r)">Dismiss</button>
                </li>
              }
            </ul>
          }

          <form (ngSubmit)="addReminder()" class="reminder-form">
            <div class="field">
              <label for="due">Remind me at</label>
              <input id="due" type="datetime-local" [(ngModel)]="reminderDue" name="reminderDue" />
            </div>
            <div class="field grow">
              <label for="rnote">About</label>
              <input id="rnote" [(ngModel)]="reminderNote" name="reminderNote" placeholder="Follow up with the customer" />
            </div>
            <button class="btn secondary" type="submit" [disabled]="!reminderDue || !reminderNote.trim() || savingReminder">
              {{ savingReminder ? 'Adding…' : 'Add' }}
            </button>
          </form>
        </div>
      }
    }

    <!-- QUICK REPLIES -->
    @if (tab === 'replies') {
      <div class="card">
        <div class="card-head">
          <h3>Quick replies</h3>
          <div class="chips">
            <button type="button" class="chip" [class.on]="!replyCategory" (click)="filterReplies('')">All</button>
            @for (c of replyCategories; track c) {
              <button type="button" class="chip" [class.on]="replyCategory === c" (click)="filterReplies(c)">{{ c }}</button>
            }
          </div>
        </div>

        @if (quickReplies.length === 0) {
          <p class="muted">No quick replies saved yet.</p>
        } @else {
          <div class="replies">
            @for (r of quickReplies; track r.id) {
              <div class="reply">
                <div class="reply-head">
                  <strong>{{ r.title }}</strong>
                  <span class="badge">{{ r.category }}</span>
                </div>
                <p>{{ r.body }}</p>
                <button type="button" class="link" (click)="copy(r)">
                  {{ copiedId === r.id ? 'Copied' : 'Copy' }}
                </button>
              </div>
            }
          </div>
        }
      </div>

      <div class="card">
        <h3>Add a quick reply</h3>
        <form (ngSubmit)="createReply()" novalidate>
          <div class="row">
            <div class="field">
              <label for="q-title">Title</label>
              <input id="q-title" [(ngModel)]="replyForm.title" name="title" />
            </div>
            <div class="field">
              <label for="q-cat">Category</label>
              <input id="q-cat" [(ngModel)]="replyForm.category" name="category" placeholder="Billing" />
            </div>
          </div>
          <div class="field">
            <label for="q-body">Body</label>
            <textarea id="q-body" rows="3" [(ngModel)]="replyForm.body" name="body"></textarea>
          </div>
          <button class="btn" type="submit" [disabled]="!replyForm.title.trim() || !replyForm.body.trim() || savingReply">
            {{ savingReply ? 'Saving…' : 'Save reply' }}
          </button>
        </form>
      </div>
    }

    <!-- ALERTS -->
    @if (tab === 'alerts') {
      <div class="card">
        <div class="card-head">
          <h3>Alerts</h3>
          <label class="toggle">
            <input type="checkbox" [(ngModel)]="unreadOnly" (ngModelChange)="loadNotifications()" />
            <span>Unread only</span>
          </label>
        </div>

        @if (notifications.length === 0) {
          <p class="muted">Nothing here.</p>
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
    .lede { color: var(--muted); margin: -0.25rem 0 1rem; font-size: 0.9rem; }
    .muted { color: var(--muted); }
    .err { color: var(--danger); }
    .nowrap { white-space: nowrap; }
    h4 { margin: 1.25rem 0 0.5rem; font-size: 0.95rem; }

    .who { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 1rem; }
    .who .field { min-width: 240px; }
    .field input, .field select, .field textarea { margin-bottom: 0; }
    .alert-pill {
      padding: 0.3rem 0.7rem; border-radius: 999px; font-size: 0.78rem; font-weight: 600;
      background: color-mix(in srgb, var(--warn) 15%, transparent); color: var(--warn);
    }

    .tabs { display: flex; flex-wrap: wrap; gap: 0.4rem; margin: 1rem 0; }
    .tab {
      padding: 0.45rem 0.9rem; border-radius: 8px; cursor: pointer; font: inherit; font-size: 0.88rem;
      background: var(--card); color: var(--muted); border: 1px solid var(--border);
    }
    .tab:hover { color: var(--text); border-color: var(--primary); }
    .tab.on { background: var(--primary); border-color: var(--primary); color: #fff; font-weight: 600; }

    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
    .stat-label { color: var(--muted); font-size: 0.85rem; }
    .stat-value { font-size: 1.8rem; font-weight: 700; margin-top: 0.25rem; }
    .stat-value.danger { color: var(--danger); }

    .card-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.75rem; margin-bottom: 0.5rem; }
    .card-head h3 { margin: 0; }
    .chips { display: flex; flex-wrap: wrap; gap: 0.3rem; }
    .chip {
      padding: 0.25rem 0.65rem; border-radius: 999px; cursor: pointer; font: inherit; font-size: 0.78rem;
      background: var(--card); color: var(--muted); border: 1px solid var(--border);
    }
    .chip.on { background: var(--primary); border-color: var(--primary); color: #fff; font-weight: 600; }

    .link { background: none; border: none; padding: 0; font: inherit; font-size: 0.85rem; color: var(--primary); cursor: pointer; }
    .link:hover { text-decoration: underline; }
    .actions { display: flex; gap: 0.75rem; }
    .flag { color: var(--danger); font-size: 0.75rem; margin-inline-start: 0.3rem; }

    .notes { display: flex; flex-direction: column; gap: 0.6rem; }
    .note { padding: 0.65rem 0.8rem; border: 1px solid var(--border); border-radius: 9px; background: var(--bg); }
    .note-head { display: flex; justify-content: space-between; gap: 0.75rem; font-size: 0.8rem; margin-bottom: 0.3rem; }
    .note p { margin: 0; font-size: 0.88rem; line-height: 1.5; }
    .mentions { color: var(--muted); font-size: 0.78rem !important; margin-top: 0.3rem !important; }
    .note-form, .reminder-form { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 0.75rem; margin-top: 0.9rem; }
    .note-form .field:first-child { flex: 1; min-width: 240px; }
    .reminder-form .grow { flex: 1; min-width: 200px; }

    .reminders { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.4rem; }
    .reminders li {
      display: flex; align-items: center; gap: 0.75rem; font-size: 0.86rem;
      padding: 0.5rem 0.7rem; border: 1px solid var(--border); border-radius: 8px; background: var(--bg);
    }
    .reminders li.overdue { border-color: var(--danger); }
    .due { color: var(--muted); white-space: nowrap; font-size: 0.8rem; }
    .note-text { flex: 1; }

    .row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem; }
    form .btn { margin-top: 0.9rem; }
    .replies { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 0.75rem; }
    .reply { padding: 0.75rem; border: 1px solid var(--border); border-radius: 9px; background: var(--bg); }
    .reply-head { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.35rem; }
    .reply p { margin: 0 0 0.5rem; font-size: 0.85rem; line-height: 1.5; color: var(--muted); }

    .toggle { display: flex; align-items: center; gap: 0.4rem; margin: 0; font-size: 0.82rem; cursor: pointer; }
    .toggle input { width: auto; margin: 0; }
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
export class AgentWorkspacePage implements OnInit {
  readonly i18n = inject(I18nService);

  readonly tabs: { key: Tab; label: string }[] = [
    { key: 'queue', label: 'My Queue' },
    { key: 'replies', label: 'Quick Replies' },
    { key: 'alerts', label: 'Alerts' },
  ];
  readonly statusFilters = ['All', 'Open', 'Pending', 'Resolved'] as const;

  tab: Tab = 'queue';
  error = '';

  agents: User[] = [];
  agentId = '';

  tickets: Ticket[] = [];
  statusFilter: (typeof this.statusFilters)[number] = 'All';
  loadingTickets = true;

  selected: Ticket | null = null;
  notes: InternalNote[] = [];
  reminders: Reminder[] = [];
  noteText = '';
  mentionId = '';
  savingNote = false;
  reminderDue = '';
  reminderNote = '';
  savingReminder = false;

  quickReplies: QuickReply[] = [];
  replyCategory = '';
  replyCategories: string[] = [];
  replyForm = { title: '', body: '', category: '' };
  savingReply = false;
  copiedId = '';

  notifications: Notification[] = [];
  unreadOnly = false;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.listUsers().subscribe({
      next: (users) => {
        this.agents = users;
        this.agentId = users[0]?.id ?? '';
        this.loadTickets();
        this.loadNotifications();
      },
      error: () => {
        this.loadingTickets = false;
        this.error = 'Could not load the user list. Is the API running?';
      },
    });
    this.loadQuickReplies();
  }

  onAgentChange() {
    this.selected = null;
    this.loadTickets();
    this.loadNotifications();
  }

  // --- queue ---

  loadTickets() {
    if (!this.agentId) {
      this.tickets = [];
      this.loadingTickets = false;
      return;
    }
    this.loadingTickets = true;
    const status = this.statusFilter === 'All' ? undefined : this.statusFilter;
    this.api.getAssignedTickets(this.agentId, { status }).subscribe({
      next: (t) => {
        this.tickets = t;
        this.loadingTickets = false;
      },
      error: () => {
        this.tickets = [];
        this.loadingTickets = false;
      },
    });
  }

  setStatus(f: (typeof this.statusFilters)[number]) {
    this.statusFilter = f;
    this.loadTickets();
  }

  countBy(status: string): number {
    return this.tickets.filter((t) => t.status === status).length;
  }

  get escalatedCount(): number {
    return this.tickets.filter((t) => t.escalated).length;
  }

  agentName(id: string): string {
    return this.agents.find((a) => a.id === id)?.name ?? id.slice(0, 8);
  }

  mentionNames(ids: string[]): string {
    return ids.map((id) => this.agentName(id)).join(', ');
  }

  // --- collaboration ---

  openDetail(t: Ticket) {
    if (this.selected?.id === t.id) {
      this.selected = null;
      return;
    }
    this.selected = t;
    this.notes = [];
    this.reminders = [];
    this.api.getInternalNotes(t.id).subscribe({ next: (n) => (this.notes = n), error: () => {} });
    this.api.getReminders(t.id).subscribe({ next: (r) => (this.reminders = r), error: () => {} });
  }

  addNote() {
    if (!this.selected || !this.noteText.trim()) return;
    this.savingNote = true;
    const ticketId = this.selected.id;

    this.api.addInternalNote(ticketId, {
      text: this.noteText.trim(),
      authorId: this.agentId,
      mentionedUserIds: this.mentionId ? [this.mentionId] : [],
    }).subscribe({
      next: () => {
        this.savingNote = false;
        this.noteText = '';
        this.mentionId = '';
        this.api.getInternalNotes(ticketId).subscribe((n) => (this.notes = n));
      },
      error: () => {
        this.savingNote = false;
        this.error = 'Could not post the note.';
      },
    });
  }

  addReminder() {
    if (!this.selected || !this.reminderDue || !this.reminderNote.trim()) return;
    this.savingReminder = true;
    const ticketId = this.selected.id;

    this.api.addReminder(ticketId, {
      agentId: this.agentId,
      dueAt: new Date(this.reminderDue).toISOString(),
      note: this.reminderNote.trim(),
    }).subscribe({
      next: () => {
        this.savingReminder = false;
        this.reminderDue = '';
        this.reminderNote = '';
        this.api.getReminders(ticketId).subscribe((r) => (this.reminders = r));
      },
      error: () => {
        this.savingReminder = false;
        this.error = 'Could not add the reminder.';
      },
    });
  }

  dismiss(r: Reminder) {
    this.api.dismissReminder(r.ticketId, r.id).subscribe({
      next: () => (this.reminders = this.reminders.filter((x) => x.id !== r.id)),
      error: () => (this.error = 'Could not dismiss that reminder.'),
    });
  }

  isOverdue(r: Reminder): boolean {
    return new Date(r.dueAt).getTime() < Date.now();
  }

  // --- quick replies ---

  loadQuickReplies() {
    this.api.listQuickReplies(this.replyCategory || undefined).subscribe({
      next: (r) => {
        this.quickReplies = r;
        // Categories come from the replies themselves — the API has no category endpoint.
        if (!this.replyCategory) {
          this.replyCategories = [...new Set(r.map((x) => x.category).filter(Boolean))];
        }
      },
      error: () => (this.quickReplies = []),
    });
  }

  filterReplies(category: string) {
    this.replyCategory = category;
    this.loadQuickReplies();
  }

  createReply() {
    const { title, body, category } = this.replyForm;
    if (!title.trim() || !body.trim()) return;

    this.savingReply = true;
    this.api.createQuickReply({
      title: title.trim(),
      body: body.trim(),
      category: category.trim() || 'General',
    }).subscribe({
      next: () => {
        this.savingReply = false;
        this.replyForm = { title: '', body: '', category: '' };
        this.replyCategory = '';
        this.loadQuickReplies();
      },
      error: () => {
        this.savingReply = false;
        this.error = 'Could not save that quick reply.';
      },
    });
  }

  copy(r: QuickReply) {
    navigator.clipboard?.writeText(r.body).then(
      () => (this.copiedId = r.id),
      () => (this.error = 'The browser blocked clipboard access.'),
    );
  }

  // --- alerts ---

  loadNotifications() {
    if (!this.agentId) {
      this.notifications = [];
      return;
    }
    this.api.listNotifications(this.agentId, this.unreadOnly).subscribe({
      next: (n) => (this.notifications = n),
      error: () => (this.notifications = []),
    });
  }

  get unreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
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
