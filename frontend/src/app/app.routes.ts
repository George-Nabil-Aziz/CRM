import { Routes } from '@angular/router';
import { DashboardPage } from './pages/dashboard.page';
import { CustomersPage } from './pages/customers.page';
import { CustomerDetailPage } from './pages/customer-detail.page';
import { TicketsPage } from './pages/tickets.page';
import { TicketDetailPage } from './pages/ticket-detail.page';
import { KnowledgeBasePage } from './pages/knowledge-base.page';

export const routes: Routes = [
  { path: '', component: DashboardPage },
  { path: 'customers', component: CustomersPage },
  { path: 'customers/:id', component: CustomerDetailPage },
  { path: 'tickets', component: TicketsPage },
  { path: 'tickets/:id', component: TicketDetailPage },
  { path: 'knowledge-base', component: KnowledgeBasePage },
  { path: '**', redirectTo: '' }
];
