import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, PERSONAS, Persona } from '../auth.service';

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <!-- Left: the form -->
        <section class="pane form-pane">
          <div class="brand">
            <span class="brand-mark">A</span>
            <span class="brand-name">Azm CRM</span>
          </div>

          <h1>Welcome back</h1>
          <p class="sub">Sign in to continue to the support desk.</p>

          <form (ngSubmit)="submit()" #f="ngForm">
            <label for="username">Username</label>
            <input
              id="username"
              name="username"
              autocomplete="username"
              placeholder="admin"
              [(ngModel)]="username"
              [class.invalid]="error"
              (ngModelChange)="error = ''"
            />

            <label for="password">Password</label>
            <div class="password-row">
              <input
                id="password"
                name="password"
                autocomplete="current-password"
                [type]="showPassword ? 'text' : 'password'"
                placeholder="••••••"
                [(ngModel)]="password"
                [class.invalid]="error"
                (ngModelChange)="error = ''"
              />
              <button
                type="button"
                class="peek"
                (click)="showPassword = !showPassword"
                [title]="showPassword ? 'Hide password' : 'Show password'"
              >
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </div>

            @if (error) {
              <p class="error" role="alert">{{ error }}</p>
            }

            <button class="btn submit" type="submit" [disabled]="!username || !password">
              Sign in
            </button>
          </form>

          <p class="alt">
            No account? <a routerLink="/signup">Create one</a>
          </p>
        </section>

        <!-- Right: pick a persona -->
        <section class="pane persona-pane">
          <h2>Or sign in as…</h2>
          <p class="sub">Four demo accounts, one per role in the specifications.</p>

          <div class="personas">
            @for (p of personas; track p.id) {
              <button
                type="button"
                class="persona"
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
            <strong>Demo only.</strong> These credentials are checked in the browser and the
            API itself requires no authentication at all — every endpoint is open. Nothing
            here is a security control.
          </p>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      padding: 1.5rem; overflow-y: auto;
      background:
        radial-gradient(1100px 600px at 8% -10%, rgba(109,40,217,0.22), transparent 60%),
        radial-gradient(900px 500px at 105% 110%, rgba(14,116,144,0.20), transparent 55%),
        var(--bg);
    }
    .auth-card {
      display: grid; grid-template-columns: 1fr 1fr;
      width: 100%; max-width: 940px;
      background: var(--card); border: 1px solid var(--border);
      border-radius: 16px; overflow: hidden;
      box-shadow: 0 18px 50px rgba(0,0,0,0.13);
    }
    .pane { padding: 2.25rem 2.25rem 2rem; }
    .form-pane { display: flex; flex-direction: column; }
    .persona-pane {
      background: linear-gradient(160deg, rgba(109,40,217,0.06), rgba(14,116,144,0.06));
      border-left: 1px solid var(--border);
    }

    .brand { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 1.75rem; }
    .brand-mark {
      width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
      background: var(--primary); color: #fff;
      display: flex; align-items: center; justify-content: center; font-weight: 700;
    }
    .brand-name { font-weight: 700; font-size: 1.05rem; }

    h1 { font-size: 1.55rem; margin: 0 0 0.3rem; }
    h2 { font-size: 1.05rem; margin: 0 0 0.3rem; }
    .sub { color: var(--muted); font-size: 0.88rem; margin: 0 0 1.5rem; }

    form { display: flex; flex-direction: column; }
    label { margin-top: 0.5rem; }
    .password-row { position: relative; }
    .password-row input { padding-right: 2.6rem; }
    .peek {
      position: absolute; top: 0; right: 0; height: 100%; width: 2.4rem;
      background: none; border: none; cursor: pointer; font-size: 1rem;
      display: flex; align-items: center; justify-content: center;
    }
    .error {
      color: var(--danger); font-size: 0.85rem; margin: 0.15rem 0 0;
    }
    .submit { width: 100%; margin-top: 1.25rem; padding: 0.65rem; font-size: 0.95rem; }
    .submit:disabled { opacity: 0.5; cursor: not-allowed; }
    .alt { margin: 1.25rem 0 0; font-size: 0.88rem; color: var(--muted); }

    .personas { display: flex; flex-direction: column; gap: 0.6rem; }
    .persona {
      --accent: var(--primary);
      display: flex; align-items: flex-start; gap: 0.75rem; text-align: left;
      padding: 0.7rem 0.8rem; width: 100%; cursor: pointer;
      background: var(--card); color: var(--text);
      border: 1px solid var(--border); border-left: 3px solid var(--accent);
      border-radius: 9px; font-family: inherit;
      transition: transform 0.12s ease, border-color 0.12s ease;
    }
    .persona:hover { transform: translateX(2px); border-color: var(--accent); }
    .avatar {
      flex-shrink: 0; width: 34px; height: 34px; border-radius: 50%;
      background: var(--accent); color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 700; letter-spacing: 0.03em;
    }
    .meta { display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }
    .name { font-weight: 600; font-size: 0.92rem; }
    .desc { font-size: 0.78rem; color: var(--muted); line-height: 1.35; }
    .creds {
      font-size: 0.75rem; color: var(--accent);
      background: color-mix(in srgb, var(--accent) 10%, transparent);
      padding: 0.1rem 0.4rem; border-radius: 4px; width: fit-content; margin-top: 0.15rem;
    }

    .notice {
      margin: 1.5rem 0 0; padding: 0.7rem 0.8rem;
      font-size: 0.78rem; line-height: 1.5; color: var(--muted);
      background: color-mix(in srgb, var(--warn) 9%, transparent);
      border: 1px solid color-mix(in srgb, var(--warn) 28%, transparent);
      border-radius: 8px;
    }
    .notice strong { color: var(--warn); }

    @media (max-width: 860px) {
      .auth-card { grid-template-columns: 1fr; max-width: 460px; }
      .persona-pane { border-left: none; border-top: 1px solid var(--border); }
      .pane { padding: 1.75rem 1.5rem; }
    }
  `]
})
export class LoginPage {
  private auth = inject(AuthService);
  private router = inject(Router);

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

  usePersona(p: Persona) {
    this.username = p.username;
    this.password = p.password;
    this.error = '';
    this.submit();
  }
}
