import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AgentPerformanceEntry, Article, ArticleSummary, AssignmentRule, AuditLogEntry, Branch, Branding,
  CsatReport, Customer, DashboardResponse, DateRange, Department, Feedback, InteractionEntry,
  InternalNote, Message, Notification, Note, QuickReply, Reminder, Role, SlaPerformanceEntry,
  SlaRule, SystemSetting, Ticket, TicketEvent, TicketReportEntry, User
} from './models';

/** Drops undefined/empty entries so optional filters don't go out as `?dateFrom=`. */
function params(source: Record<string, string | number | boolean | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(source)) {
    if (value !== undefined && value !== '') out[key] = String(value);
  }
  return out;
}

const BASE = 'http://localhost:5110/api';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  // Customers (stories 01-04)
  listCustomers(q?: string): Observable<Customer[]> {
    return this.http.get<Customer[]>(`${BASE}/customers`, { params: q ? { q } : {} });
  }
  getCustomer(id: string): Observable<Customer> {
    return this.http.get<Customer>(`${BASE}/customers/${id}`);
  }
  createCustomer(body: { name: string; email: string; phone: string }): Observable<Customer> {
    return this.http.post<Customer>(`${BASE}/customers`, body);
  }
  updateCustomer(id: string, body: Partial<{ phone: string; email: string; address: string }>): Observable<Customer> {
    return this.http.patch<Customer>(`${BASE}/customers/${id}`, body);
  }
  getCustomerHistory(id: string): Observable<InteractionEntry[]> {
    return this.http.get<InteractionEntry[]>(`${BASE}/customers/${id}/history`);
  }
  addNote(id: string, body: { text: string; attachmentUrl?: string }): Observable<Note> {
    return this.http.post<Note>(`${BASE}/customers/${id}/notes`, body);
  }

  // Tickets (stories 05-10)
  listTickets(status?: string): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${BASE}/tickets`, { params: status ? { status } : {} });
  }
  createTicket(body: { customerId: string; subject: string; category: string; priority: string }): Observable<Ticket> {
    return this.http.post<Ticket>(`${BASE}/tickets`, body);
  }
  updateTicketCategoryPriority(id: string, body: Partial<{ category: string; priority: string }>): Observable<Ticket> {
    return this.http.patch<Ticket>(`${BASE}/tickets/${id}`, body);
  }
  assignTicket(id: string, agentId: string): Observable<Ticket> {
    return this.http.post<Ticket>(`${BASE}/tickets/${id}/assign`, { agentId });
  }
  updateTicketStatus(id: string, status: string): Observable<Ticket> {
    return this.http.patch<Ticket>(`${BASE}/tickets/${id}/status`, { status });
  }
  escalateTicket(id: string, reason: string): Observable<Ticket> {
    return this.http.post<Ticket>(`${BASE}/tickets/${id}/escalate`, { reason });
  }
  getTicketHistory(id: string): Observable<TicketEvent[]> {
    return this.http.get<TicketEvent[]>(`${BASE}/tickets/${id}/history`);
  }
  getTicketMessages(id: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${BASE}/tickets/${id}/messages`);
  }

  // Agent dashboard (stories 17-21)
  getAssignedTickets(agentId: string, filters: { status?: string; priority?: string } = {}): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${BASE}/agents/me/tickets`, {
      params: params({ agentId, ...filters }),
    });
  }
  listQuickReplies(category?: string): Observable<QuickReply[]> {
    return this.http.get<QuickReply[]>(`${BASE}/quick-replies`, { params: params({ category }) });
  }
  createQuickReply(body: { title: string; body: string; category: string }): Observable<QuickReply> {
    return this.http.post<QuickReply>(`${BASE}/quick-replies`, body);
  }
  getReminders(ticketId: string, includeDismissed = false): Observable<Reminder[]> {
    return this.http.get<Reminder[]>(`${BASE}/tickets/${ticketId}/reminders`, {
      params: params({ includeDismissed }),
    });
  }
  addReminder(ticketId: string, body: { agentId: string; dueAt: string; note: string }): Observable<Reminder> {
    return this.http.post<Reminder>(`${BASE}/tickets/${ticketId}/reminders`, body);
  }
  dismissReminder(ticketId: string, reminderId: string): Observable<void> {
    return this.http.post<void>(`${BASE}/tickets/${ticketId}/reminders/${reminderId}/dismiss`, {});
  }
  getInternalNotes(ticketId: string): Observable<InternalNote[]> {
    return this.http.get<InternalNote[]>(`${BASE}/tickets/${ticketId}/internal-notes`);
  }
  listNotifications(userId: string, unreadOnly = false): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${BASE}/notifications`, { params: params({ userId, unreadOnly }) });
  }
  markNotificationRead(id: string): Observable<void> {
    return this.http.post<void>(`${BASE}/notifications/${id}/read`, {});
  }
  getTicketContext(id: string): Observable<{ ticket: Ticket; customer: Customer }> {
    return this.http.get<{ ticket: Ticket; customer: Customer }>(`${BASE}/tickets/${id}/context`);
  }
  addInternalNote(id: string, body: { text: string; authorId: string; mentionedUserIds?: string[] }): Observable<unknown> {
    return this.http.post(`${BASE}/tickets/${id}/internal-notes`, body);
  }

  // Knowledge base (stories 26-29)
  browseFaqs(): Observable<Article[]> {
    return this.http.get<Article[]>(`${BASE}/kb/faqs`);
  }
  searchKb(q: string): Observable<Article[]> {
    return this.http.get<Article[]>(`${BASE}/kb/search`, { params: { q } });
  }
  getArticle(id: string): Observable<Article> {
    return this.http.get<Article>(`${BASE}/kb/articles/${id}`);
  }

  // AI (stories 30-34)
  getSummary(id: string): Observable<{ summaryText: string }> {
    return this.http.get<{ summaryText: string }>(`${BASE}/tickets/${id}/ai/summary`);
  }
  getSuggestedReply(id: string): Observable<{ suggestedText: string }> {
    return this.http.post<{ suggestedText: string }>(`${BASE}/tickets/${id}/ai/suggest-reply`, {});
  }
  chatbotMessage(message: string, sessionId?: string): Observable<{ sessionId: string; reply: string; handedOff: boolean }> {
    return this.http.post<{ sessionId: string; reply: string; handedOff: boolean }>(`${BASE}/chatbot/message`, { message, sessionId });
  }

  // Reports (stories 40-44)
  getDashboard(range: DateRange = {}): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(`${BASE}/reports/dashboard`, { params: params({ ...range }) });
  }
  getTicketReport(range: DateRange = {}, groupBy: 'status' | 'category' | 'date' = 'status'): Observable<TicketReportEntry[]> {
    return this.http.get<TicketReportEntry[]>(`${BASE}/reports/tickets`, { params: params({ ...range, groupBy }) });
  }
  getSlaReport(range: DateRange = {}): Observable<SlaPerformanceEntry[]> {
    return this.http.get<SlaPerformanceEntry[]>(`${BASE}/reports/sla`, { params: params({ ...range }) });
  }
  getAgentReport(range: DateRange = {}): Observable<AgentPerformanceEntry[]> {
    return this.http.get<AgentPerformanceEntry[]>(`${BASE}/reports/agents`, { params: params({ ...range }) });
  }
  getCsatReport(range: DateRange = {}): Observable<CsatReport> {
    return this.http.get<CsatReport>(`${BASE}/reports/csat`, { params: params({ ...range }) });
  }

  // Security & administration (stories 45-48)
  listUsers(filters: { roleId?: string; q?: string } = {}): Observable<User[]> {
    return this.http.get<User[]>(`${BASE}/users`, { params: params({ ...filters }) });
  }
  createUser(body: { name: string; email: string; roleId: string }): Observable<User> {
    return this.http.post<User>(`${BASE}/users`, body);
  }
  listRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${BASE}/roles`);
  }
  createRole(body: { name: string; permissions: string[] }): Observable<Role> {
    return this.http.post<Role>(`${BASE}/roles`, body);
  }
  updateRolePermissions(id: string, permissions: string[]): Observable<Role> {
    return this.http.patch<Role>(`${BASE}/roles/${id}/permissions`, { permissions });
  }
  listAuditLogs(filters: { actorId?: string; targetType?: string } & DateRange = {}): Observable<AuditLogEntry[]> {
    return this.http.get<AuditLogEntry[]>(`${BASE}/audit-logs`, { params: params({ ...filters }) });
  }
  getSetting(key: string): Observable<SystemSetting> {
    return this.http.get<SystemSetting>(`${BASE}/settings/${key}`);
  }
  upsertSetting(key: string, value: string): Observable<SystemSetting> {
    return this.http.patch<SystemSetting>(`${BASE}/settings`, { key, value });
  }

  // Customer portal (stories 35-39)
  portalCreateTicket(body: { customerId: string; subject: string; category: string; description: string }): Observable<Ticket> {
    return this.http.post<Ticket>(`${BASE}/portal/tickets`, body);
  }
  portalListTickets(customerId: string, status?: string): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${BASE}/portal/tickets`, { params: params({ customerId, status }) });
  }
  portalBrowseKb(q?: string): Observable<ArticleSummary[]> {
    return this.http.get<ArticleSummary[]>(`${BASE}/portal/kb`, { params: params({ q }) });
  }
  portalSubmitFeedback(ticketId: string, body: { rating: number; comment?: string }): Observable<Feedback> {
    return this.http.post<Feedback>(`${BASE}/portal/tickets/${ticketId}/feedback`, body);
  }

  // SLA & automation (stories 22-25)
  listSlaRules(): Observable<SlaRule[]> {
    return this.http.get<SlaRule[]>(`${BASE}/sla-rules`);
  }
  createSlaRule(body: { category: string; priority: string; responseTargetMinutes: number; resolutionTargetMinutes: number }): Observable<SlaRule> {
    return this.http.post<SlaRule>(`${BASE}/sla-rules`, body);
  }
  listAssignmentRules(): Observable<AssignmentRule[]> {
    return this.http.get<AssignmentRule[]>(`${BASE}/assignment-rules`);
  }
  createAssignmentRule(body: { category: string | null; targetAgentId: string; order: number }): Observable<AssignmentRule> {
    return this.http.post<AssignmentRule>(`${BASE}/assignment-rules`, body);
  }

  // Channels (stories 11-15)
  inboundEmail(body: { from: string; subject: string; body: string }): Observable<Message> {
    return this.http.post<Message>(`${BASE}/channels/email/inbound`, body);
  }
  inboundWhatsapp(body: { from: string; body: string }): Observable<Message> {
    return this.http.post<Message>(`${BASE}/channels/whatsapp/inbound`, body);
  }
  inboundSms(body: { from: string; body: string }): Observable<Message> {
    return this.http.post<Message>(`${BASE}/channels/sms/inbound`, body);
  }
  submitWebForm(body: { name: string; email: string; subject: string; message: string }): Observable<Message> {
    return this.http.post<Message>(`${BASE}/channels/webform`, body);
  }
  sendChatMessage(body: { from: string; body: string }): Observable<Message> {
    return this.http.post<Message>(`${BASE}/channels/chat/messages`, body);
  }

  // Platform: departments, branches, branding (stories 55-57)
  listDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(`${BASE}/departments`);
  }
  createDepartment(name: string): Observable<Department> {
    return this.http.post<Department>(`${BASE}/departments`, { name });
  }
  listBranches(): Observable<Branch[]> {
    return this.http.get<Branch[]>(`${BASE}/branches`);
  }
  createBranch(body: { name: string; location: string }): Observable<Branch> {
    return this.http.post<Branch>(`${BASE}/branches`, body);
  }
  getBranding(): Observable<Branding> {
    return this.http.get<Branding>(`${BASE}/settings/branding`);
  }
  updateBranding(body: Partial<{ logoUrl: string; primaryColor: string; secondaryColor: string }>): Observable<Branding> {
    return this.http.patch<Branding>(`${BASE}/settings/branding`, body);
  }
}
