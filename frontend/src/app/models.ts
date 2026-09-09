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

// --- Agent workspace (stories 17-21) ---

export interface QuickReply {
  id: string;
  title: string;
  body: string;
  category: string;
}

export interface Reminder {
  id: string;
  ticketId: string;
  agentId: string;
  dueAt: string;
  note: string;
  dismissed: boolean;
}

export interface InternalNote {
  id: string;
  ticketId: string;
  authorId: string;
  text: string;
  mentions: string[];
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  ticketId: string | null;
  type: string;
  message: string;
  read: boolean;
  sentAt: string;
}

// --- Security & administration (stories 45-48) ---

export interface Role {
  id: string;
  name: string;
  permissions: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  roleId: string;
  roleName: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  actorId: string | null;
  action: string;
  targetType: string;
  targetId: string;
  timestamp: string;
}

export interface SystemSetting {
  key: string;
  value: string;
}

// --- Reports (stories 40-44) ---

export interface TicketReportEntry {
  group: string;
  count: number;
}

export interface SlaPerformanceEntry {
  category: string;
  priority: string;
  total: number;
  metTarget: number;
  compliancePercent: number;
}

export interface AgentPerformanceEntry {
  agentId: string;
  agentName: string;
  ticketCount: number;
  averageResolutionHours: number;
}

export interface CsatReport {
  responseCount: number;
  averageRating: number;
  percentSatisfied: number;
}

/** Shared by every reports endpoint — all of them accept an optional date window. */
export interface DateRange {
  dateFrom?: string;
  dateTo?: string;
}

// --- Customer portal (stories 35-39) ---

export interface Feedback {
  id: string;
  ticketId: string;
  rating: number;
  comment: string | null;
  submittedAt: string;
}

export interface ArticleSummary {
  id: string;
  title: string;
  category: string;
  type: string;
}

// --- SLA & automation (stories 22-25) ---

export interface SlaRule {
  id: string;
  category: TicketCategory;
  priority: TicketPriority;
  responseTargetMinutes: number;
  resolutionTargetMinutes: number;
}

export interface AssignmentRule {
  id: string;
  category: TicketCategory | null;
  targetAgentId: string;
  order: number;
}

// --- Platform (stories 55-57) ---

export interface Department {
  id: string;
  name: string;
}

export interface Branch {
  id: string;
  name: string;
  location: string;
}

export interface Branding {
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
}
