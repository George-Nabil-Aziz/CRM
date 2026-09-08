/**
 * Sidebar as data, not markup.
 *
 * The shell (`app.component.ts`) renders this list — it never hardcodes a nav item. That keeps
 * grouping, permission checks and "not built yet" placeholders driven from one source instead of
 * duplicated between a template and a filter function.
 *
 * Every leaf resolves to one of three states, not two:
 *   - "available"   — routed and the signed-in persona has the capability. A normal link.
 *   - "unavailable" — the screen itself doesn't exist yet (`available: false`). Shown disabled
 *                      with a "Coming soon" tag, never as locked — telling someone they lack
 *                      permission for a screen that was never built would send them chasing
 *                      an access request that can't be granted.
 *   - "locked"      — the screen exists but this persona's capabilities don't include it. Shown
 *                      with a 🔒, still visible rather than hidden, so people can see what exists
 *                      elsewhere in the product and know to ask for access to it.
 */

export type NavState = 'available' | 'unavailable' | 'locked';

export interface NavLeaf {
  path: string;
  icon: string;
  label: string;
  exact?: boolean;
  /** Capability key checked against the signed-in persona's `capabilities`. Omit for "everyone". */
  capability?: string;
  /** Set to false while the screen behind `path` hasn't been built yet. */
  available?: boolean;
  /** Key into NavBadges — a live count rendered on this item, e.g. open ticket count. */
  badge?: keyof NavBadges;
}

export interface NavSection {
  key: string;
  label: string;
  items: NavLeaf[];
}

export interface NavBadges {
  openTickets: number;
  ticketsAtRisk: boolean;
}

export const NAV_SECTIONS: NavSection[] = [
  {
    key: 'workspace',
    label: 'Workspace',
    items: [
      { path: '/', icon: '📊', label: 'Dashboard', exact: true },
    ],
  },
  {
    key: 'tickets',
    label: 'Tickets',
    items: [
      { path: '/tickets', icon: '🎫', label: 'Tickets', capability: 'ticket:view', badge: 'openTickets' },
    ],
  },
  {
    key: 'customers',
    label: 'Customers',
    items: [
      { path: '/customers', icon: '👥', label: 'Customers', capability: 'customer:view' },
    ],
  },
  {
    key: 'knowledge',
    label: 'Knowledge',
    items: [
      { path: '/knowledge-base', icon: '📚', label: 'Knowledge Base', capability: 'article:view' },
      { path: '/assistant', icon: '🤖', label: 'AI Assistant', capability: 'article:view' },
    ],
  },
  {
    key: 'analytics',
    label: 'Analytics',
    items: [
      { path: '/team', icon: '🧭', label: 'Team', capability: 'report:view' },
    ],
  },
  {
    key: 'administration',
    label: 'Administration',
    items: [
      { path: '/admin/users', icon: '🛡️', label: 'Users', capability: 'user:manage', available: false },
      { path: '/admin/departments', icon: '🏷️', label: 'Departments', capability: 'department:manage', available: false },
      { path: '/admin/sla', icon: '⏱️', label: 'SLA Policies', capability: 'sla:manage', available: false },
    ],
  },
  {
    key: 'account',
    label: 'Account',
    items: [
      { path: '/settings', icon: '⚙️', label: 'Settings', available: false },
    ],
  },
];

export function navState(item: NavLeaf, capabilities: string[]): NavState {
  if (item.available === false) return 'unavailable';
  if (item.capability && !capabilities.includes(item.capability)) return 'locked';
  return 'available';
}
