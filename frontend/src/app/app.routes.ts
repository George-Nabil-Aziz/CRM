import { Routes } from '@angular/router';
import { DashboardPage } from './pages/dashboard.page';
import { CustomersPage } from './pages/customers.page';
import { CustomerDetailPage } from './pages/customer-detail.page';
import { TicketsPage } from './pages/tickets.page';
import { TicketDetailPage } from './pages/ticket-detail.page';
import { KnowledgeBasePage } from './pages/knowledge-base.page';
import { LoginPage } from './pages/login.page';
import { SignupPage } from './pages/signup.page';
import { authGuard, guestGuard } from './auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginPage, canActivate: [guestGuard] },
  { path: 'signup', component: SignupPage, canActivate: [guestGuard] },

  { path: '', component: DashboardPage, canActivate: [authGuard] },
  { path: 'customers', component: CustomersPage, canActivate: [authGuard] },
  { path: 'customers/:id', component: CustomerDetailPage, canActivate: [authGuard] },
  { path: 'tickets', component: TicketsPage, canActivate: [authGuard] },
  { path: 'tickets/:id', component: TicketDetailPage, canActivate: [authGuard] },
  { path: 'knowledge-base', component: KnowledgeBasePage, canActivate: [authGuard] },

  { path: '**', redirectTo: '' }
];
