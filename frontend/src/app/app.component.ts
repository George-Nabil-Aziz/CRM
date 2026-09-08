import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { NAV_SECTIONS, NavBadges, NavLeaf, navState } from './nav.model';

const DARK_MODE_KEY = 'crm-dark-mode';
const SIDEBAR_COLLAPSED_KEY = 'crm-sidebar-collapsed';

interface ResolvedNavItem extends NavLeaf {
  state: 'available' | 'unavailable' | 'locked';
}

interface ResolvedSection {
  key: string;
  label: string;
  items: ResolvedNavItem[];
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    @if (user()) {
      <div class="shell">
        <nav class="sidebar" [class.collapsed]="sidebarCollapsed">
          <div class="brand">
            <span class="brand-mark">A</span>
            <span class="brand-name">Azm CRM</span>
            <button class="toggle-btn" type="button" (click)="toggleSidebar()" [title]="sidebarCollapsed ? 'Expand' : 'Collapse'">
              {{ sidebarCollapsed ? '»' : '«' }}
            </button>
          </div>

          <div class="nav-scroll">
            @for (section of sections(); track section.key) {
              <div class="section">
                <div class="section-label">{{ section.label }}</div>
                @for (item of section.items; track item.path) {
                  @if (item.state === 'available') {
                    <a [routerLink]="item.path" routerLinkActive="active"
                       [routerLinkActiveOptions]="{ exact: !!item.exact }" [title]="item.label">
                      <span class="icon">{{ item.icon }}</span>
                      <span class="label">{{ item.label }}</span>
                      @if (item.badge === 'openTickets' && badges().openTickets > 0) {
                        <span class="badge-count" [class.at-risk]="badges().ticketsAtRisk">{{ badges().openTickets }}</span>
                      }
                    </a>
                  } @else {
                    <span class="disabled" [class.locked]="item.state === 'locked'"
                          [title]="item.state === 'locked' ? item.label + ' — you don\\'t have access to this' : item.label + ' — coming soon'">
                      <span class="icon">{{ item.icon }}</span>
                      <span class="label">{{ item.label }}</span>
                      <span class="tag">{{ item.state === 'locked' ? '🔒' : 'Soon' }}</span>
                    </span>
                  }
                }
              </div>
            }
          </div>

          <div class="spacer"></div>

          <button class="theme-toggle-inline" type="button" (click)="toggleDarkMode()">
            <span class="icon">{{ darkMode ? '☀️' : '🌙' }}</span>
            <span class="label">{{ darkMode ? 'Light mode' : 'Dark mode' }}</span>
          </button>

          <div class="user" [title]="user()!.displayName + ' — ' + user()!.role">
            <span class="avatar" [style.background]="user()!.accent">{{ user()!.avatar }}</span>
            <span class="user-meta">
              <span class="user-name">{{ user()!.displayName }}</span>
              <span class="user-role">{{ user()!.role }}</span>
            </span>
            <button class="signout" type="button" (click)="signOut()" title="Sign out">⏻</button>
          </div>
        </nav>

        <main class="content">
          <router-outlet />
        </main>
      </div>
    } @else {
      <router-outlet />
    }
  `,
  styles: [`
    .shell { display: flex; height: 100vh; }
    .sidebar {
      width: 232px; flex-shrink: 0; display: flex; flex-direction: column;
      background: linear-gradient(180deg, var(--primary-dark), #3B1670);
      color: #fff; padding: 1.1rem 0.75rem; transition: width 0.18s ease;
      overflow: hidden;
    }
    .sidebar.collapsed { width: 72px; }
    .brand {
      display: flex; align-items: center; gap: 0.6rem;
      margin-bottom: 0.75rem; padding: 0 0.35rem; white-space: nowrap;
    }
    .brand-mark {
      flex-shrink: 0; width: 32px; height: 32px; border-radius: 9px;
      background: rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center;
      font-weight: 700;
    }
    .brand-name { flex: 1; font-weight: 700; font-size: 1.05rem; }
    .toggle-btn {
      flex-shrink: 0; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;
      color: #E9D5FF; border-radius: 6px; background: transparent; border: none;
      font-size: 1.25rem; font-family: inherit; cursor: pointer; padding: 0;
    }
    .toggle-btn:hover { background: rgba(255,255,255,0.12); color: #fff; }

    .nav-scroll { flex: 1; overflow-y: auto; overflow-x: hidden; min-height: 0; }
    .section { margin-bottom: 0.6rem; }
    .section-label {
      font-size: 0.68rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
      color: #C4B5FD; padding: 0.5rem 0.6rem 0.3rem; white-space: nowrap;
    }

    .sidebar a, .sidebar .disabled {
      display: flex; align-items: center; gap: 0.75rem;
      color: #E9D5FF; padding: 0.55rem 0.6rem; border-radius: 8px; white-space: nowrap;
    }
    .sidebar a:hover { background: rgba(255,255,255,0.1); color: #fff; text-decoration: none; }
    .sidebar a.active { background: #fff; color: var(--primary-dark); font-weight: 600; }
    .icon { flex-shrink: 0; width: 1.3rem; text-align: center; font-size: 1.05rem; }
    .label { flex: 1; overflow: hidden; text-overflow: ellipsis; }

    .disabled { color: #A896D6; cursor: default; }
    .disabled.locked { color: #C4B5FD; }
    .tag {
      flex-shrink: 0; font-size: 0.65rem; font-weight: 700; letter-spacing: 0.02em;
      padding: 0.1rem 0.4rem; border-radius: 999px; background: rgba(255,255,255,0.1);
    }

    .badge-count {
      flex-shrink: 0; min-width: 1.35rem; text-align: center; padding: 0.05rem 0.35rem;
      border-radius: 999px; background: rgba(255,255,255,0.22); font-size: 0.72rem; font-weight: 700;
    }
    .badge-count.at-risk { background: var(--danger); color: #fff; }

    .spacer { flex: 1; }

    .theme-toggle-inline {
      display: flex; align-items: center; gap: 0.75rem; width: 100%;
      padding: 0.55rem 0.6rem; margin-bottom: 0.4rem; border-radius: 8px; white-space: nowrap;
      background: transparent; border: none; color: #E9D5FF; font: inherit; cursor: pointer; text-align: left;
    }
    .theme-toggle-inline:hover { background: rgba(255,255,255,0.1); color: #fff; }

    .user {
      display: flex; align-items: center; gap: 0.6rem; white-space: nowrap;
      padding: 0.55rem 0.5rem; border-radius: 9px;
      background: rgba(255,255,255,0.08);
      border-top: 1px solid rgba(255,255,255,0.12);
    }
    .avatar {
      flex-shrink: 0; width: 30px; height: 30px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.7rem; font-weight: 700; color: #fff; letter-spacing: 0.03em;
    }
    .user-meta { flex: 1; display: flex; flex-direction: column; min-width: 0; line-height: 1.25; }
    .user-name {
      font-size: 0.82rem; font-weight: 600; color: #fff;
      overflow: hidden; text-overflow: ellipsis;
    }
    .user-role { font-size: 0.72rem; color: #C4B5FD; }
    .signout {
      flex-shrink: 0; width: 28px; height: 28px; padding: 0;
      display: flex; align-items: center; justify-content: center;
      background: transparent; border: none; border-radius: 6px;
      color: #E9D5FF; font-size: 0.95rem; cursor: pointer;
    }
    .signout:hover { background: rgba(255,255,255,0.15); color: #fff; }

    .sidebar.collapsed .brand { justify-content: center; padding: 0; gap: 0; }
    .sidebar.collapsed .brand-name { display: none; width: 0; }
    .sidebar.collapsed .section-label, .sidebar.collapsed .label, .sidebar.collapsed .tag,
    .sidebar.collapsed .badge-count { display: none; }
    .sidebar.collapsed a, .sidebar.collapsed .disabled, .sidebar.collapsed .theme-toggle-inline { justify-content: center; }
    .sidebar.collapsed .user { justify-content: center; padding: 0.55rem 0; }
    .sidebar.collapsed .user-meta, .sidebar.collapsed .signout { display: none; }

    .content {
      flex: 1; padding: 1.5rem 2rem; overflow-y: auto; height: 100vh;
      background: var(--bg); position: relative;
    }

    @media (max-width: 768px) {
      .sidebar { width: 64px; }
      .sidebar .brand-name, .sidebar .section-label, .sidebar .label, .sidebar .tag,
      .sidebar .badge-count, .toggle-btn { display: none; }
      .sidebar .brand { justify-content: center; padding: 0; gap: 0; }
      .sidebar a, .sidebar .disabled, .sidebar .theme-toggle-inline { justify-content: center; }
      .sidebar .user { justify-content: center; padding: 0.55rem 0; }
      .sidebar .user-meta, .sidebar .signout { display: none; }
      .content { padding: 1rem; }
    }
    @media (max-width: 480px) {
      .content { padding: 0.75rem; }
    }
  `]
})
export class AppComponent {
  private auth = inject(AuthService);
  private api = inject(ApiService);
  private router = inject(Router);

  readonly user = this.auth.current;

  private readonly badgeState = signal<NavBadges>({ openTickets: 0, ticketsAtRisk: false });
  readonly badges = this.badgeState.asReadonly();

  /**
   * The sidebar's sections and items resolved against the signed-in persona's capabilities.
   * See nav.model.ts for what "available" / "unavailable" / "locked" mean and why there are three
   * states instead of just showing or hiding each link.
   */
  readonly sections = computed<ResolvedSection[]>(() => {
    const capabilities = this.user()?.capabilities ?? [];
    return NAV_SECTIONS.map((section) => ({
      key: section.key,
      label: section.label,
      items: section.items.map((item) => ({ ...item, state: navState(item, capabilities) })),
    })).filter((section) => section.items.length > 0);
  });

  sidebarCollapsed = false;
  darkMode = false;

  constructor() {
    this.darkMode = localStorage.getItem(DARK_MODE_KEY) === '1';
    this.applyTheme();
    this.sidebarCollapsed = localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';

    // Ticket badge — only for personas who can actually see the Tickets item.
    if ((this.user()?.capabilities ?? []).includes('ticket:view')) {
      this.api.listTickets().subscribe((tickets) => {
        const open = tickets.filter((t) => t.status === 'Open' || t.status === 'Pending').length;
        const atRisk = tickets.some((t) => t.escalated && t.status !== 'Resolved' && t.status !== 'Closed');
        this.badgeState.set({ openTickets: open, ticketsAtRisk: atRisk });
      });
    }
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, this.sidebarCollapsed ? '1' : '0');
  }

  signOut() {
    this.auth.signOut();
    this.router.navigateByUrl('/login');
  }

  toggleDarkMode() {
    this.darkMode = !this.darkMode;
    localStorage.setItem(DARK_MODE_KEY, this.darkMode ? '1' : '0');
    this.applyTheme();
  }

  private applyTheme() {
    document.documentElement.classList.toggle('dark', this.darkMode);
  }
}
