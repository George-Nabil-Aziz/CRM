import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../api.service';
import { Message } from '../models';

type Tab = 'email' | 'whatsapp' | 'sms' | 'chat' | 'webform';

@Component({
  selector: 'app-channels',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <h1>Channels</h1>
    <p class="lede">
      Every inbound channel lands in the same ticket thread. These forms play the part of the
      provider webhook, so you can push a message in and watch the ticket it creates or joins.
    </p>

    <div class="tabs">
      @for (t of tabs; track t.key) {
        <button type="button" class="tab" [class.on]="tab === t.key" (click)="switchTab(t.key)">
          <span class="tab-icon">{{ t.icon }}</span>{{ t.label }}
        </button>
      }
    </div>

    <div class="card">
      <h3>{{ activeTab.label }}</h3>
      <p class="muted hint">{{ activeTab.hint }}</p>

      <form (ngSubmit)="send()" novalidate>
        @if (tab === 'email') {
          <label for="c-from">From (email)</label>
          <input id="c-from" [(ngModel)]="form.from" name="from" placeholder="customer@example.com" />
          <label for="c-subject">Subject</label>
          <input id="c-subject" [(ngModel)]="form.subject" name="subject" />
          <label for="c-body">Body</label>
          <textarea id="c-body" rows="4" [(ngModel)]="form.body" name="body"></textarea>
        }

        @if (tab === 'whatsapp' || tab === 'sms') {
          <label for="c-from">From (phone number)</label>
          <input id="c-from" [(ngModel)]="form.from" name="from" placeholder="+201000000000" />
          <label for="c-body">Message</label>
          <textarea id="c-body" rows="4" [(ngModel)]="form.body" name="body"></textarea>
        }

        @if (tab === 'chat') {
          <label for="c-from">From (visitor id or phone)</label>
          <input id="c-from" [(ngModel)]="form.from" name="from" placeholder="visitor-4821" />
          <label for="c-body">Message</label>
          <textarea id="c-body" rows="4" [(ngModel)]="form.body" name="body"></textarea>
        }

        @if (tab === 'webform') {
          <div class="row">
            <div class="field">
              <label for="c-name">Name</label>
              <input id="c-name" [(ngModel)]="form.name" name="name" />
            </div>
            <div class="field">
              <label for="c-email">Email</label>
              <input id="c-email" [(ngModel)]="form.from" name="from" placeholder="customer@example.com" />
            </div>
          </div>
          <label for="c-subject">Subject</label>
          <input id="c-subject" [(ngModel)]="form.subject" name="subject" />
          <label for="c-body">Message</label>
          <textarea id="c-body" rows="4" [(ngModel)]="form.body" name="body"></textarea>
        }

        @for (msg of errorList; track msg) {
          <p class="field-error">{{ msg }}</p>
        }

        <button class="btn" type="submit" [disabled]="sending">
          {{ sending ? 'Sending…' : 'Send inbound message' }}
        </button>
      </form>
    </div>

    @if (sent.length > 0) {
      <div class="card">
        <div class="card-head">
          <h3>Delivered in this session</h3>
          <button type="button" class="link" (click)="sent = []">Clear</button>
        </div>
        <table>
          <thead><tr><th>Channel</th><th>From</th><th>Message</th><th>Ticket</th><th>At</th></tr></thead>
          <tbody>
            @for (m of sent; track m.id) {
              <tr>
                <td><span class="badge">{{ m.channel }}</span></td>
                <td class="nowrap">{{ m.from }}</td>
                <td class="body-cell">{{ m.body }}</td>
                <td><a [routerLink]="['/tickets', m.ticketId]">Open ticket</a></td>
                <td class="nowrap">{{ m.sentAt | date: 'short' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
  styles: [`
    .lede { color: var(--muted); margin: -0.25rem 0 1rem; font-size: 0.9rem; }
    .muted { color: var(--muted); }
    .hint { font-size: 0.85rem; margin-top: -0.25rem; }
    .nowrap { white-space: nowrap; }

    .tabs { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 1rem; }
    .tab {
      display: flex; align-items: center; gap: 0.4rem;
      padding: 0.45rem 0.9rem; border-radius: 8px; cursor: pointer; font: inherit; font-size: 0.88rem;
      background: var(--card); color: var(--muted); border: 1px solid var(--border);
    }
    .tab:hover { color: var(--text); border-color: var(--primary); }
    .tab.on { background: var(--primary); border-color: var(--primary); color: #fff; font-weight: 600; }
    .tab-icon { font-size: 0.95rem; }

    .row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem; }
    .field input { margin-bottom: 0; }
    form .btn { margin-top: 0.9rem; }

    .card-head { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; margin-bottom: 0.5rem; }
    .card-head h3 { margin: 0; }
    .link { background: none; border: none; padding: 0; font: inherit; font-size: 0.85rem; color: var(--primary); cursor: pointer; }
    .link:hover { text-decoration: underline; }
    .body-cell { max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  `]
})
export class ChannelsPage {
  private api = inject(ApiService);

  readonly tabs: { key: Tab; label: string; icon: string; hint: string }[] = [
    { key: 'email', label: 'Email', icon: '✉️', hint: 'Matches the sender to a customer by email address.' },
    { key: 'whatsapp', label: 'WhatsApp', icon: '💬', hint: 'Matches the sender to a customer by phone number.' },
    { key: 'sms', label: 'SMS', icon: '📱', hint: 'Matches the sender to a customer by phone number.' },
    { key: 'chat', label: 'Live chat', icon: '🗨️', hint: 'Live chat is modelled as send-and-poll rather than a socket.' },
    { key: 'webform', label: 'Web form', icon: '📝', hint: 'The public contact form on the marketing site.' },
  ];

  tab: Tab = 'email';
  form = { from: '', subject: '', body: '', name: '' };
  errors: Record<string, string> = {};
  sending = false;
  sent: Message[] = [];

  get activeTab() {
    return this.tabs.find((t) => t.key === this.tab)!;
  }

  get errorList(): string[] {
    return Object.values(this.errors);
  }

  switchTab(key: Tab) {
    this.tab = key;
    this.errors = {};
  }

  send() {
    if (!this.validate()) return;
    this.sending = true;

    const from = this.form.from.trim();
    const body = this.form.body.trim();
    const subject = this.form.subject.trim();

    const request =
      this.tab === 'email' ? this.api.inboundEmail({ from, subject, body })
      : this.tab === 'whatsapp' ? this.api.inboundWhatsapp({ from, body })
      : this.tab === 'sms' ? this.api.inboundSms({ from, body })
      : this.tab === 'chat' ? this.api.sendChatMessage({ from, body })
      : this.api.submitWebForm({ name: this.form.name.trim(), email: from, subject, message: body });

    request.subscribe({
      next: (m) => {
        this.sending = false;
        // Newest first, so the row you just created is at the top.
        this.sent = [m, ...this.sent];
        this.form = { from: '', subject: '', body: '', name: '' };
      },
      error: (e) => {
        this.sending = false;
        this.errors['send'] = e?.error?.message ?? 'The API rejected that message.';
      },
    });
  }

  private validate(): boolean {
    const errors: Record<string, string> = {};
    const needsEmail = this.tab === 'email' || this.tab === 'webform';
    const needsSubject = this.tab === 'email' || this.tab === 'webform';

    if (!this.form.from.trim()) {
      errors['from'] = needsEmail ? 'An email address is required.' : 'A sender is required.';
    } else if (needsEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.from)) {
      errors['from'] = 'Enter a valid email address.';
    }

    if (this.tab === 'webform' && !this.form.name.trim()) errors['name'] = 'Name is required.';
    if (needsSubject && !this.form.subject.trim()) errors['subject'] = 'Subject is required.';
    if (!this.form.body.trim()) errors['body'] = 'The message cannot be empty.';

    this.errors = errors;
    return Object.keys(errors).length === 0;
  }
}
