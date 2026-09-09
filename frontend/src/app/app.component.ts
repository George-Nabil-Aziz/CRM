import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './auth.service';

const DARK_MODE_KEY = 'crm-dark-mode';

interface NavItem {
  path: string;
  icon: string;
  label: string;
  exact?: boolean;
}

const NAV: NavItem[] = [
  { path: '/', icon: '📊', label: 'Dashboard', exact: true },
  { path: '/tickets', icon: '🎫', label: 'Tickets' },
  { path: '/customers', icon: '👥', label: 'Customers' },
  { path: '/knowledge-base', icon: '📚', label: 'Knowledge Base' },
];

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
            <button class="toggle-btn" type="button" (click)="sidebarCollapsed = !sidebarCollapsed" [title]="sidebarCollapsed ? 'Expand' : 'Collapse'">
              {{ sidebarCollapsed ? '»' : '«' }}
            </button>
          </div>

          @for (item of nav(); track item.path) {
            <a [routerLink]="item.path" routerLinkActive="active"
               [routerLinkActiveOptions]="{ exact: !!item.exact }" [title]="item.label">
              <span class="icon">{{ item.icon }}</span><span class="label">{{ item.label }}</span>
            </a>
          }

          <div class="spacer"></div>

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
          <button class="theme-toggle" type="button" (click)="toggleDarkMode()" [title]="darkMode ? 'Switch to light mode' : 'Switch to dark mode'">
            {{ darkMode ? '☀️' : '🌙' }}
          </button>
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
      width: 220px; flex-shrink: 0; display: flex; flex-direction: column; gap: 0.2rem;
      background: linear-gradient(180deg, var(--primary-dark), #3B1670);
      color: #fff; padding: 1.1rem 0.75rem; transition: width 0.18s ease;
      overflow: hidden;
    }
    .sidebar.collapsed { width: 72px; }
    .brand {
      display: flex; align-items: center; gap: 0.6rem;
      margin-bottom: 1.25rem; padding: 0 0.35rem; white-space: nowrap;
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
    .sidebar a {
      display: flex; align-items: center; gap: 0.75rem;
      color: #E9D5FF; padding: 0.55rem 0.6rem; border-radius: 8px; white-space: nowrap;
    }
    .sidebar a:hover { background: rgba(255,255,255,0.1); color: #fff; text-decoration: none; }
    .sidebar a.active { background: #fff; color: var(--primary-dark); font-weight: 600; }
    .icon { flex-shrink: 0; width: 1.3rem; text-align: center; font-size: 1.05rem; }

    .spacer { flex: 1; }

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
    .sidebar.collapsed .label { display: none; }
    .sidebar.collapsed a { justify-content: center; }
    .sidebar.collapsed .user { justify-content: center; padding: 0.55rem 0; }
    .sidebar.collapsed .user-meta, .sidebar.collapsed .signout { display: none; }

    .content {
      flex: 1; padding: 1.5rem 2rem; overflow-y: auto; height: 100vh;
      background: var(--bg); position: relative;
    }
    .theme-toggle {
      position: absolute; top: 1.1rem; right: 1.5rem; z-index: 5;
      width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
      background: var(--card); border: 1px solid var(--border); border-radius: 50%;
      font-size: 1.1rem; cursor: pointer;
    }
    .theme-toggle:hover { border-color: var(--primary); }

    @media (max-width: 768px) {
      .sidebar { width: 64px; }
      .sidebar .brand-name, .sidebar .label, .toggle-btn { display: none; }
      .sidebar .brand { justify-content: center; padding: 0; gap: 0; }
      .sidebar a { justify-content: center; }
      .sidebar .user { justify-content: center; padding: 0.55rem 0; }
      .sidebar .user-meta, .sidebar .signout { display: none; }
      .content { padding: 1rem; }
      .theme-toggle { top: 0.75rem; right: 0.75rem; }
    }
    @media (max-width: 480px) {
      .content { padding: 0.75rem; }
    }
  `]
})
export class AppComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly user = this.auth.current;

  /** Only the routes this persona is offered. Not enforced by the API — see auth.service.ts. */
  readonly nav = computed(() => {
    const allowed = this.user()?.routes ?? [];
    return NAV.filter((item) => allowed.includes(item.path));
  });

  sidebarCollapsed = false;
  darkMode = false;

  constructor() {
    this.darkMode = localStorage.getItem(DARK_MODE_KEY) === '1';
    this.applyTheme();
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
