import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <section class="pane form-pane">
          <div class="brand">
            <span class="brand-mark">A</span>
            <span class="brand-name">Azm CRM</span>
          </div>

          <h1>Create an account</h1>
          <p class="sub">Sign up as a customer to submit and track requests.</p>

          <form (ngSubmit)="submit()">
            <label for="name">Full name</label>
            <input
              id="name"
              name="name"
              autocomplete="name"
              placeholder="Layla Hassan"
              [(ngModel)]="name"
              [class.invalid]="errors['name']"
              (ngModelChange)="clear('name')"
            />
            @if (errors['name']) { <p class="error">{{ errors['name'] }}</p> }

            <label for="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autocomplete="email"
              placeholder="layla@example.com"
              [(ngModel)]="email"
              [class.invalid]="errors['email']"
              (ngModelChange)="clear('email')"
            />
            @if (errors['email']) { <p class="error">{{ errors['email'] }}</p> }

            <label for="password">Password</label>
            <div class="password-row">
              <input
                id="password"
                name="password"
                autocomplete="new-password"
                [type]="showPassword ? 'text' : 'password'"
                placeholder="At least 6 characters"
                [(ngModel)]="password"
                [class.invalid]="errors['password']"
                (ngModelChange)="clear('password')"
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
            @if (errors['password']) { <p class="error">{{ errors['password'] }}</p> }

            <label for="confirm">Confirm password</label>
            <input
              id="confirm"
              name="confirm"
              autocomplete="new-password"
              [type]="showPassword ? 'text' : 'password'"
              placeholder="Repeat the password"
              [(ngModel)]="confirm"
              [class.invalid]="errors['confirm']"
              (ngModelChange)="clear('confirm')"
            />
            @if (errors['confirm']) { <p class="error">{{ errors['confirm'] }}</p> }

            <button class="btn submit" type="submit">Create account</button>
          </form>

          <p class="alt">
            Already have an account? <a routerLink="/login">Sign in</a>
          </p>
        </section>

        <section class="pane info-pane">
          <h2>What sign-up does here</h2>

          <ul class="points">
            <li>
              <span class="dot warn"></span>
              <span>
                <strong>No account is created.</strong> There is no registration endpoint,
                and the API stores no credential of any kind — <code>User</code> has a name,
                an email and a role, nothing more.
              </span>
            </li>
            <li>
              <span class="dot"></span>
              <span>
                Submitting signs you in as the <strong>Customer</strong> persona, using the
                name you type, so the customer-facing views can be explored.
              </span>
            </li>
            <li>
              <span class="dot"></span>
              <span>
                The form's validation is real and mirrors the rules the API applies to
                <code>POST /api/customers</code> — required name, a well-formed email.
              </span>
            </li>
          </ul>

          <p class="notice">
            To reach the agent, manager or administrator views, use the demo accounts on the
            <a routerLink="/login">sign-in page</a> instead.
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
        radial-gradient(900px 500px at 105% 110%, rgba(21,128,61,0.18), transparent 55%),
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
    .info-pane {
      background: linear-gradient(160deg, rgba(109,40,217,0.06), rgba(21,128,61,0.06));
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
    h2 { font-size: 1.05rem; margin: 0 0 1.1rem; }
    .sub { color: var(--muted); font-size: 0.88rem; margin: 0 0 1.25rem; }

    form { display: flex; flex-direction: column; }
    label { margin-top: 0.5rem; }
    .password-row { position: relative; }
    .password-row input { padding-right: 2.6rem; }
    .peek {
      position: absolute; top: 0; right: 0; height: 100%; width: 2.4rem;
      background: none; border: none; cursor: pointer; font-size: 1rem;
      display: flex; align-items: center; justify-content: center;
    }
    .error { color: var(--danger); font-size: 0.8rem; margin: 0.15rem 0 0; }
    .submit { width: 100%; margin-top: 1.25rem; padding: 0.65rem; font-size: 0.95rem; }
    .alt { margin: 1.25rem 0 0; font-size: 0.88rem; color: var(--muted); }

    .points { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.9rem; }
    .points li { display: flex; gap: 0.65rem; font-size: 0.83rem; line-height: 1.55; color: var(--muted); }
    .points strong { color: var(--text); }
    .dot {
      flex-shrink: 0; width: 7px; height: 7px; border-radius: 50%; margin-top: 0.5rem;
      background: var(--primary);
    }
    .dot.warn { background: var(--warn); }
    code {
      font-size: 0.78rem; background: color-mix(in srgb, var(--primary) 10%, transparent);
      padding: 0.05rem 0.3rem; border-radius: 4px;
    }

    .notice {
      margin: 1.5rem 0 0; padding: 0.7rem 0.8rem;
      font-size: 0.8rem; line-height: 1.5; color: var(--muted);
      background: var(--card); border: 1px solid var(--border); border-radius: 8px;
    }

    @media (max-width: 860px) {
      .auth-card { grid-template-columns: 1fr; max-width: 460px; }
      .info-pane { border-left: none; border-top: 1px solid var(--border); }
      .pane { padding: 1.75rem 1.5rem; }
    }
  `]
})
export class SignupPage {
  private auth = inject(AuthService);
  private router = inject(Router);

  name = '';
  email = '';
  password = '';
  confirm = '';
  showPassword = false;
  errors: Record<string, string> = {};

  clear(field: string) {
    delete this.errors[field];
  }

  submit() {
    this.errors = {};

    if (!this.name.trim()) {
      this.errors['name'] = 'Name is required.';
    }
    // Same shape the API's [EmailAddress] attribute accepts.
    if (!this.email.trim()) {
      this.errors['email'] = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim())) {
      this.errors['email'] = 'Enter a valid email address.';
    }
    if (!this.password) {
      this.errors['password'] = 'Password is required.';
    } else if (this.password.length < 6) {
      this.errors['password'] = 'Use at least 6 characters.';
    }
    if (this.password !== this.confirm) {
      this.errors['confirm'] = 'Passwords do not match.';
    }

    if (Object.keys(this.errors).length > 0) return;

    this.auth.signUpAsCustomer(this.name);
    this.router.navigateByUrl('/');
  }
}
