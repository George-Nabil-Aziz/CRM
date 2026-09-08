import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../api.service';
import { Customer, Ticket } from '../models';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <h1>Tickets</h1>

    <div class="card">
      <h3>New ticket</h3>
      <form (ngSubmit)="create()" novalidate>
        <label>Customer</label>
        <select [(ngModel)]="form.customerId" name="customerId" [class.invalid]="fieldErrors['customerId']">
          <option value="" disabled selected>Select a customer…</option>
          @for (c of customers; track c.id) {
            <option [value]="c.id">{{ c.name }} ({{ c.email }})</option>
          }
        </select>
        @if (fieldErrors['customerId']) { <p class="field-error">{{ fieldErrors['customerId'] }}</p> }
        <label>Subject</label>
        <input [(ngModel)]="form.subject" name="subject" [class.invalid]="fieldErrors['subject']" />
        @if (fieldErrors['subject']) { <p class="field-error">{{ fieldErrors['subject'] }}</p> }
        <label>Category</label>
        <select [(ngModel)]="form.category" name="category">
          <option>General</option><option>Billing</option><option>Technical</option>
          <option>Account</option><option>FeatureRequest</option>
        </select>
        <label>Priority</label>
        <select [(ngModel)]="form.priority" name="priority">
          <option>Low</option><option>Medium</option><option>High</option><option>Urgent</option>
        </select>
        <button class="btn" type="submit" [disabled]="creating">{{ creating ? 'Creating…' : 'Create ticket' }}</button>
      </form>
    </div>

    <div class="card">
      <h3>All tickets</h3>
      <div class="filter-bar">
        <input class="search-input" placeholder="Search by number or subject…" [(ngModel)]="search" (ngModelChange)="applyFilters()" />
        <select [(ngModel)]="statusFilter" (ngModelChange)="load()">
          <option value="">All statuses</option>
          <option>Open</option><option>Pending</option><option>Resolved</option><option>Closed</option>
        </select>
        <select [(ngModel)]="categoryFilter" (ngModelChange)="applyFilters()">
          <option value="">All categories</option>
          <option>General</option><option>Billing</option><option>Technical</option>
          <option>Account</option><option>FeatureRequest</option>
        </select>
        <select [(ngModel)]="priorityFilter" (ngModelChange)="applyFilters()">
          <option value="">All priorities</option>
          <option>Low</option><option>Medium</option><option>High</option><option>Urgent</option>
        </select>
        @if (search || categoryFilter || priorityFilter || statusFilter) {
          <button class="btn secondary" type="button" (click)="clearFilters()">Clear</button>
        }
      </div>
      @if (filteredTickets.length === 0) {
        <p class="muted">No tickets found.</p>
      } @else {
        <table>
          <thead><tr><th>Number</th><th>Subject</th><th>Category</th><th>Priority</th><th>Status</th></tr></thead>
          <tbody>
            @for (t of filteredTickets; track t.id) {
              <tr [routerLink]="['/tickets', t.id]" style="cursor:pointer">
                <td>{{ t.ticketNumber }}</td>
                <td>{{ t.subject }} @if (t.escalated) { <span class="badge Urgent">Escalated</span> }</td>
                <td>{{ t.category }}</td>
                <td><span class="badge" [ngClass]="t.priority">{{ t.priority }}</span></td>
                <td><span class="badge" [ngClass]="t.status">{{ t.status }}</span></td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `,
  styles: [`
    .filter-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
      margin-bottom: 0.75rem;
    }
    .filter-bar input, .filter-bar select { margin-bottom: 0; width: auto; }
    .search-input { flex: 1 1 220px; }
    .filter-bar select { flex: 0 1 160px; }
  `]
})
export class TicketsPage implements OnInit {
  tickets: Ticket[] = [];
  filteredTickets: Ticket[] = [];
  customers: Customer[] = [];
  statusFilter = '';
  categoryFilter = '';
  priorityFilter = '';
  search = '';
  form = { customerId: '', subject: '', category: 'General', priority: 'Medium' };
  creating = false;
  fieldErrors: Record<string, string> = {};

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.load();
    this.api.listCustomers().subscribe(c => (this.customers = c));
  }

  load() {
    this.api.listTickets(this.statusFilter || undefined).subscribe(t => {
      this.tickets = t;
      this.applyFilters();
    });
  }

  applyFilters() {
    const q = this.search.trim().toLowerCase();
    this.filteredTickets = this.tickets.filter(t =>
      (!this.categoryFilter || t.category === this.categoryFilter) &&
      (!this.priorityFilter || t.priority === this.priorityFilter) &&
      (!q || t.ticketNumber.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q))
    );
  }

  clearFilters() {
    this.search = '';
    this.categoryFilter = '';
    this.priorityFilter = '';
    this.statusFilter = '';
    this.load();
  }

  validate(): boolean {
    const errors: Record<string, string> = {};
    if (!this.form.customerId) errors['customerId'] = 'Please select a customer.';
    if (!this.form.subject.trim()) errors['subject'] = 'Subject is required.';
    this.fieldErrors = errors;
    return Object.keys(errors).length === 0;
  }

  create() {
    if (!this.validate()) return;
    this.creating = true;
    this.api.createTicket(this.form).subscribe({
      next: () => {
        this.creating = false;
        this.form = { customerId: '', subject: '', category: 'General', priority: 'Medium' };
        this.fieldErrors = {};
        this.load();
      },
      error: () => (this.creating = false)
    });
  }
}
