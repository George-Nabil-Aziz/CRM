import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../api.service';
import { Customer } from '../models';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <h1>Customers</h1>

    <div class="card">
      <h3>New customer</h3>
      <form (ngSubmit)="create()" novalidate>
        <label>Name</label>
        <input [(ngModel)]="form.name" name="name" [class.invalid]="fieldErrors.name" />
        @if (fieldErrors.name) { <p class="field-error">{{ fieldErrors.name }}</p> }
        <label>Email</label>
        <input [(ngModel)]="form.email" name="email" type="email" [class.invalid]="fieldErrors.email" />
        @if (fieldErrors.email) { <p class="field-error">{{ fieldErrors.email }}</p> }
        <label>Phone</label>
        <input [(ngModel)]="form.phone" name="phone" [class.invalid]="fieldErrors.phone" />
        @if (fieldErrors.phone) { <p class="field-error">{{ fieldErrors.phone }}</p> }
        <button class="btn" type="submit" [disabled]="creating">{{ creating ? 'Creating…' : 'Create customer' }}</button>
        @if (error) { <p style="color: var(--danger)">{{ error }}</p> }
      </form>
    </div>

    <div class="card">
      <h3>All customers</h3>
      <input placeholder="Search by name or email…" [(ngModel)]="search" (ngModelChange)="onSearch()" />
      @if (customers.length === 0) {
        <p class="muted">No customers found.</p>
      } @else {
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Created</th></tr></thead>
          <tbody>
            @for (c of customers; track c.id) {
              <tr [routerLink]="['/customers', c.id]" style="cursor:pointer">
                <td>{{ c.name }}</td>
                <td>{{ c.email }}</td>
                <td>{{ c.phone }}</td>
                <td>{{ c.createdAt | date: 'dd-MM-yyyy' }}</td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `
})
export class CustomersPage implements OnInit {
  customers: Customer[] = [];
  search = '';
  form = { name: '', email: '', phone: '' };
  creating = false;
  error = '';
  fieldErrors: Record<string, string> = {};

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.listCustomers(this.search || undefined).subscribe(c => (this.customers = c));
  }

  onSearch() {
    this.load();
  }

  validate(): boolean {
    const errors: Record<string, string> = {};
    if (!this.form.name.trim()) errors['name'] = 'Name is required.';
    if (!this.form.email.trim()) errors['email'] = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email)) errors['email'] = 'Enter a valid email address.';
    if (!this.form.phone.trim()) errors['phone'] = 'Phone is required.';
    this.fieldErrors = errors;
    return Object.keys(errors).length === 0;
  }

  create() {
    this.error = '';
    if (!this.validate()) return;
    this.creating = true;
    this.api.createCustomer(this.form).subscribe({
      next: () => {
        this.creating = false;
        this.form = { name: '', email: '', phone: '' };
        this.fieldErrors = {};
        this.load();
      },
      error: (err) => {
        this.creating = false;
        this.error = err?.error?.message || 'Could not create customer.';
      }
    });
  }
}
