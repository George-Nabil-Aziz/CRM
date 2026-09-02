import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

const DARK_MODE_KEY = 'crm-dark-mode';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell">
      <nav class="sidebar" [class.collapsed]="sidebarCollapsed">
        <div class="brand">
          <span class="brand-mark">A</span>
          <span class="brand-name">Azm CRM</span>
          <button class="toggle-btn" type="button" (click)="sidebarCollapsed = !sidebarCollapsed" [title]="sidebarCollapsed ? 'Expand' : 'Collapse'">
            {{ sidebarCollapsed ? '»' : '«' }}
          </button>
        </div>
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" title="Dashboard">
          <span class="icon">📊</span><span class="label">Dashboard</span>
        </a>
        <a routerLink="/tickets" routerLinkActive="active" title="Tickets">
          <span class="icon">🎫</span><span class="label">Tickets</span>
        </a>
        <a routerLink="/customers" routerLinkActive="active" title="Customers">
          <span class="icon">👥</span><span class="label">Customers</span>
        </a>
        <a routerLink="/knowledge-base" routerLinkActive="active" title="Knowledge Base">
          <span class="icon">📚</span><span class="label">Knowledge Base</span>
        </a>
      </nav>
      <main class="content">
        <button class="theme-toggle" type="button" (click)="toggleDarkMode()" [title]="darkMode ? 'Switch to light mode' : 'Switch to dark mode'">
          {{ darkMode ? '☀️' : '🌙' }}
        </button>
        <router-outlet />
      </main>
    </div>
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
    .sidebar.collapsed .brand { justify-content: center; padding: 0; gap: 0; }
    .sidebar.collapsed .brand-name { display: none; width: 0; }
    .sidebar.collapsed .label { display: none; }
    .sidebar.collapsed a { justify-content: center; }
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
  `]
})
export class AppComponent {
  sidebarCollapsed = false;
  darkMode = false;

  constructor() {
    this.darkMode = localStorage.getItem(DARK_MODE_KEY) === '1';
    this.applyTheme();
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
