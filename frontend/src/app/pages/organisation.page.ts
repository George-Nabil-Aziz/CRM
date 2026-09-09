import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { Branch, Branding, Department } from '../models';

type Tab = 'departments' | 'branches' | 'branding';

@Component({
  selector: 'app-organisation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h1>Organisation</h1>
    <p class="lede">Departments, branches, and how the product is branded.</p>

    <div class="tabs">
      @for (t of tabs; track t.key) {
        <button type="button" class="tab" [class.on]="tab === t.key" (click)="tab = t.key">{{ t.label }}</button>
      }
    </div>

    @if (error) {
      <div class="card"><p class="err">{{ error }}</p></div>
    }

    <!-- DEPARTMENTS -->
    @if (tab === 'departments') {
      <div class="card">
        <h3>Add a department</h3>
        <form (ngSubmit)="createDepartment()" novalidate>
          <div class="inline">
            <div class="field grow">
              <label for="d-name">Department name</label>
              <input id="d-name" [(ngModel)]="departmentName" name="departmentName" placeholder="e.g. Billing Support" />
            </div>
            <button class="btn" type="submit" [disabled]="!departmentName.trim() || savingDepartment">
              {{ savingDepartment ? 'Adding…' : 'Add' }}
            </button>
          </div>
        </form>
      </div>

      <div class="card">
        <h3>Departments</h3>
        @if (departments.length === 0) {
          <p class="muted">No departments yet.</p>
        } @else {
          <ul class="list">
            @for (d of departments; track d.id) {
              <li><span class="dot"></span>{{ d.name }}</li>
            }
          </ul>
        }
      </div>
    }

    <!-- BRANCHES -->
    @if (tab === 'branches') {
      <div class="card">
        <h3>Add a branch</h3>
        <form (ngSubmit)="createBranch()" novalidate>
          <div class="row">
            <div class="field">
              <label for="b-name">Branch name</label>
              <input id="b-name" [(ngModel)]="branchForm.name" name="branchName" placeholder="e.g. Riyadh HQ" />
            </div>
            <div class="field">
              <label for="b-loc">Location</label>
              <input id="b-loc" [(ngModel)]="branchForm.location" name="branchLocation" placeholder="e.g. Riyadh, Saudi Arabia" />
            </div>
          </div>
          @if (branchError) { <p class="field-error">{{ branchError }}</p> }
          <button class="btn" type="submit" [disabled]="savingBranch">{{ savingBranch ? 'Adding…' : 'Add branch' }}</button>
        </form>
      </div>

      <div class="card">
        <h3>Branches</h3>
        @if (branches.length === 0) {
          <p class="muted">No branches yet.</p>
        } @else {
          <table>
            <thead><tr><th>Name</th><th>Location</th></tr></thead>
            <tbody>
              @for (b of branches; track b.id) {
                <tr><td>{{ b.name }}</td><td>{{ b.location }}</td></tr>
              }
            </tbody>
          </table>
        }
      </div>
    }

    <!-- BRANDING -->
    @if (tab === 'branding') {
      <div class="card">
        <h3>Branding</h3>
        <p class="muted hint">Saved to the API. The preview below is live; the app's own theme is unchanged.</p>

        <div class="brand-grid">
          <div class="brand-fields">
            <div class="field">
              <label for="br-logo">Logo URL</label>
              <input id="br-logo" [(ngModel)]="branding.logoUrl" name="logoUrl" placeholder="https://…/logo.svg" />
            </div>
            <div class="field">
              <label for="br-primary">Primary colour</label>
              <div class="colour-row">
                <input id="br-primary" type="color" [(ngModel)]="branding.primaryColor" name="primaryColor" />
                <input class="hex" [(ngModel)]="branding.primaryColor" name="primaryHex" />
              </div>
            </div>
            <div class="field">
              <label for="br-secondary">Secondary colour</label>
              <div class="colour-row">
                <input id="br-secondary" type="color" [(ngModel)]="branding.secondaryColor" name="secondaryColor" />
                <input class="hex" [(ngModel)]="branding.secondaryColor" name="secondaryHex" />
              </div>
            </div>
            <button class="btn" type="button" (click)="saveBranding()" [disabled]="savingBranding">
              {{ savingBranding ? 'Saving…' : brandingSaved ? 'Saved' : 'Save branding' }}
            </button>
          </div>

          <div class="preview" [style.background]="branding.primaryColor">
            <div class="preview-bar" [style.background]="branding.secondaryColor"></div>
            <div class="preview-body">
              @if (branding.logoUrl) {
                <img [src]="branding.logoUrl" alt="Logo preview" (error)="logoBroken = true" [hidden]="logoBroken" />
              }
              @if (!branding.logoUrl || logoBroken) {
                <span class="preview-mark">A</span>
              }
              <span class="preview-name">Azm CRM</span>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .lede { color: var(--muted); margin: -0.25rem 0 1rem; }
    .muted { color: var(--muted); }
    .err { color: var(--danger); }
    .hint { font-size: 0.85rem; margin-top: -0.25rem; }

    .tabs { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 1rem; }
    .tab {
      padding: 0.45rem 0.9rem; border-radius: 8px; cursor: pointer; font: inherit; font-size: 0.88rem;
      background: var(--card); color: var(--muted); border: 1px solid var(--border);
    }
    .tab:hover { color: var(--text); border-color: var(--primary); }
    .tab.on { background: var(--primary); border-color: var(--primary); color: #fff; font-weight: 600; }

    .row { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 0.75rem; }
    .inline { display: flex; align-items: flex-end; gap: 0.75rem; }
    .grow { flex: 1; }
    .field input { margin-bottom: 0; }
    form .btn { margin-top: 0.9rem; }
    .inline .btn { margin-top: 0; flex-shrink: 0; }

    .list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.35rem; }
    .list li {
      display: flex; align-items: center; gap: 0.6rem; font-size: 0.9rem;
      padding: 0.5rem 0.7rem; border: 1px solid var(--border); border-radius: 8px; background: var(--bg);
    }
    .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--primary); flex-shrink: 0; }

    .brand-grid { display: grid; grid-template-columns: minmax(240px, 1fr) minmax(200px, 280px); gap: 1.25rem; align-items: start; }
    .brand-fields { display: flex; flex-direction: column; gap: 0.75rem; }
    .brand-fields .btn { margin-top: 0.25rem; align-self: flex-start; }
    .colour-row { display: flex; gap: 0.5rem; align-items: center; }
    .colour-row input[type='color'] {
      width: 44px; height: 36px; padding: 2px; margin: 0; cursor: pointer; flex-shrink: 0;
    }
    .hex { margin: 0; font-family: ui-monospace, monospace; font-size: 0.85rem; }

    .preview { border-radius: 12px; overflow: hidden; border: 1px solid var(--border); }
    .preview-bar { height: 6px; }
    .preview-body { display: flex; align-items: center; gap: 0.65rem; padding: 1.5rem 1.25rem; }
    .preview-body img { max-height: 34px; max-width: 120px; }
    .preview-mark {
      width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
      background: rgba(255,255,255,0.2); color: #fff;
      display: flex; align-items: center; justify-content: center; font-weight: 700;
    }
    .preview-name { color: #fff; font-weight: 700; }

    @media (max-width: 720px) {
      .brand-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class OrganisationPage implements OnInit {
  private api = inject(ApiService);

  readonly tabs: { key: Tab; label: string }[] = [
    { key: 'departments', label: 'Departments' },
    { key: 'branches', label: 'Branches' },
    { key: 'branding', label: 'Branding' },
  ];

  tab: Tab = 'departments';
  error = '';

  departments: Department[] = [];
  departmentName = '';
  savingDepartment = false;

  branches: Branch[] = [];
  branchForm = { name: '', location: '' };
  branchError = '';
  savingBranch = false;

  /** Defaults match the API's own BrandingConfig defaults until the real values load. */
  branding: Branding = { logoUrl: '', primaryColor: '#6D28D9', secondaryColor: '#4C1D95' };
  savingBranding = false;
  brandingSaved = false;
  logoBroken = false;

  ngOnInit() {
    this.loadDepartments();
    this.loadBranches();
    this.loadBranding();
  }

  loadDepartments() {
    this.api.listDepartments().subscribe({
      next: (d) => (this.departments = d),
      error: () => (this.error = 'Could not load departments. Is the API running?'),
    });
  }

  createDepartment() {
    const name = this.departmentName.trim();
    if (!name) return;

    this.savingDepartment = true;
    this.api.createDepartment(name).subscribe({
      next: () => {
        this.savingDepartment = false;
        this.departmentName = '';
        this.loadDepartments();
      },
      error: () => {
        this.savingDepartment = false;
        this.error = 'Could not add the department.';
      },
    });
  }

  loadBranches() {
    this.api.listBranches().subscribe({
      next: (b) => (this.branches = b),
      error: () => (this.error = 'Could not load branches.'),
    });
  }

  createBranch() {
    this.branchError = '';
    if (!this.branchForm.name.trim()) {
      this.branchError = 'Branch name is required.';
      return;
    }
    if (!this.branchForm.location.trim()) {
      this.branchError = 'Location is required.';
      return;
    }

    this.savingBranch = true;
    this.api.createBranch({
      name: this.branchForm.name.trim(),
      location: this.branchForm.location.trim(),
    }).subscribe({
      next: () => {
        this.savingBranch = false;
        this.branchForm = { name: '', location: '' };
        this.loadBranches();
      },
      error: () => {
        this.savingBranch = false;
        this.branchError = 'Could not add the branch.';
      },
    });
  }

  loadBranding() {
    this.api.getBranding().subscribe({
      next: (b) => {
        this.branding = { ...b, logoUrl: b.logoUrl ?? '' };
        this.logoBroken = false;
      },
      error: () => (this.error = 'Could not load branding.'),
    });
  }

  saveBranding() {
    this.savingBranding = true;
    this.brandingSaved = false;
    this.api.updateBranding({
      logoUrl: this.branding.logoUrl ?? '',
      primaryColor: this.branding.primaryColor,
      secondaryColor: this.branding.secondaryColor,
    }).subscribe({
      next: () => {
        this.savingBranding = false;
        this.brandingSaved = true;
      },
      error: () => {
        this.savingBranding = false;
        this.error = 'Could not save branding.';
      },
    });
  }
}
