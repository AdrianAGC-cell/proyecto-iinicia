import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-funda-carta',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="funda-container" [style.backgroundImage]="fundaUrl ? 'url(' + fundaUrl + ')' : ''">
      <div class="funda-inner" *ngIf="!fundaUrl">
        <div class="pokeball-glow"></div>
        <span class="funda-title">POKÉMON</span>
        <span class="funda-subtitle">CARD GAME</span>
      </div>
    </div>
  `,
  styles: [`
    .funda-container {
      width: 100%;
      height: 100%;
      aspect-ratio: 2 / 3;
      border-radius: 12px;
      border: 2px solid var(--border-glass);
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--bg-tertiary);
      box-shadow: var(--shadow-premium);
      overflow: hidden;
    }
    .funda-inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      text-align: center;
      width: 90%;
      height: 90%;
      border: 2px dashed rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      background: radial-gradient(circle, rgba(18,18,30,0.85) 0%, rgba(10,10,15,0.95) 100%);
    }
    .pokeball-glow {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.5) 0%, transparent 70%);
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
    .funda-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--accent-primary);
      letter-spacing: 0.1em;
      text-shadow: 0 0 8px rgba(99, 102, 241, 0.6);
      z-index: 1;
    }
    .funda-subtitle {
      font-size: 0.7rem;
      color: var(--text-secondary);
      letter-spacing: 0.2em;
      margin-top: 4px;
      z-index: 1;
    }
  `]
})
export class FundaCartaComponent {
  @Input() fundaUrl?: string;
}
