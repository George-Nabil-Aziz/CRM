import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';

interface ChatTurn {
  from: 'you' | 'bot';
  text: string;
  /** Set on the bot turn where the backend decided a human should take over. */
  handedOff?: boolean;
}

const SUGGESTIONS = [
  'How do I reset my password?',
  'What are your working hours?',
  'I was charged twice this month',
  'I need to speak to an agent',
];

@Component({
  selector: 'app-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h1>AI Assistant</h1>
    <p class="lede">Ask a question. The bot answers from the knowledge base and hands off to a human when it cannot help.</p>

    <div class="card chat">
      <div class="log" #log>
        @if (turns.length === 0) {
          <p class="muted empty">No messages yet — pick a starter below or type your own.</p>
        }
        @for (turn of turns; track $index) {
          <div class="turn" [class.mine]="turn.from === 'you'">
            <span class="bubble">{{ turn.text }}</span>
            @if (turn.handedOff) {
              <span class="handoff">Handed off to a human agent</span>
            }
          </div>
        }
        @if (sending) {
          <div class="turn"><span class="bubble typing">Thinking…</span></div>
        }
      </div>

      @if (turns.length === 0) {
        <div class="starters">
          @for (s of suggestions; track s) {
            <button type="button" class="starter" (click)="send(s)">{{ s }}</button>
          }
        </div>
      }

      <form (ngSubmit)="send(draft)">
        <input [(ngModel)]="draft" name="draft" placeholder="Type a message…" [disabled]="sending" autocomplete="off" />
        <button class="btn" type="submit" [disabled]="sending || !draft.trim()">Send</button>
      </form>

      @if (error) {
        <p class="field-error">{{ error }}</p>
      }
    </div>
  `,
  styles: [`
    .lede { color: var(--muted); margin: -0.25rem 0 1rem; }
    .muted { color: var(--muted); }
    .chat { display: flex; flex-direction: column; gap: 0.75rem; }

    .log {
      display: flex; flex-direction: column; gap: 0.6rem;
      min-height: 220px; max-height: 55vh; overflow-y: auto;
      padding: 0.25rem;
    }
    .empty { margin: auto; font-size: 0.9rem; }

    .turn { display: flex; flex-direction: column; align-items: flex-start; gap: 0.2rem; }
    .turn.mine { align-items: flex-end; }
    .bubble {
      max-width: min(85%, 46ch); padding: 0.55rem 0.8rem; border-radius: 12px;
      background: var(--bg); border: 1px solid var(--border);
      font-size: 0.9rem; line-height: 1.45; white-space: pre-wrap;
    }
    .turn.mine .bubble { background: var(--primary); border-color: var(--primary); color: #fff; }
    .typing { color: var(--muted); font-style: italic; }
    .handoff { font-size: 0.72rem; color: var(--warn); font-weight: 600; }

    .starters { display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .starter {
      padding: 0.35rem 0.7rem; border-radius: 999px; cursor: pointer; font: inherit; font-size: 0.8rem;
      background: var(--card); color: var(--primary); border: 1px solid var(--primary);
    }
    .starter:hover { background: var(--primary); color: #fff; }

    form { display: flex; gap: 0.5rem; }
    form input { margin: 0; flex: 1; }
  `]
})
export class AssistantPage {
  @ViewChild('log') private logEl?: ElementRef<HTMLDivElement>;

  readonly suggestions = SUGGESTIONS;

  turns: ChatTurn[] = [];
  draft = '';
  sending = false;
  error = '';

  /** Returned by the first reply and echoed back so the backend keeps one conversation. */
  private sessionId?: string;

  constructor(private api: ApiService) {}

  send(text: string): void {
    const message = text.trim();
    if (!message || this.sending) return;

    this.turns.push({ from: 'you', text: message });
    this.draft = '';
    this.error = '';
    this.sending = true;
    this.scrollDown();

    this.api.chatbotMessage(message, this.sessionId).subscribe({
      next: res => {
        this.sessionId = res.sessionId;
        this.turns.push({ from: 'bot', text: res.reply, handedOff: res.handedOff });
        this.sending = false;
        this.scrollDown();
      },
      error: () => {
        this.sending = false;
        this.error = 'The assistant is unavailable right now. Please try again.';
      },
    });
  }

  private scrollDown(): void {
    setTimeout(() => {
      const el = this.logEl?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }
}
