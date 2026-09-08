import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Track, TRACKS, initials } from '../tracks.data';

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h1>Enablement Tracks</h1>
    <p class="lede">
      The AZM Squad Full Stack Enablement Program — {{ trackCount }} tracks,
      {{ peopleCount }} engineers, {{ seatCount }} track seats.
    </p>

    <div class="card controls">
      <input [ngModel]="query()" (ngModelChange)="query.set($event)"
             placeholder="Search by name, email or phone…" />
      <div class="chips">
        <button type="button" class="chip" [class.on]="!selected()" (click)="selected.set(null)">All</button>
        @for (t of tracks; track t.code) {
          <button type="button" class="chip" [class.on]="selected() === t.code"
                  [style.--chip]="t.accent" (click)="pick(t.code)">{{ t.name }}</button>
        }
      </div>
    </div>

    @if (visible().length === 0) {
      <div class="card"><p class="muted">No member matches “{{ query() }}”.</p></div>
    }

    @for (t of visible(); track t.code) {
      <div class="card track">
        <header>
          <span class="code" [style.background]="t.accent">{{ t.code }}</span>
          <div class="head-text">
            <h3>{{ t.name }} Track</h3>
            <p class="muted">{{ t.description }}</p>
          </div>
          <span class="count">{{ t.members.length }} members</span>
        </header>

        <div class="members">
          @for (m of t.members; track m.email + m.name) {
            <div class="member">
              <span class="avatar" [style.background]="t.accent">{{ initials(m.name) }}</span>
              <div class="member-text">
                <span class="name">{{ m.name }}</span>
                <a class="contact" [href]="'tel:' + m.phone">{{ m.phone }}</a>
                <a class="contact" [href]="'mailto:' + m.email">{{ m.email }}</a>
              </div>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .lede { color: var(--muted); margin: -0.25rem 0 1rem; }
    .muted { color: var(--muted); }

    .controls { display: flex; flex-direction: column; gap: 0.75rem; }
    .controls input { margin: 0; }
    .chips { display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .chip {
      --chip: var(--primary);
      padding: 0.3rem 0.7rem; border-radius: 999px; cursor: pointer;
      border: 1px solid var(--border); background: var(--card); color: var(--muted);
      font: inherit; font-size: 0.8rem;
    }
    .chip:hover { border-color: var(--chip); color: var(--text); }
    .chip.on { background: var(--chip); border-color: var(--chip); color: #fff; font-weight: 600; }

    .track header { display: flex; align-items: flex-start; gap: 0.85rem; margin-bottom: 1rem; }
    .track header h3 { margin: 0 0 0.15rem; }
    .track header p { margin: 0; font-size: 0.88rem; }
    .head-text { flex: 1; min-width: 0; }
    .code {
      flex-shrink: 0; min-width: 46px; height: 46px; padding: 0 0.5rem; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-weight: 700; font-size: 0.9rem;
    }
    .count { flex-shrink: 0; color: var(--muted); font-size: 0.8rem; white-space: nowrap; }

    .members { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 0.75rem; }
    .member {
      display: flex; gap: 0.65rem; padding: 0.7rem;
      border: 1px solid var(--border); border-radius: 10px; background: var(--bg);
    }
    .avatar {
      flex-shrink: 0; width: 34px; height: 34px; border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-weight: 700; font-size: 0.75rem;
    }
    .member-text { display: flex; flex-direction: column; min-width: 0; gap: 0.1rem; }
    .name { font-weight: 600; font-size: 0.9rem; }
    .contact { font-size: 0.8rem; color: var(--muted); overflow: hidden; text-overflow: ellipsis; }
    .contact:hover { color: var(--primary); }

    @media (max-width: 480px) {
      .track header { flex-wrap: wrap; }
      .count { width: 100%; }
    }
  `]
})
export class TeamPage {
  readonly tracks = TRACKS;
  readonly initials = initials;

  readonly query = signal('');
  readonly selected = signal<string | null>(null);

  readonly trackCount = TRACKS.length;
  /** Seats counted with repeats — several engineers sit on two tracks. */
  readonly seatCount = TRACKS.reduce((n, t) => n + t.members.length, 0);
  readonly peopleCount = new Set(TRACKS.flatMap(t => t.members.map(m => m.email.toLowerCase()))).size;

  /** Tracks narrowed by the chip, then by the search term applied to each member. */
  readonly visible = computed<Track[]>(() => {
    const code = this.selected();
    const q = this.query().trim().toLowerCase();
    const byTrack = code ? TRACKS.filter(t => t.code === code) : TRACKS;
    if (!q) return byTrack;

    return byTrack
      .map(t => ({
        ...t,
        members: t.members.filter(m =>
          `${m.name} ${m.email} ${m.phone}`.toLowerCase().includes(q)),
      }))
      .filter(t => t.members.length > 0);
  });

  /** Clicking the active chip clears the filter. */
  pick(code: string): void {
    this.selected.update(current => (current === code ? null : code));
  }
}
