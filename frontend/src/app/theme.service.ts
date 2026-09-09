import { Injectable, signal } from '@angular/core';

const DARK_MODE_KEY = 'crm-dark-mode';

/**
 * Dark mode, shared by the signed-in shell and the signed-out auth pages.
 *
 * It lives in a service rather than on AppComponent because /login and /signup render outside
 * the shell — a toggle owned by the shell simply isn't on the page there.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly dark = signal(false);

  /** Read this in templates to label the toggle. */
  readonly isDark = this.dark.asReadonly();

  constructor() {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(DARK_MODE_KEY);
    } catch {
      // Private browsing can refuse reads. Fall through to the light default.
    }
    this.dark.set(stored === '1');
    this.apply();
  }

  toggle(): void {
    this.dark.update((on) => !on);
    try {
      localStorage.setItem(DARK_MODE_KEY, this.dark() ? '1' : '0');
    } catch {
      // The preference then lasts until reload, which is better than failing the click.
    }
    this.apply();
  }

  private apply(): void {
    document.documentElement.classList.toggle('dark', this.dark());
  }
}
