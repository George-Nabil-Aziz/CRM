import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { ArticleSummary, Customer, Ticket } from '../models';

type Tab = 'submit' | 'requests' | 'help';

const CATEGORIES = ['General', 'Billing', 'Technical', 'Account', 'FeatureRequest'];

@Component({
  selector: 'app-portal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h1>Customer Portal</h1>
    <p class="lede">
      What a customer sees: raise a request, track it, and rate it once it is resolved.
      The demo sign-in has no customer identity, so choose whose portal to view.
    </p>

    <div class="card who">
      <div class="field">
        <label for="customer">Viewing as</label>
        <select id="customer" [(ngModel)]="customerId" (ngModelChange)="onCustomerChange()" name="customer">
          @if (customers.length === 0) {
            <option value="">No customers yet</option>
          }
          @for (c of customers; track c.id) {
            <option [value]="c.id">{{ c.name }} — {{ c.email }}</option>
          }
        </select>
      </div>
    </div>

    <div class="tabs">
      @for (t of tabs; track t.key) {
        <button type="button" class="tab" [class.on]="tab === t.key" (click)="tab = t.key">{{ t.label }}</button>
      }
    </div>

    @if (error) {
      <div class="card"><p class="err">{{ error }}</p></div>
    }

    <!-- SUBMIT -->
    @if (tab === 'submit') {
      <div class="card">
        <h3>Submit a request</h3>
        @if (submitted) {
          <p class="ok">Request {{ submitted.ticketNumber }} was created. Track it under “My requests”.</p>
        }
        <form (ngSubmit)="submit()" novalidate>
          <label for="p-subject">What do you need help with?</label>
          <input id="p-subject" [(ngModel)]="form.subject" name="subject" [class.invalid]="errors['subject']" />
          @if (errors['subject']) { <p class="field-error">{{ errors['subject'] }}</p> }

          <label for="p-cat">Category</label>
          <select id="p-cat" [(ngModel)]="form.category" name="category">
            @for (c of categories; track c) {
              <option [value]="c">{{ c }}</option>
            }
          </select>

          <label for="p-desc">Describe the problem</label>
          <textarea id="p-desc" rows="4" [(ngModel)]="form.description" name="description"
                    [class.invalid]="errors['description']"
                    placeholder="Tell us what happened, and what you expected…"></textarea>
          @if (errors['description']) { <p class="field-error">{{ errors['description'] }}</p> }

          <button class="btn" type="submit" [disabled]="submitting || !customerId">
            {{ submitting ? 'Submitting…' : 'Submit request' }}
          </button>
        </form>
      </div>
    }

    <!-- MY REQUESTS -->
    @if (tab === 'requests') {
      <div class="card">
        <div class="card-head">
          <h3>My requests</h3>
          <div class="chips">
            @for (f of statusFilters; track f) {
              <button type="button" class="chip" [class.on]="statusFilter === f" (click)="setStatus(f)">{{ f }}</button>
            }
          </div>
        </div>

        @if (loading) {
          <p class="muted">Loading…</p>
        } @else if (tickets.length === 0) {
          <p class="muted">No requests yet.</p>
        } @else {
          <div class="requests">
            @for (t of tickets; track t.id) {
              <div class="request">
                <div class="request-head">
                  <div>
                    <strong>{{ t.subject }}</strong>
                    <div class="muted meta">{{ t.ticketNumber }} · {{ t.createdAt | date: 'mediumDate' }}</div>
                  </div>
                  <span class="badge" [ngClass]="t.status">{{ t.status }}</span>
                </div>

                @if (canRate(t)) {
                  @if (rated[t.id]) {
                    <p class="ok small">Thanks for the feedback.</p>
                  } @else {
                    <div class="rate">
                      <span class="rate-label">How did we do?</span>
                      <div class="stars">
                        @for (star of stars; track star) {
                          <button type="button" class="star" [class.on]="ratings[t.id] >= star"
                                  (click)="ratings[t.id] = star" [title]="star + ' of 5'">★</button>
                        }
                      </div>
                      <input class="comment" [(ngModel)]="comments[t.id]" [name]="'c-' + t.id"
                             placeholder="Anything to add? (optional)" />
                      <button class="btn secondary" type="button" [disabled]="!ratings[t.id] || rating === t.id"
                              (click)="sendFeedback(t)">
                        {{ rating === t.id ? 'Sending…' : 'Send' }}
                      </button>
                    </div>
                  }
                } @else {
                  <p class="muted small">You can rate this once it is resolved.</p>
                }
              </div>
            }
          </div>
        }
      </div>
    }

    <!-- HELP -->
    @if (tab === 'help') {
      <div class="card">
        <h3>Help articles</h3>
        <input [(ngModel)]="kbQuery" (ngModelChange)="searchKb()" placeholder="Search the help centre…" />
        @if (articles.length === 0) {
          <p class="muted">Nothing matches that search.</p>
        } @else {
          <div class="articles">
            @for (a of articles; track a.id) {
              <div class="article">
                <div class="article-badges">
                  <span class="badge">{{ a.type }}</span>
                  <span class="badge">{{ a.category }}</span>
                </div>
                <strong>{{ a.title }}</strong>
              </div>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .lede { color: var(--muted); margin: -0.25rem 0 1rem; font-size: 0.9rem; }
    .muted { color: var(--muted); }
    .err { color: var(--danger); }
    .ok { color: var(--success); font-size: 0.88rem; }
    .small { font-size: 0.8rem; margin: 0.5rem 0 0; }

    .who .field { min-width: 260px; max-width: 420px; }
    .field select, .field input, .field textarea { margin-bottom: 0; }

    .tabs { display: flex; flex-wrap: wrap; gap: 0.4rem; margin: 1rem 0; }
    .tab {
      padding: 0.45rem 0.9rem; border-radius: 8px; cursor: pointer; font: inherit; font-size: 0.88rem;
      background: var(--card); color: var(--muted); border: 1px solid var(--border);
    }
    .tab:hover { color: var(--text); border-color: var(--primary); }
    .tab.on { background: var(--primary); border-color: var(--primary); color: #fff; font-weight: 600; }

    .card-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.75rem; margin-bottom: 0.5rem; }
    .card-head h3 { margin: 0; }
    .chips { display: flex; flex-wrap: wrap; gap: 0.3rem; }
    .chip {
      padding: 0.25rem 0.65rem; border-radius: 999px; cursor: pointer; font: inherit; font-size: 0.78rem;
      background: var(--card); color: var(--muted); border: 1px solid var(--border);
    }
    .chip.on { background: var(--primary); border-color: var(--primary); color: #fff; font-weight: 600; }

    .requests { display: flex; flex-direction: column; gap: 0.65rem; }
    .request { padding: 0.8rem 0.9rem; border: 1px solid var(--border); border-radius: 10px; background: var(--bg); }
    .request-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.75rem; }
    .meta { font-size: 0.78rem; margin-top: 0.15rem; }

    .rate { display: flex; flex-wrap: wrap; align-items: center; gap: 0.6rem; margin-top: 0.7rem; }
    .rate-label { font-size: 0.82rem; color: var(--muted); }
    .stars { display: flex; gap: 0.1rem; }
    .star {
      background: none; border: none; cursor: pointer; padding: 0 0.1rem;
      font-size: 1.15rem; line-height: 1; color: var(--border);
    }
    .star.on { color: var(--warn); }
    .comment { flex: 1; min-width: 180px; margin-bottom: 0; }

    .articles { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 0.7rem; }
    .article { padding: 0.75rem; border: 1px solid var(--border); border-radius: 9px; background: var(--bg); }
    .article-badges { display: flex; gap: 0.35rem; margin-bottom: 0.4rem; }
  `]
})
export class PortalPage implements OnInit {
  private api = inject(ApiService);

  readonly tabs: { key: Tab; label: string }[] = [
    { key: 'submit', label: 'Submit a request' },
    { key: 'requests', label: 'My requests' },
    { key: 'help', label: 'Help centre' },
  ];
  readonly categories = CATEGORIES;
  readonly statusFilters = ['All', 'Open', 'Pending', 'Resolved', 'Closed'] as const;
  readonly stars = [1, 2, 3, 4, 5];

  tab: Tab = 'submit';
  error = '';

  customers: Customer[] = [];
  customerId = '';

  form = { subject: '', category: 'General', description: '' };
  errors: Record<string, string> = {};
  submitting = false;
  submitted: Ticket | null = null;

  tickets: Ticket[] = [];
  statusFilter: (typeof this.statusFilters)[number] = 'All';
  loading = false;

  ratings: Record<string, number> = {};
  comments: Record<string, string> = {};
  rated: Record<string, boolean> = {};
  rating = '';

  articles: ArticleSummary[] = [];
  kbQuery = '';

  ngOnInit() {
    this.api.listCustomers().subscribe({
      next: (c) => {
        this.customers = c;
        this.customerId = c[0]?.id ?? '';
        this.loadTickets();
      },
      error: () => (this.error = 'Could not load customers. Is the API running?'),
    });
    this.searchKb();
  }

  onCustomerChange() {
    this.submitted = null;
    this.loadTickets();
  }

  submit() {
    this.errors = {};
    if (!this.form.subject.trim()) this.errors['subject'] = 'Please tell us the subject.';
    if (!this.form.description.trim()) this.errors['description'] = 'Please describe the problem.';
    if (Object.keys(this.errors).length > 0 || !this.customerId) return;

    this.submitting = true;
    this.api.portalCreateTicket({
      customerId: this.customerId,
      subject: this.form.subject.trim(),
      category: this.form.category,
      description: this.form.description.trim(),
    }).subscribe({
      next: (t) => {
        this.submitting = false;
        this.submitted = t;
        this.form = { subject: '', category: 'General', description: '' };
        this.loadTickets();
      },
      error: () => {
        this.submitting = false;
        this.error = 'Could not submit the request.';
      },
    });
  }

  loadTickets() {
    if (!this.customerId) {
      this.tickets = [];
      return;
    }
    this.loading = true;
    const status = this.statusFilter === 'All' ? undefined : this.statusFilter;
    this.api.portalListTickets(this.customerId, status).subscribe({
      next: (t) => {
        this.tickets = t;
        this.loading = false;
      },
      error: () => {
        this.tickets = [];
        this.loading = false;
      },
    });
  }

  setStatus(f: (typeof this.statusFilters)[number]) {
    this.statusFilter = f;
    this.loadTickets();
  }

  /** The API rejects feedback until the ticket is resolved or closed, so the UI mirrors that. */
  canRate(t: Ticket): boolean {
    return t.status === 'Resolved' || t.status === 'Closed';
  }

  sendFeedback(t: Ticket) {
    const stars = this.ratings[t.id];
    if (!stars) return;

    this.rating = t.id;
    this.api.portalSubmitFeedback(t.id, {
      rating: stars,
      comment: this.comments[t.id]?.trim() || undefined,
    }).subscribe({
      next: () => {
        this.rating = '';
        this.rated[t.id] = true;
      },
      error: (e) => {
        this.rating = '';
        // 409 when feedback already exists — treat it as done rather than as a failure.
        if (e?.status === 409) {
          this.rated[t.id] = true;
        } else {
          this.error = e?.error?.message ?? 'Could not send the feedback.';
        }
      },
    });
  }

  searchKb() {
    this.api.portalBrowseKb(this.kbQuery || undefined).subscribe({
      next: (a) => (this.articles = a),
      error: () => (this.articles = []),
    });
  }
}
