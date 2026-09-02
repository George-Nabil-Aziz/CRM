import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../api.service';
import { Customer, Message, Ticket, TicketEvent } from '../models';

const STATUS_TRANSITIONS: Record<string, string[]> = {
  Open: ['Pending', 'Resolved'],
  Pending: ['Open', 'Resolved'],
  Resolved: ['Closed', 'Open'],
  Closed: ['Open']
};

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    @if (ticket) {
      <h1>{{ ticket.ticketNumber }} <span class="badge" [ngClass]="ticket.status">{{ ticket.status }}</span></h1>
      <p class="subject">{{ ticket.subject }}</p>

      <div class="two-col">
        <div>
          <div class="card">
            <h3>Status &amp; assignment</h3>
            <label>Change status</label>
            <div class="btn-row">
              @for (s of allowedNext(); track s) {
                <button class="btn secondary" (click)="setStatus(s)">Move to {{ s }}</button>
              }
            </div>

            <label style="margin-top:0.75rem">Assign to agent (ID)</label>
            <div class="btn-row">
              <input [(ngModel)]="agentId" name="agentId" placeholder="agent GUID" />
              <button class="btn secondary" (click)="assign()">Assign</button>
            </div>

            @if (!ticket.escalated) {
              <label style="margin-top:0.75rem">Escalate</label>
              <div class="btn-row">
                <input [(ngModel)]="escalationReason" name="reason" placeholder="Reason…" />
                <button class="btn danger" (click)="escalate()">Escalate</button>
              </div>
            } @else {
              <p style="color: var(--danger); margin-top:0.75rem;">Escalated: {{ ticket.escalationReason }}</p>
            }

            <label style="margin-top:0.75rem">Category / priority</label>
            <div class="btn-row">
              <select [(ngModel)]="catForm.category" name="category">
                <option>General</option><option>Billing</option><option>Technical</option>
                <option>Account</option><option>FeatureRequest</option>
              </select>
              <select [(ngModel)]="catForm.priority" name="priority">
                <option>Low</option><option>Medium</option><option>High</option><option>Urgent</option>
              </select>
              <button class="btn secondary" (click)="updateCatPriority()">Save</button>
            </div>
          </div>

          <div class="card">
            <h3>AI assist</h3>
            <button class="btn secondary" (click)="loadSummary()">Summarize ticket</button>
            @if (summary) { <p class="ai-box">{{ summary }}</p> }
            <button class="btn secondary" (click)="loadSuggestedReply()">Suggest reply</button>
            @if (suggestedReply) { <p class="ai-box">{{ suggestedReply }}</p> }
          </div>

          <div class="card">
            <h3>Customer</h3>
            @if (customer) {
              <p><a [routerLink]="['/customers', customer.id]">{{ customer.name }}</a><br>{{ customer.email }} · {{ customer.phone }}</p>
            }
          </div>
        </div>

        <div>
          <div class="card">
            <h3>Conversation</h3>
            @if (messages.length === 0) {
              <p class="muted">No messages yet.</p>
            } @else {
              <div class="thread">
                @for (m of messages; track m.id) {
                  <div class="msg">
                    <div class="msg-meta"><span class="badge">{{ m.channel }}</span> {{ m.from }} · {{ m.sentAt | date: 'dd-MM-yyyy' }}</div>
                    <div class="msg-body">{{ m.body }}</div>
                  </div>
                }
              </div>
            }
          </div>

          <div class="card">
            <h3>Internal notes (team collaboration)</h3>
            <textarea [(ngModel)]="internalNoteText" name="internalNote" rows="2" placeholder="Note visible to agents only…"></textarea>
            <input [(ngModel)]="authorId" name="authorId" placeholder="Your agent GUID" />
            <button class="btn secondary" (click)="addInternalNote()" [disabled]="!internalNoteText || !authorId">Add note</button>
          </div>

          <div class="card">
            <h3>History</h3>
            @if (history.length === 0) {
              <p class="muted">No events yet.</p>
            } @else {
              <ul class="timeline">
                @for (e of history; track e.id) {
                  <li><span class="badge">{{ e.type }}</span> {{ e.details }} <span class="muted">— {{ e.timestamp | date: 'dd-MM-yyyy' }}</span></li>
                }
              </ul>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .subject { color: var(--muted); margin-top: -0.5rem; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; align-items: start; }
    .btn-row { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
    .btn-row input, .btn-row select { width: auto; flex: 1; margin-bottom: 0; }
    .ai-box { background: var(--row-hover); border: 1px solid var(--border); color: var(--text); border-radius: 6px; padding: 0.6rem 0.75rem; font-size: 0.9rem; }
    .thread { display: flex; flex-direction: column; gap: 0.6rem; max-height: 320px; overflow-y: auto; }
    .msg { border-left: 3px solid var(--primary); padding-left: 0.6rem; }
    .msg-meta { font-size: 0.75rem; color: var(--muted); }
    .timeline { list-style: none; padding: 0; margin: 0; font-size: 0.85rem; display: flex; flex-direction: column; gap: 0.4rem; }

    @media (max-width: 900px) {
      .two-col { grid-template-columns: 1fr; }
    }
  `]
})
export class TicketDetailPage implements OnInit {
  ticket: Ticket | null = null;
  customer: Customer | null = null;
  history: TicketEvent[] = [];
  messages: Message[] = [];
  summary = '';
  suggestedReply = '';
  agentId = '';
  escalationReason = '';
  internalNoteText = '';
  authorId = '';
  catForm = { category: 'General', priority: 'Medium' };
  private id!: string;

  constructor(private route: ActivatedRoute, private api: ApiService) {}

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id')!;
    this.loadAll();
  }

  loadAll() {
    this.api.getTicketContext(this.id).subscribe(ctx => {
      this.ticket = ctx.ticket;
      this.customer = ctx.customer;
      this.catForm = { category: ctx.ticket.category, priority: ctx.ticket.priority };
    });
    this.api.getTicketHistory(this.id).subscribe(h => (this.history = h));
    this.api.getTicketMessages(this.id).subscribe(m => (this.messages = m));
  }

  allowedNext(): string[] {
    return this.ticket ? STATUS_TRANSITIONS[this.ticket.status] ?? [] : [];
  }

  setStatus(status: string) {
    this.api.updateTicketStatus(this.id, status).subscribe(() => this.loadAll());
  }

  assign() {
    if (!this.agentId) return;
    this.api.assignTicket(this.id, this.agentId).subscribe(() => this.loadAll());
  }

  escalate() {
    this.api.escalateTicket(this.id, this.escalationReason || 'Escalated by agent').subscribe(() => this.loadAll());
  }

  updateCatPriority() {
    this.api.updateTicketCategoryPriority(this.id, this.catForm).subscribe(() => this.loadAll());
  }

  loadSummary() {
    this.api.getSummary(this.id).subscribe(r => (this.summary = r.summaryText));
  }

  loadSuggestedReply() {
    this.api.getSuggestedReply(this.id).subscribe(r => (this.suggestedReply = r.suggestedText));
  }

  addInternalNote() {
    this.api.addInternalNote(this.id, { text: this.internalNoteText, authorId: this.authorId }).subscribe(() => {
      this.internalNoteText = '';
    });
  }
}
