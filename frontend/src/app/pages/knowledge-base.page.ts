import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { Article } from '../models';

@Component({
  selector: 'app-knowledge-base',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h1>Knowledge Base</h1>

    <div class="card">
      <h3>Search</h3>
      <input placeholder="Search articles…" [(ngModel)]="query" (ngModelChange)="search()" />
    </div>

    <div class="card">
      <h3>Chat with the assistant</h3>
      <div class="btn-row">
        <input [(ngModel)]="chatMessage" name="chatMessage" placeholder="Ask a question…" (keyup.enter)="sendChat()" />
        <button class="btn secondary" (click)="sendChat()">Send</button>
      </div>
      @if (chatReply) {
        <p class="ai-box">{{ chatReply }} @if (handedOff) { <em>(handed off to a human agent)</em> }</p>
      }
    </div>

    <div class="card">
      <h3>Articles</h3>
      @if (articles.length === 0) {
        <p class="muted">No published articles yet.</p>
      } @else {
        <div class="article-grid">
          @for (a of articles; track a.id) {
            <div class="article-card">
              <div class="article-badges">
                <span class="badge">{{ a.type }}</span>
                <span class="badge">{{ a.category }}</span>
              </div>
              <h4 class="article-title">{{ a.title }}</h4>
              @if (a.body) { <p class="article-snippet">{{ a.body }}</p> }
              @if (a.viewCount !== undefined) { <span class="article-views">{{ a.viewCount }} views</span> }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .btn-row { display: flex; gap: 0.5rem; }
    .btn-row input { margin-bottom: 0; }
    .ai-box {
      background: var(--row-hover);
      border: 1px solid var(--border);
      color: var(--text);
      border-radius: 6px;
      padding: 0.6rem 0.75rem;
      font-size: 0.9rem;
    }
    .article-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
      gap: 0.75rem;
    }
    .article-card {
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 0.75rem 0.9rem;
      background: var(--row-hover);
      transition: border-color 0.15s ease, transform 0.15s ease;
    }
    .article-card:hover { border-color: var(--primary); transform: translateY(-1px); }
    .article-badges { display: flex; gap: 0.4rem; margin-bottom: 0.5rem; }
    .article-title { margin: 0 0 0.35rem; font-size: 0.95rem; }
    .article-snippet {
      margin: 0 0 0.5rem;
      font-size: 0.85rem;
      color: var(--muted);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .article-views { font-size: 0.75rem; color: var(--muted); }
  `]
})
export class KnowledgeBasePage implements OnInit {
  articles: Article[] = [];
  query = '';
  chatMessage = '';
  chatReply = '';
  handedOff = false;
  private sessionId?: string;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.browseFaqs().subscribe(a => (this.articles = a));
  }

  search() {
    if (!this.query) {
      this.api.browseFaqs().subscribe(a => (this.articles = a));
      return;
    }
    this.api.searchKb(this.query).subscribe(a => (this.articles = a));
  }

  sendChat() {
    if (!this.chatMessage) return;
    this.api.chatbotMessage(this.chatMessage, this.sessionId).subscribe(r => {
      this.chatReply = r.reply;
      this.handedOff = r.handedOff;
      this.sessionId = r.sessionId;
      this.chatMessage = '';
    });
  }
}
