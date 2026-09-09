import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, PERSONAS, Persona } from '../auth.service';
import { ThemeService } from '../theme.service';
import { I18nService } from '../i18n/i18n.service';

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="page-tools">
        @if (i18n.switcherEnabled) {
          <button
            class="tool lang"
            type="button"
            (click)="i18n.toggle()"
            [title]="i18n.t('shell.languageTitle')"
          >
            {{ i18n.t('shell.language') }}
          </button>
        }
        <button
          class="tool"
          type="button"
          (click)="theme.toggle()"
          [title]="theme.isDark() ? i18n.t('shell.toLight') : i18n.t('shell.toDark')"
        >
          {{ theme.isDark() ? '☀️' : '🌙' }}
        </button>
      </div>

      <div class="auth-card">
        <!-- Left: the form -->
        <section class="pane form-pane">
          <div class="brand">
            <span class="brand-mark">A</span>
            <span class="brand-name">{{ i18n.t('app.name') }}</span>
          </div>

          <h1>{{ i18n.t('auth.welcomeBack') }}</h1>
          <p class="sub">{{ i18n.t('auth.signInSub') }}</p>

          <form (ngSubmit)="submit()" #f="ngForm">
            <label for="username">{{ i18n.t('auth.username') }}</label>
            <input
              id="username"
              name="username"
              autocomplete="username"
              [placeholder]="i18n.t('auth.username')"
              [(ngModel)]="username"
              [class.invalid]="error"
              (ngModelChange)="error = ''"
            />

            <label for="password">{{ i18n.t('auth.password') }}</label>
            <div class="password-row">
              <input
                id="password"
                name="password"
                autocomplete="current-password"
                [type]="showPassword ? 'text' : 'password'"
                [placeholder]="i18n.t('auth.password')"
                [(ngModel)]="password"
                [class.invalid]="error"
                (ngModelChange)="error = ''"
              />
              <button
                type="button"
                class="peek"
                (click)="showPassword = !showPassword"
                [title]="showPassword ? i18n.t('auth.hidePassword') : i18n.t('auth.showPassword')"
              >
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </div>

            @if (error) {
              <p class="error" role="alert">{{ error }}</p>
            }

            <button
              class="btn submit"
              type="submit"
              [disabled]="!username || !password"
            >
              {{ i18n.t('auth.signIn') }}
            </button>
          </form>

          <p class="alt">
            {{ i18n.t('auth.noAccount') }}
            <a routerLink="/signup">{{ i18n.t('auth.createOne') }}</a>
          </p>
        </section>

        <!-- Right: pick a persona -->
        <section class="pane persona-pane">
          <h2>{{ i18n.t('auth.fillWith') }}</h2>
          <p class="sub">{{ i18n.t('auth.fillWithSub') }}</p>

          <div class="personas">
            @for (p of personas; track p.id) {
              <button
                type="button"
                class="persona"
                [class.selected]="username === p.username"
                [style.--accent]="p.accent"
                (click)="usePersona(p)"
              >
                <span class="avatar">{{ p.avatar }}</span>
                <span class="meta">
                  <span class="name">{{ p.displayName }}</span>
                  <span class="desc">{{ p.description }}</span>
                  <code class="creds">{{ p.username }} / {{ p.password }}</code>
                </span>
              </button>
            }
          </div>

          <p class="notice">
            <strong>{{ i18n.t('auth.demoOnly') }}</strong> {{ i18n.t('auth.demoNotice') }}
          </p>
        </section>
      </div>
    </div>
  `,
  styles: [
    `
      /*
       * height, not min-height: global styles set overflow hidden on html and body, so a
       * container taller than the viewport gets clipped with no way to reach the rest. Pinning
       * it to the viewport gives its own overflow-y something to scroll.
       *
       * Centring uses an auto margin on the card rather than align-items center, because a
       * centred flex item that outgrows its container overflows equally in both directions and
       * the top scrolls out of reach. Auto margins collapse to zero instead.
       */
      .auth-page {
        position: relative;
        height: 100vh;
        display: flex;
        justify-content: center;
        padding: 1.5rem;
        overflow-y: auto;
        background:
          radial-gradient(
            1100px 600px at 8% -10%,
            rgba(109, 40, 217, 0.22),
            transparent 60%
          ),
          radial-gradient(
            900px 500px at 105% 110%,
            rgba(14, 116, 144, 0.2),
            transparent 55%
          ),
          var(--bg);
      }
      .page-tools {
        position: absolute;
        top: 1.25rem;
        inset-inline-end: 1.5rem;
        z-index: 5;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .tool {
        height: 38px;
        min-width: 38px;
        padding: 0 0.6rem;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 999px;
        font: inherit;
        font-size: 1.05rem;
        color: var(--text);
        cursor: pointer;
      }
      .tool.lang {
        font-size: 0.82rem;
        font-weight: 600;
      }
      .tool:hover {
        border-color: var(--primary);
      }

      .auth-card {
        margin: auto;
        display: grid;
        grid-template-columns: 1fr 1fr;
        width: 100%;
        max-width: 940px;
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 18px 50px rgba(0, 0, 0, 0.13);
      }
      .pane {
        padding: 2.25rem 2.25rem 2rem;
      }
      .form-pane {
        display: flex;
        flex-direction: column;
      }
      .persona-pane {
        background: linear-gradient(
          160deg,
          rgba(109, 40, 217, 0.06),
          rgba(14, 116, 144, 0.06)
        );
        border-inline-start: 1px solid var(--border);
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        margin-bottom: 1.75rem;
      }
      .brand-mark {
        width: 34px;
        height: 34px;
        border-radius: 9px;
        flex-shrink: 0;
        background: var(--primary);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
      }
      .brand-name {
        font-weight: 700;
        font-size: 1.05rem;
      }

      h1 {
        font-size: 1.55rem;
        margin: 0 0 0.3rem;
      }
      h2 {
        font-size: 1.05rem;
        margin: 0 0 0.3rem;
      }
      .sub {
        color: var(--muted);
        font-size: 0.88rem;
        margin: 0 0 1.5rem;
      }

      form {
        display: flex;
        flex-direction: column;
      }
      label {
        margin-top: 0.5rem;
      }
      /*
     * The margin lives on the wrapper, not the input. Global styles give every input a
     * 0.75rem bottom margin; leaving it there makes the row taller than the field, so the
     * height:100% button centres its icon below the input's real middle.
     */
      .password-row {
        position: relative;
        margin-bottom: 0.75rem;
      }
      .password-row input {
        padding-inline-end: 2.6rem;
        margin-bottom: 0;
      }
      .peek {
        position: absolute;
        top: 0;
        inset-inline-end: 0;
        height: 100%;
        width: 2.4rem;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--muted);
        padding: 0;
        line-height: 1;
      }
      .peek:hover {
        color: var(--text);
      }
      .error {
        color: var(--danger);
        font-size: 0.85rem;
        margin: 0.15rem 0 0;
      }
      .submit {
        width: 100%;
        margin-top: 1.25rem;
        padding: 0.65rem;
        font-size: 0.95rem;
      }
      .submit:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .alt {
        margin: 1.25rem 0 0;
        font-size: 0.88rem;
        color: var(--muted);
      }

      .personas {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
      }
      .persona {
        --accent: var(--primary);
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        text-align: start;
        padding: 0.7rem 0.8rem;
        width: 100%;
        cursor: pointer;
        background: var(--card);
        color: var(--text);
        border: 1px solid var(--border);
        border-inline-start: 3px solid var(--accent);
        border-radius: 9px;
        font-family: inherit;
        transition:
          transform 0.12s ease,
          border-color 0.12s ease;
      }
      .persona:hover {
        transform: translateX(2px);
        border-color: var(--accent);
      }
      .persona.selected {
        border-color: var(--accent);
        background: color-mix(in srgb, var(--accent) 8%, var(--card));
      }
      .avatar {
        flex-shrink: 0;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: var(--accent);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.03em;
      }
      .meta {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        min-width: 0;
      }
      .name {
        font-weight: 600;
        font-size: 0.92rem;
      }
      .desc {
        font-size: 0.78rem;
        color: var(--muted);
        line-height: 1.35;
      }
      .creds {
        font-size: 0.75rem;
        color: var(--accent);
        background: color-mix(in srgb, var(--accent) 10%, transparent);
        padding: 0.1rem 0.4rem;
        border-radius: 4px;
        width: fit-content;
        margin-top: 0.15rem;
      }

      .notice {
        margin: 1.5rem 0 0;
        padding: 0.7rem 0.8rem;
        font-size: 0.78rem;
        line-height: 1.5;
        color: var(--muted);
        background: color-mix(in srgb, var(--warn) 9%, transparent);
        border: 1px solid color-mix(in srgb, var(--warn) 28%, transparent);
        border-radius: 8px;
      }
      .notice strong {
        color: var(--warn);
      }

      @media (max-width: 860px) {
        .auth-card {
          grid-template-columns: 1fr;
          max-width: 460px;
        }
        .persona-pane {
          border-inline-start: none;
          border-top: 1px solid var(--border);
        }
        .pane {
          padding: 1.75rem 1.5rem;
        }
      }
    `,
  ],
})
export class LoginPage {
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly theme = inject(ThemeService);
  readonly i18n = inject(I18nService);

  readonly personas = PERSONAS;

  username = '';
  password = '';
  showPassword = false;
  error = '';

  submit() {
    this.error = this.auth.signIn(this.username, this.password) ?? '';
    if (!this.error) {
      this.router.navigateByUrl('/');
    }
  }

  /** Fills the form only — signing in stays a deliberate click on the Sign in button. */
  usePersona(p: Persona) {
    this.username = p.username;
    this.password = p.password;
    this.error = '';
  }
}
