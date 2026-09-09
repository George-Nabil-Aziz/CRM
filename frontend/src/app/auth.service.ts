import { Injectable, signal } from '@angular/core';

/**
 * DEMO AUTHENTICATION — front end only.
 *
 * The API has no authentication of its own: no credential is stored on `User`, no login
 * endpoint exists, and every one of its ~74 endpoints is anonymous. This service exists so
 * the application has a sign-in experience and a sense of "who is looking at this", not to
 * secure anything.
 *
 * Concretely, this is what it is NOT:
 *   - Credentials are compared in the browser, so anyone can read them in the bundle.
 *   - The session is a localStorage flag. Deleting it is the whole bypass.
 *   - No request carries a token, so calling the API directly skips all of this entirely.
 *
 * Replacing it means adding a real credential store and login endpoint on the server and
 * putting `[Authorize]` on the controllers. Until then, treat the roles below as a UI
 * preview of the permission model, nothing more.
 */

export type PersonaId = 'admin' | 'manager' | 'agent' | 'customer';

export interface Persona {
  id: PersonaId;
  username: string;
  password: string;
  displayName: string;
  role: string;
  description: string;
  /** Sidebar routes this persona is offered. Not enforced by the API. */
  routes: string[];
  avatar: string;
  accent: string;
}

/** The four roles the 57 specifications are written against. */
export const PERSONAS: Persona[] = [
  {
    id: 'admin',
    username: 'admin',
    password: 'admin',
    displayName: 'Administrator',
    role: 'Admin',
    description: 'Configures the platform — users, roles, settings, integrations, audit.',
    routes: ['/', '/tickets', '/customers', '/knowledge-base'],
    avatar: 'AD',
    accent: '#6D28D9',
  },
  {
    id: 'manager',
    username: 'manager',
    password: 'manager',
    displayName: 'Support Manager',
    role: 'Manager',
    description: 'Watches workload, SLA performance and escalations across the team.',
    routes: ['/', '/tickets', '/customers', '/knowledge-base'],
    avatar: 'MG',
    accent: '#0E7490',
  },
  {
    id: 'agent',
    username: 'agent',
    password: 'agent',
    displayName: 'Support Agent',
    role: 'Agent',
    description: 'Works the queue — categorise, assign, reply, escalate, resolve.',
    routes: ['/', '/tickets', '/customers', '/knowledge-base'],
    avatar: 'AG',
    accent: '#B45309',
  },
  {
    id: 'customer',
    username: 'customer',
    password: 'customer',
    displayName: 'Customer',
    role: 'Customer',
    description: 'Submits requests, tracks them, and reads the knowledge base.',
    routes: ['/', '/knowledge-base'],
    avatar: 'CU',
    accent: '#15803D',
  },
];

const SESSION_KEY = 'crm-session';

interface StoredSession {
  personaId: PersonaId;
  displayName: string;
  username: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  /** Null when signed out. Components read this via the signal so the shell reacts. */
  readonly current = signal<Persona | null>(null);

  constructor() {
    this.restore();
  }

  get isSignedIn(): boolean {
    return this.current() !== null;
  }

  /** Returns null on success, or a message to show the user. */
  signIn(username: string, password: string): string | null {
    const name = username.trim().toLowerCase();
    const match = PERSONAS.find((p) => p.username === name);

    if (!match || match.password !== password) {
      // Deliberately one message for both cases — do not reveal which half was wrong.
      return 'Incorrect username or password.';
    }

    this.persist(match);
    return null;
  }

  /** Demo sign-up: no account is created anywhere. It signs the visitor in as the customer persona. */
  signUpAsCustomer(displayName: string): void {
    const customer = PERSONAS.find((p) => p.id === 'customer')!;
    this.persist(customer, displayName.trim() || customer.displayName);
  }

  signOut(): void {
    localStorage.removeItem(SESSION_KEY);
    this.current.set(null);
  }

  private persist(persona: Persona, displayNameOverride?: string): void {
    const resolved: Persona = displayNameOverride
      ? { ...persona, displayName: displayNameOverride }
      : persona;

    const session: StoredSession = {
      personaId: resolved.id,
      displayName: resolved.displayName,
      username: resolved.username,
    };

    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
      // Private browsing can refuse writes. The session then lasts until reload,
      // which is acceptable for a demo — do not break sign-in over it.
    }

    this.current.set(resolved);
  }

  private restore(): void {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(SESSION_KEY);
    } catch {
      return;
    }
    if (!raw) return;

    try {
      const session = JSON.parse(raw) as StoredSession;
      const base = PERSONAS.find((p) => p.id === session.personaId);
      if (!base) {
        localStorage.removeItem(SESSION_KEY);
        return;
      }
      this.current.set({ ...base, displayName: session.displayName || base.displayName });
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
  }
}
