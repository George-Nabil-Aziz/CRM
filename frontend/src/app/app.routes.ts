import { Routes } from '@angular/router';
import { DashboardPage } from './pages/dashboard.page';
import { LoginPage } from './pages/login.page';
import { authGuard, guestGuard } from './auth.guard';

/**
 * Only the shell's landing page and the sign-in screen are bundled up front. Everything else is
 * loaded on navigation — several of these screens (administration, reports, automation) are used
 * rarely and by few roles, so shipping them in the initial bundle costs every visitor for nothing.
 */
export const routes: Routes = [
  { path: 'login', component: LoginPage, canActivate: [guestGuard] },
  {
    path: 'signup',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/signup.page').then((m) => m.SignupPage),
  },

  { path: '', component: DashboardPage, canActivate: [authGuard] },
  {
    path: 'customers',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/customers.page').then((m) => m.CustomersPage),
  },
  {
    path: 'customers/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/customer-detail.page').then((m) => m.CustomerDetailPage),
  },
  {
    path: 'tickets',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/tickets.page').then((m) => m.TicketsPage),
  },
  {
    path: 'tickets/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/ticket-detail.page').then((m) => m.TicketDetailPage),
  },
  {
    path: 'knowledge-base',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/knowledge-base.page').then((m) => m.KnowledgeBasePage),
  },
  {
    path: 'workspace',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/agent-workspace.page').then((m) => m.AgentWorkspacePage),
  },
  {
    path: 'reports',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/reports.page').then((m) => m.ReportsPage),
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/admin.page').then((m) => m.AdminPage),
  },
  {
    path: 'portal',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/portal.page').then((m) => m.PortalPage),
  },
  {
    path: 'automation',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/automation.page').then((m) => m.AutomationPage),
  },
  {
    path: 'channels',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/channels.page').then((m) => m.ChannelsPage),
  },
  {
    path: 'organisation',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/organisation.page').then((m) => m.OrganisationPage),
  },

  { path: '**', redirectTo: '' }
];
