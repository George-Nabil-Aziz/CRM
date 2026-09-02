import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../api.service';
import { Customer, InteractionEntry } from '../models';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    @if (customer) {
      <h1>{{ customer.name }}</h1>
      <div class="card">
        <h3>Contact details</h3>
        <form (ngSubmit)="save()">
          <label>Phone</label>
          <input [(ngModel)]="editForm.phone" name="phone" />
          <label>Email</label>
          <input [(ngModel)]="editForm.email" name="email" type="email" />
          <label>Address</label>
          <input [(ngModel)]="editForm.address" name="address" />
          <button class="btn" type="submit">Save</button>
          @if (saved) { <span style="color: var(--success); margin-left: 0.5rem;">Saved.</span> }
        </form>
      </div>

      <div class="card">
        <h3>Add note</h3>
        <form (ngSubmit)="addNote()">
          <textarea [(ngModel)]="noteText" name="note" rows="2" placeholder="Write a note about this customer…"></textarea>
          <button class="btn secondary" type="submit" [disabled]="!noteText">Add note</button>
        </form>
      </div>

      <div class="card">
        <h3>Interaction history</h3>
        @if (history.length === 0) {
          <p class="muted">No interactions yet.</p>
        } @else {
          <table>
            <thead><tr><th>Type</th><th>Summary</th><th>When</th></tr></thead>
            <tbody>
              @for (h of history; track h.id) {
                <tr>
                  <td><span class="badge">{{ h.type }}</span></td>
                  <td>
                    @if (h.ticketId) {
                      <a [routerLink]="['/tickets', h.ticketId]">{{ h.summary }}</a>
                    } @else {
                      {{ h.summary }}
                    }
                  </td>
                  <td>{{ h.timestamp | date: 'dd-MM-yyyy' }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    }
  `
})
export class CustomerDetailPage implements OnInit {
  customer: Customer | null = null;
  history: InteractionEntry[] = [];
  editForm = { phone: '', email: '', address: '' };
  noteText = '';
  saved = false;
  private id!: string;

  constructor(private route: ActivatedRoute, private api: ApiService) {}

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id')!;
    this.loadHistory();
    this.api.getCustomer(this.id).subscribe(c => {
      this.customer = c;
      this.editForm = { phone: c.phone, email: c.email, address: c.address ?? '' };
    });
  }

  loadHistory() {
    this.api.getCustomerHistory(this.id).subscribe(h => (this.history = h));
  }

  save() {
    this.saved = false;
    this.api.updateCustomer(this.id, this.editForm).subscribe(c => {
      this.customer = c;
      this.saved = true;
    });
  }

  addNote() {
    this.api.addNote(this.id, { text: this.noteText }).subscribe(() => {
      this.noteText = '';
      this.loadHistory();
    });
  }
}
