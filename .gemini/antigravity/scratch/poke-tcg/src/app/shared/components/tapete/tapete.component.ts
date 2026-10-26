import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tapete',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tapete-board" [style.backgroundImage]="tapeteUrl ? 'url(' + tapeteUrl + ')' : ''">
      <!-- BARRA RIVAL -->
      <div class="player-bar rival-bar glass">
        <div class="profile-info">
          <span class="username">{{ rivalName }}</span>
          <span class="role-badge rival">IA / OPONENTE</span>
        </div>
      </div>

      <!-- ZONA DE CARTAS RIVAL (MAZO/DESCARTE) -->
      <div class="deck-zone rival-zone">
        <div class="deck-pile">
          <div class="card-back" *ngIf="rivalDeckCount > 0"></div>
          <span class="count-badge">{{ rivalDeckCount }}</span>
        </div>
        <div class="discard-pile">
          <img [src]="rivalDiscardTopUrl" *ngIf="rivalDiscardTopUrl" class="discard-img"/>
          <div class="empty-discard" *ngIf="!rivalDiscardTopUrl">DESCARTE</div>
          <span class="count-badge" *ngIf="rivalDiscardCount > 0">{{ rivalDiscardCount }}</span>
        </div>
      </div>

      <!-- CAMPO DE BATALLA -->
      <div class="field-grid">
        <!-- ZONA DEL RIVAL -->
        <div class="battlefield-row rival-field">
          <ng-content select="[rival-field]"></ng-content>
        </div>

        <!-- LÍNEA DIVISORIA -->
        <div class="field-divider">
          <div class="divider-pokeball"></div>
        </div>

        <!-- ZONA DEL JUGADOR -->
        <div class="battlefield-row player-field">
          <ng-content select="[player-field]"></ng-content>
        </div>
      </div>

      <!-- ZONA DE CARTAS JUGADOR (MAZO/DESCARTE) -->
      <div class="deck-zone player-zone">
        <div class="deck-pile">
          <div class="card-back" *ngIf="playerDeckCount > 0"></div>
          <span class="count-badge">{{ playerDeckCount }}</span>
        </div>
        <div class="discard-pile">
          <img [src]="playerDiscardTopUrl" *ngIf="playerDiscardTopUrl" class="discard-img"/>
          <div class="empty-discard" *ngIf="!playerDiscardTopUrl">DESCARTE</div>
          <span class="count-badge" *ngIf="playerDiscardCount > 0">{{ playerDiscardCount }}</span>
        </div>
      </div>

      <!-- BARRA JUGADOR -->
      <div class="player-bar player-bar-bottom glass">
        <div class="profile-info">
          <span class="username">{{ playerName }}</span>
          <span class="role-badge player">TÚ</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tapete-board {
      width: 100%;
      min-height: 75vh;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      background-color: #0f1a0f;
      background-image:
        radial-gradient(ellipse at center, rgba(34, 120, 50, 0.15) 0%, transparent 70%),
        linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
      background-size: 100% 100%, 30px 30px, 30px 30px;
      border: 3px solid #000;
      border-radius: 16px;
      box-shadow: 6px 6px 0 #000;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 12px;
      position: relative;
      overflow: hidden;
    }

    .player-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 20px;
      border-radius: 8px;
      width: 100%;
      z-index: 10;
    }

    .rival-bar {
      background: rgba(220, 38, 38, 0.12) !important;
      border-color: rgba(220, 38, 38, 0.3) !important;
    }

    .player-bar-bottom {
      background: rgba(22, 163, 74, 0.12) !important;
      border-color: rgba(22, 163, 74, 0.3) !important;
    }

    .profile-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .username {
      font-family: 'Press Start 2P', monospace;
      font-weight: normal;
      font-size: 0.7rem;
      letter-spacing: 0.03em;
      color: #fff;
      text-shadow: 2px 2px 0 #000;
    }

    .role-badge {
      font-family: 'Press Start 2P', monospace;
      font-size: 0.45rem;
      font-weight: normal;
      padding: 3px 8px;
      border-radius: 4px;
      width: fit-content;
      border: 2px solid #000;
    }

    .role-badge.rival {
      background: #dc2626;
      color: #fff;
    }

    .role-badge.player {
      background: #16a34a;
      color: #fff;
    }

    /* CAMPO */
    .field-grid {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 16px;
      margin: 16px 0;
      flex-grow: 1;
      position: relative;
    }

    .battlefield-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: auto auto;
      gap: 10px;
      justify-items: center;
      align-items: center;
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
    }

    /* RIVAL FIELD LAYOUT */
    .rival-field ::ng-deep .field-slot:nth-child(1) { grid-row: 2; grid-column: 2; z-index: 2; }
    .rival-field ::ng-deep .field-slot:nth-child(2) { grid-row: 1; grid-column: 1; transform: scale(0.85); opacity: 0.9; }
    .rival-field ::ng-deep .field-slot:nth-child(3) { grid-row: 1; grid-column: 2; transform: scale(0.85); opacity: 0.9; }
    .rival-field ::ng-deep .field-slot:nth-child(4) { grid-row: 1; grid-column: 3; transform: scale(0.85); opacity: 0.9; }

    /* PLAYER FIELD LAYOUT */
    .player-field ::ng-deep .field-slot:nth-child(1) { grid-row: 1; grid-column: 2; z-index: 2; }
    .player-field ::ng-deep .field-slot:nth-child(2) { grid-row: 2; grid-column: 1; transform: scale(0.85); opacity: 0.9; }
    .player-field ::ng-deep .field-slot:nth-child(3) { grid-row: 2; grid-column: 2; transform: scale(0.85); opacity: 0.9; }
    .player-field ::ng-deep .field-slot:nth-child(4) { grid-row: 2; grid-column: 3; transform: scale(0.85); opacity: 0.9; }

    .field-divider {
      width: 100%;
      height: 4px;
      background: linear-gradient(90deg, transparent, #ffcb05 30%, #ffcb05 70%, transparent);
      position: relative;
      border-top: 2px solid #000;
      border-bottom: 2px solid #000;
    }

    .divider-pokeball {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 28px;
      height: 28px;
      background: linear-gradient(180deg, #dc2626 50%, #fff 50%);
      border-radius: 50%;
      border: 3px solid #000;
      box-shadow: 3px 3px 0 #000;
    }

    .divider-pokeball::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 10px;
      height: 10px;
      background: #fff;
      border-radius: 50%;
      border: 2px solid #000;
    }

    /* DECK & DISCARD ZONES */
    .deck-zone {
      position: absolute;
      right: 20px;
      display: flex;
      flex-direction: column;
      gap: 15px;
      z-index: 10;
    }

    .deck-zone.rival-zone {
      top: 60px;
    }

    .deck-zone.player-zone {
      bottom: 60px;
    }

    .deck-pile, .discard-pile {
      width: 80px;
      height: 112px;
      background: rgba(0, 0, 0, 0.4);
      border: 2px dashed rgba(255, 255, 255, 0.3);
      border-radius: 8px;
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .card-back {
      width: 100%;
      height: 100%;
      background: url('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png') center/cover;
      background-color: #2563eb; /* Blue back */
      border: 3px solid #fff;
      border-radius: 8px;
      box-shadow: 2px 2px 4px rgba(0,0,0,0.5);
    }

    .discard-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 6px;
      box-shadow: 2px 2px 4px rgba(0,0,0,0.5);
    }

    .empty-discard {
      color: rgba(255, 255, 255, 0.3);
      font-size: 0.6rem;
      font-weight: bold;
      text-align: center;
    }

    .count-badge {
      position: absolute;
      bottom: -8px;
      right: -8px;
      background: #dc2626;
      color: white;
      font-size: 0.7rem;
      font-weight: bold;
      padding: 2px 6px;
      border-radius: 10px;
      border: 1px solid #000;
      box-shadow: 1px 1px 0 #000;
    }
  `]
})
export class TapeteComponent {
  @Input() tapeteUrl?: string;
  @Input() playerName = 'Jugador 1';
  @Input() rivalName = 'IA';
  
  @Input() playerDeckCount = 0;
  @Input() playerDiscardCount = 0;
  @Input() playerDiscardTopUrl: string | null = null;
  
  @Input() rivalDeckCount = 0;
  @Input() rivalDiscardCount = 0;
  @Input() rivalDiscardTopUrl: string | null = null;
}
