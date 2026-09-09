import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { I18nService } from '../i18n/i18n.service';
import { AuditLogEntry, Role, User } from '../models';

type Tab = 'users' | 'roles' | 'audit' | 'settings';

/** The permission keys the roles editor offers. Mirrors what the API stores as free-form strings. */
const PERMISSION_KEYS = [
  'ticket:view', 'ticket:edit', 'ticket:assign', 'ticket:escalate',
  'customer:view', 'customer:edit',
  'article:view', 'article:publish',
  'report:view',
  'user:manage', 'role:manage', 'setting:manage', 'audit:view',
];

/** Settings the console exposes. The API stores any key, but a console needs a known list. */
const SETTING_KEYS = [
  { key: 'support.hours', label: 'Working hours', placeholder: 'Sun–Thu 09:00–17:00' },
  { key: 'support.timezone', label: 'Timezone', placeholder: 'Asia/Riyadh' },
  { key: 'sla.default.response.hours', label: 'Default response target (hours)', placeholder: '4' },
  { key: 'sla.default.resolution.hours', label: 'Default resolution target (hours)', placeholder: '24' },
  { key: 'branding.company.name', label: 'Company name', placeholder: 'Azm' },
];

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h1>Administration</h1>
    <p class="lede">Users, roles and permissions, the audit trail, and system configuration.</p>

    <div class="tabs">
      @for (t of tabs; track t.key) {
        <button type="button" class="tab" [class.on]="tab === t.key" (click)="tab = t.key">{{ t.label }}</button>
      }
    </div>

    @if (error) {
      <div class="card"><p class="err">{{ error }}</p></div>
    }

    <!-- USERS -->
    @if (tab === 'users') {
      <div class="card">
        <h3>Add a user</h3>
        <form (ngSubmit)="createUser()" novalidate>
          <div class="row">
            <div class="field">
              <label for="u-name">Name</label>
              <input id="u-name" [(ngModel)]="userForm.name" name="name" [class.invalid]="userErrors['name']" />
            </div>
            <div class="field">
              <label for="u-email">Email</label>
              <input id="u-email" [(ngModel)]="userForm.email" name="email" [class.invalid]="userErrors['email']" />
            </div>
            <div class="field">
              <label for="u-role">Role</label>
              <select id="u-role" [(ngModel)]="userForm.roleId" name="roleId" [class.invalid]="userErrors['roleId']">
                <option value="">Select a role…</option>
                @for (r of roles; track r.id) {
                  <option [value]="r.id">{{ r.name }}</option>
                }
              </select>
            </div>
          </div>
          @for (msg of userErrorList; track msg) {
            <p class="field-error">{{ msg }}</p>
          }
          <button class="btn" type="submit" [disabled]="savingUser">{{ savingUser ? 'Adding…' : 'Add user' }}</button>
        </form>
      </div>

      <div class="card">
        <div class="card-head">
          <h3>Users</h3>
          <input class="search" [(ngModel)]="userQuery" (ngModelChange)="loadUsers()" placeholder="Search name or email…" />
        </div>
        @if (users.length === 0) {
          <p class="muted">No users found.</p>
        } @else {
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Created</th></tr></thead>
            <tbody>
              @for (u of users; track u.id) {
                <tr>
                  <td>{{ u.name }}</td>
                  <td>{{ u.email }}</td>
                  <td><span class="badge">{{ u.roleName }}</span></td>
                  <td>{{ u.createdAt | date: 'mediumDate' }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    }

    <!-- ROLES -->
    @if (tab === 'roles') {
      <div class="card">
        <h3>Add a role</h3>
        <form (ngSubmit)="createRole()" novalidate>
          <div class="field">
            <label for="r-name">Role name</label>
            <input id="r-name" [(ngModel)]="roleName" name="roleName" placeholder="e.g. Team Lead" />
          </div>
          <button class="btn" type="submit" [disabled]="!roleName.trim() || savingRole">
            {{ savingRole ? 'Adding…' : 'Add role' }}
          </button>
        </form>
      </div>

      @for (r of roles; track r.id) {
        <div class="card">
          <div class="card-head">
            <h3>{{ r.name }}</h3>
            <span class="muted count">{{ r.permissions.length }} of {{ permissionKeys.length }} permissions</span>
          </div>
          <div class="perms">
            @for (p of permissionKeys; track p) {
              <label class="perm">
                <input type="checkbox" [checked]="r.permissions.includes(p)" (change)="togglePermission(r, p)" />
                <span>{{ p }}</span>
              </label>
            }
          </div>
          @if (savedRoleId === r.id) {
            <p class="saved">Permissions saved.</p>
          }
        </div>
      }
    }

    <!-- AUDIT -->
    @if (tab === 'audit') {
      <div class="card filters">
        <div class="field">
          <label for="a-type">Target type</label>
          <select id="a-type" [(ngModel)]="auditTargetType" (ngModelChange)="loadAudit()">
            <option value="">All</option>
            @for (t of auditTypes; track t) {
              <option [value]="t">{{ t }}</option>
            }
          </select>
        </div>
        <div class="field">
          <label for="a-from">From</label>
          <input id="a-from" type="date" [(ngModel)]="auditFrom" (ngModelChange)="loadAudit()" />
        </div>
        <div class="field">
          <label for="a-to">To</label>
          <input id="a-to" type="date" [(ngModel)]="auditTo" (ngModelChange)="loadAudit()" />
        </div>
      </div>

      <div class="card">
        <h3>Audit log</h3>
        @if (auditLogs.length === 0) {
          <p class="muted">No entries match these filters.</p>
        } @else {
          <table>
            <thead><tr><th>When</th><th>Action</th><th>Target</th><th>Actor</th></tr></thead>
            <tbody>
              @for (a of auditLogs; track a.id) {
                <tr>
                  <td class="nowrap">{{ a.timestamp | date: 'short' }}</td>
                  <td><span class="badge">{{ a.action }}</span></td>
                  <td>{{ a.targetType }} <code class="id">{{ shortId(a.targetId) }}</code></td>
                  <td>{{ a.actorId ? shortId(a.actorId) : 'system' }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    }

    <!-- SETTINGS -->
    @if (tab === 'settings') {
      <div class="card">
        <h3>System configuration</h3>
        <p class="muted hint">Each row is saved on its own. Blank values have never been set.</p>
        @for (s of settingKeys; track s.key) {
          <div class="setting">
            <div class="field">
              <label [for]="'set-' + s.key">{{ s.label }}</label>
              <input [id]="'set-' + s.key" [(ngModel)]="settingValues[s.key]" [placeholder]="s.placeholder" [name]="s.key" />
            </div>
            <button class="btn secondary" type="button" (click)="saveSetting(s.key)" [disabled]="savingSetting === s.key">
              {{ savingSetting === s.key ? 'Saving…' : savedSettingKey === s.key ? 'Saved' : 'Save' }}
            </button>
          </div>
          <code class="key">{{ s.key }}</code>
        }
      </div>
    }
  `,
  styles: [`
    .lede { color: var(--muted); margin: -0.25rem 0 1rem; }
    .muted { color: var(--muted); }
    .err { color: var(--danger); }
    .nowrap { white-space: nowrap; }

    .tabs { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 1rem; }
    .tab {
      padding: 0.45rem 0.9rem; border-radius: 8px; cursor: pointer; font: inherit; font-size: 0.88rem;
      background: var(--card); color: var(--muted); border: 1px solid var(--border);
    }
    .tab:hover { color: var(--text); border-color: var(--primary); }
    .tab.on { background: var(--primary); border-color: var(--primary); color: #fff; font-weight: 600; }

    .card-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.75rem; margin-bottom: 0.5rem; }
    .card-head h3 { margin: 0; }
    .search { margin: 0; max-width: 260px; }
    .count { font-size: 0.8rem; }

    .row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem; }
    .field input, .field select { margin-bottom: 0; }
    .filters { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 1rem; }
    .filters .field { min-width: 150px; }
    form .btn { margin-top: 0.9rem; }

    .perms { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 0.4rem; }
    .perm { display: flex; align-items: center; gap: 0.5rem; margin: 0; font-size: 0.85rem; color: var(--text); cursor: pointer; }
    .perm input { width: auto; margin: 0; }
    .saved { color: var(--success); font-size: 0.82rem; margin: 0.75rem 0 0; }

    .setting { display: flex; align-items: flex-end; gap: 0.75rem; }
    .setting .field { flex: 1; }
    .setting .btn { flex-shrink: 0; padding: 0.5rem 0.9rem; }
    .key { display: block; font-size: 0.72rem; color: var(--muted); margin: 0.2rem 0 1rem; }
    .hint { font-size: 0.85rem; margin-top: -0.25rem; }
    .id { font-size: 0.75rem; color: var(--muted); }
  `]
})
export class AdminPage implements OnInit {
  readonly i18n = inject(I18nService);

  readonly tabs: { key: Tab; label: string }[] = [
    { key: 'users', label: 'Users' },
    { key: 'roles', label: 'Roles & Permissions' },
    { key: 'audit', label: 'Audit Log' },
    { key: 'settings', label: 'Settings' },
  ];
  readonly permissionKeys = PERMISSION_KEYS;
  readonly settingKeys = SETTING_KEYS;
  readonly auditTypes = ['user', 'role', 'setting', 'ticket'];

  tab: Tab = 'users';
  error = '';

  users: User[] = [];
  roles: Role[] = [];
  auditLogs: AuditLogEntry[] = [];
  settingValues: Record<string, string> = {};

  userQuery = '';
  userForm = { name: '', email: '', roleId: '' };
  userErrors: Record<string, string> = {};
  savingUser = false;

  roleName = '';
  savingRole = false;
  savedRoleId = '';

  auditTargetType = '';
  auditFrom = '';
  auditTo = '';

  savingSetting = '';
  savedSettingKey = '';

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadRoles();
    this.loadUsers();
    this.loadAudit();
    this.loadSettings();
  }

  get userErrorList(): string[] {
    return Object.values(this.userErrors);
  }

  shortId(id: string): string {
    return id.slice(0, 8);
  }

  // --- users ---

  loadUsers() {
    this.api.listUsers({ q: this.userQuery || undefined }).subscribe({
      next: (u) => (this.users = u),
      error: () => (this.error = 'Could not load users. Is the API running?'),
    });
  }

  createUser() {
    this.userErrors = {};
    if (!this.userForm.name.trim()) this.userErrors['name'] = 'Name is required.';
    if (!this.userForm.email.trim()) this.userErrors['email'] = 'Email is required.';
    if (!this.userForm.roleId) this.userErrors['roleId'] = 'Pick a role.';
    if (this.userErrorList.length > 0) return;

    this.savingUser = true;
    this.api.createUser(this.userForm).subscribe({
      next: () => {
        this.savingUser = false;
        this.userForm = { name: '', email: '', roleId: '' };
        this.loadUsers();
        this.loadAudit();
      },
      error: (e) => {
        this.savingUser = false;
        // The API returns 409 with a message when the email is already taken.
        this.userErrors['email'] = e?.error?.message ?? 'Could not create the user.';
      },
    });
  }

  // --- roles ---

  loadRoles() {
    this.api.listRoles().subscribe({
      next: (r) => (this.roles = r),
      error: () => (this.error = 'Could not load roles. Is the API running?'),
    });
  }

  createRole() {
    const name = this.roleName.trim();
    if (!name) return;

    this.savingRole = true;
    this.api.createRole({ name, permissions: [] }).subscribe({
      next: () => {
        this.savingRole = false;
        this.roleName = '';
        this.loadRoles();
        this.loadAudit();
      },
      error: () => {
        this.savingRole = false;
        this.error = 'Could not create the role — the name may already exist.';
      },
    });
  }

  togglePermission(role: Role, permission: string) {
    const next = role.permissions.includes(permission)
      ? role.permissions.filter((p) => p !== permission)
      : [...role.permissions, permission];

    // Applied locally first so the checkbox responds immediately; the reload below
    // replaces it with whatever the server actually stored.
    role.permissions = next;

    this.api.updateRolePermissions(role.id, next).subscribe({
      next: () => {
        this.savedRoleId = role.id;
        this.loadAudit();
      },
      error: () => {
        this.error = 'Could not save the permission change.';
        this.loadRoles();
      },
    });
  }

  // --- audit ---

  loadAudit() {
    this.api.listAuditLogs({
      targetType: this.auditTargetType || undefined,
      dateFrom: this.auditFrom || undefined,
      dateTo: this.auditTo || undefined,
    }).subscribe({
      next: (a) => (this.auditLogs = a),
      error: () => (this.error = 'Could not load the audit log.'),
    });
  }

  // --- settings ---

  loadSettings() {
    // The API reads one key at a time and 404s on keys that were never set, which is
    // expected here rather than an error — a blank field means "not configured".
    for (const s of SETTING_KEYS) {
      this.api.getSetting(s.key).subscribe({
        next: (v) => (this.settingValues[s.key] = v.value),
        error: () => (this.settingValues[s.key] = ''),
      });
    }
  }

  saveSetting(key: string) {
    this.savingSetting = key;
    this.api.upsertSetting(key, this.settingValues[key] ?? '').subscribe({
      next: () => {
        this.savingSetting = '';
        this.savedSettingKey = key;
        this.loadAudit();
      },
      error: () => {
        this.savingSetting = '';
        this.error = 'Could not save that setting.';
      },
    });
  }
}
