import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd, NavigationError, NavigationCancel } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="home-container">
      <div class="hero-section glass">
        <!-- Physical Red Console Details -->
        <div class="console-decoration">
          <div class="dots-led"></div>
        </div>

        <div class="glowing-logo">
          <div class="pokeball-logo">
            <div class="pokeball-center"></div>
          </div>
          <h1>POKÉMON</h1>
          <span class="subtitle">TCG ARENA</span>
        </div>
        
        <p class="description">
          El juego de cartas definitivo. Colecciona tus Pokémon favoritos,
          combate contra la Inteligencia Artificial y desafía a otros entrenadores online.
        </p>

        <div class="action-buttons" *ngIf="!currentUser(); else loggedInTemplate">
          <button class="btn-primary press-start-btn" [disabled]="isNavigating" (click)="navigate('/login')">
            PRESS START
          </button>
        </div>
        
        <ng-template #loggedInTemplate>
          <div class="welcome-box">
            <p class="welcome-text">¡HOLA, <strong>{{ username | uppercase }}</strong>!</p>
            <button class="btn-primary press-start-btn" [disabled]="isNavigating" (click)="navigate('/menu')">
              PRESS START
            </button>
          </div>
        </ng-template>
        
        <button class="btn-secondary rules-btn" [disabled]="isNavigating" (click)="navigate('/reglas')">
          VER REGLAS
        </button>
      </div>
    </div>
  `,
  styles: [`
    .home-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }

    .hero-section {
      max-width: 500px;
      width: 100%;
      padding: 40px 30px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
      background: #181d26; /* Screen gray */
      border: 5px solid #000 !important;
      box-shadow: 8px 8px 0 #000 !important;
      position: relative;
    }

    /* Screen reflection effect */
    .hero-section::after {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 50%);
      pointer-events: none;
      border-radius: 8px;
    }

    .console-decoration {
      display: flex;
      justify-content: space-between;
      width: 100%;
      padding: 0 10px;
      position: absolute;
      top: 12px;
    }

    .blinking-led {
      width: 8px;
      height: 8px;
      background: #ef4444;
      border-radius: 50%;
      animation: blink-led 1s infinite alternate;
      border: 1px solid #000;
    }

    @keyframes blink-led {
      0% { opacity: 0.3; }
      100% { opacity: 1; }
    }

    .pokeball-logo {
      width: 54px;
      height: 54px;
      background: linear-gradient(to bottom, #ef4444 46%, #000000 46%, #000000 54%, #ffffff 54%);
      border: 4px solid #000000;
      border-radius: 50%;
      position: relative;
      margin-bottom: 8px;
      box-shadow: 3px 3px 0 rgba(0,0,0,0.4);
      animation: wobble 3s ease-in-out infinite;
    }

    @keyframes wobble {
      0%, 100% { transform: rotate(0deg); }
      15% { transform: rotate(-10deg); }
      30% { transform: rotate(10deg); }
      45% { transform: rotate(-5deg); }
      60% { transform: rotate(5deg); }
    }

    .pokeball-center {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 16px;
      height: 16px;
      background: #ffffff;
      border: 4px solid #000000;
      border-radius: 50%;
      transform: translate(-50%, -50%);
    }

    .glowing-logo {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .glowing-logo h1 {
      font-size: 2rem;
      color: #ffcb05;
      text-shadow: 4px 4px 0 #000000;
    }

    .glowing-logo .subtitle {
      font-family: 'Press Start 2P', monospace;
      font-size: 0.95rem;
      color: #ffffff;
      margin-top: 6px;
      letter-spacing: 2px;
      text-shadow: 3px 3px 0 #000000;
    }

    .description {
      font-size: 1.15rem;
      line-height: 1.4;
      color: #cbd5e1;
      font-family: 'VT323', monospace;
    }

    .action-buttons {
      display: flex;
      width: 100%;
      justify-content: center;
      margin: 10px 0;
    }

    @keyframes blink-text {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.25; }
    }

    .press-start-btn {
      font-size: 0.95rem !important;
      padding: 16px 32px !important;
      animation: blink-text 1.2s infinite;
      width: 100%;
      max-width: 320px;
    }

    .welcome-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      width: 100%;
    }

    .welcome-text {
      font-family: 'Press Start 2P', monospace;
      font-size: 0.65rem;
      color: #ffffff;
      text-shadow: 2px 2px 0 #000;
    }

    .rules-btn {
      width: 100%;
      max-width: 320px;
    }
  `]
})
export class HomeComponent {
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);

  currentUser = this.supabaseService.currentUser;
  userProfile = this.supabaseService.userProfile;
  isOnline = this.supabaseService.isOnline;

  isNavigating = false;

  get username(): string {
    return this.supabaseService.userProfile()?.username || 'Entrenador';
  }

  navigate(path: string) {
    if (this.isNavigating) return;
    this.isNavigating = true;
    this.router.navigate([path]).then(() => {
      this.isNavigating = false;
    }).catch(err => {
      console.error('Home navigation failed:', err);
      this.isNavigating = false;
    });
  }
}
