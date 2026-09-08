import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Article, Customer, DashboardResponse, InteractionEntry, Message, Note, Ticket, TicketEvent
} from './models';

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
  getAssignedTickets(agentId: string): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${BASE}/agents/me/tickets`, { params: { agentId } });
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
  getDashboard(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(`${BASE}/reports/dashboard`);
  }
}
