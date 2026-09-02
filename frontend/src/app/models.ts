export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string | null;
  createdAt: string;
}

export interface InteractionEntry {
  id: string;
  type: string;
  ticketId: string | null;
  timestamp: string;
  summary: string;
}

export interface Note {
  id: string;
  customerId: string;
  authorId: string | null;
  text: string;
  attachmentUrl: string | null;
  createdAt: string;
}

export type TicketStatus = 'Open' | 'Pending' | 'Resolved' | 'Closed';
export type TicketCategory = 'Billing' | 'Technical' | 'Account' | 'General' | 'FeatureRequest';
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface Ticket {
  id: string;
  ticketNumber: string;
  customerId: string;
  subject: string;
  status: TicketStatus;
  category: TicketCategory;
  priority: TicketPriority;
  assignedAgentId: string | null;
  escalated: boolean;
  escalatedAt: string | null;
  escalationReason: string | null;
  createdAt: string;
}

export interface TicketEvent {
  id: string;
  type: string;
  actorId: string | null;
  timestamp: string;
  details: string;
}

export interface Message {
  id: string;
  ticketId: string;
  channel: string;
  from: string;
  body: string;
  sentAt: string;
}

export interface Article {
  id: string;
  title: string;
  body?: string;
  category: string;
  type: string;
  published?: boolean;
  viewCount?: number;
}

export interface DashboardResponse {
  ticketsByStatus: { group: string; count: number }[];
  slaPerformance: { category: string; priority: string; total: number; metTarget: number; compliancePercent: number }[];
  agentPerformance: { agentId: string; agentName: string; ticketCount: number; averageResolutionHours: number }[];
  csat: { responseCount: number; averageRating: number; percentSatisfied: number };
}
