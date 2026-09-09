import { Injectable, signal } from '@angular/core';
import { Lang, TRANSLATIONS } from './translations';

const LANG_KEY = 'crm-lang';

/**
 * Off until the Arabic strings are finished.
 *
 * While this is false the switcher is hidden and the app is pinned to English — a stored 'ar'
 * from an earlier session is ignored, so nobody ends up in a half-translated RTL layout with no
 * way back. Flip it to true once every page reads its text through `t()`.
 */
export const LANGUAGE_SWITCHER_ENABLED = false;

/**
 * Language and text direction.
 *
 * Switching language also flips `dir` on <html>, which is what drives the RTL layout — the
 * stylesheets use logical properties (inline-start/inline-end) rather than left/right, so the
 * whole app mirrors from this one attribute instead of a parallel set of RTL rules.
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly lang = signal<Lang>('en');

  /** Read in templates so views re-render on a language change. */
  readonly current = this.lang.asReadonly();

  readonly switcherEnabled = LANGUAGE_SWITCHER_ENABLED;

  constructor() {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(LANG_KEY);
    } catch {
      // Private browsing can refuse reads; English is the fallback.
    }
    this.lang.set(LANGUAGE_SWITCHER_ENABLED && stored === 'ar' ? 'ar' : 'en');
    this.apply();
  }

  get isRtl(): boolean {
    return this.lang() === 'ar';
  }

  /** Looks up a key in the active language, falling back to English, then to the key itself. */
  t(key: string): string {
    const active = TRANSLATIONS[this.lang()];
    return active[key] ?? TRANSLATIONS.en[key] ?? key;
  }

  toggle(): void {
    this.setLang(this.lang() === 'en' ? 'ar' : 'en');
  }

  setLang(lang: Lang): void {
    this.lang.set(lang);
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      // The choice then lasts until reload rather than failing the click.
    }
    this.apply();
  }

  private apply(): void {
    const el = document.documentElement;
    el.lang = this.lang();
    el.dir = this.isRtl ? 'rtl' : 'ltr';
  }
}
