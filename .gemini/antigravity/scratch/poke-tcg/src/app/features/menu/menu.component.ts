import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="menu-container">
      <!-- ENCABEZADO POKÉDEX -->
      <div class="menu-header glass">
        <div class="logo-area">
          <div class="pokeball-logo">
            <div class="pokeball-top"></div>
            <div class="pokeball-bottom"></div>
            <div class="pokeball-center"></div>
          </div>
          <div class="logo-text">
            <h2>POKÉMON</h2>
            <span class="subtitle">TCG ARENA</span>
          </div>
        </div>
        
        <div class="user-info">
          <div class="trainer-badge glass">
            <span class="badge-label">ENTRENADOR</span>
            <strong class="badge-name">{{ username }}</strong>
          </div>
          <button class="btn-logout-menu" (click)="cerrarSesion()">
            CERRAR SESIÓN
          </button>
        </div>
      </div>

      <!-- GRID DE OPCIONES -->
      <div class="menu-grid">
        <!-- SECCIÓN COMBATE -->
        <div class="menu-section">
          <div class="section-header">
            <div class="section-icon">⚔️</div>
            <h3>COMBATE</h3>
          </div>
          <div class="buttons-layout cols-2">
            <button class="menu-btn btn-vs-ia" (click)="navigate('/vs-ia')">
              <div class="btn-icon">🤖</div>
              <div class="btn-content">
                <span class="btn-title">VS INTELIGENCIA ARTIFICIAL</span>
                <span class="btn-desc">Entrena tu estrategia contra el bot</span>
              </div>
              <div class="btn-arrow">▶</div>
            </button>
            <button class="menu-btn btn-online" (click)="navigate('/online')">
              <div class="btn-icon">🌐</div>
              <div class="btn-content">
                <span class="btn-title">COMBATE EN LÍNEA</span>
                <span class="btn-desc">Enfréntate a otros entrenadores</span>
              </div>
              <div class="btn-arrow">▶</div>
            </button>
          </div>
        </div>



        <!-- SECCIÓN PERFIL -->
        <div class="menu-section">
          <div class="section-header">
            <div class="section-icon">👤</div>
            <h3>PERFIL</h3>
          </div>
          <div class="buttons-layout cols-2">
            <button class="menu-btn btn-small" (click)="navigate('/historial')">
              <div class="btn-icon">📜</div>
              <span class="btn-title">HISTORIAL</span>
            </button>
            <button class="menu-btn btn-small" (click)="navigate('/perfil')">
              <div class="btn-icon">📊</div>
              <span class="btn-title">ESTADÍSTICAS</span>
            </button>
          </div>
        </div>
      </div>
      
      <button class="btn-rules" (click)="navigate('/reglas')">📖 VER REGLAS DEL JUEGO</button>
    </div>
  `,
  styles: [`
    .menu-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 30px 20px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    /* === ENCABEZADO === */
    .menu-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 28px;
      border-radius: 12px;
      position: relative;
      overflow: hidden;
    }

    .menu-header::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #dc2626, #ffcb05, #3b82f6);
    }

    .logo-area {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    /* Mini Pokebola animada */
    .pokeball-logo {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      position: relative;
      border: 3px solid #000;
      overflow: hidden;
      box-shadow: 3px 3px 0 #000;
      animation: pokeball-bounce 2s ease-in-out infinite;
    }

    @keyframes pokeball-bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }

    .pokeball-top {
      position: absolute;
      top: 0;
      width: 100%;
      height: 50%;
      background: #dc2626;
    }

    .pokeball-bottom {
      position: absolute;
      bottom: 0;
      width: 100%;
      height: 50%;
      background: #fff;
    }

    .pokeball-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 14px;
      height: 14px;
      background: #fff;
      border-radius: 50%;
      border: 3px solid #000;
      z-index: 2;
    }

    .logo-text h2 {
      font-size: 1rem;
      margin: 0;
      line-height: 1;
    }

    .subtitle {
      font-family: 'VT323', monospace;
      font-size: 1.2rem;
      color: #94a3b8;
      letter-spacing: 0.3em;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .trainer-badge {
      padding: 8px 16px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      border-radius: 8px;
    }

    .badge-label {
      font-family: 'Press Start 2P', monospace;
      font-size: 0.35rem;
      color: #ffcb05;
    }

    .badge-name {
      font-family: 'VT323', monospace;
      font-size: 1.4rem;
      color: #fff;
    }

    .btn-logout-menu {
      background: #dc2626;
      border: 3px solid #000;
      color: #fff;
      padding: 8px 14px;
      border-radius: 6px;
      cursor: pointer;
      font-family: 'Press Start 2P', monospace;
      font-size: 0.4rem;
      box-shadow: 3px 3px 0 #000;
      transition: all 0.1s ease;
    }

    .btn-logout-menu:hover {
      background: #ef4444;
    }

    .btn-logout-menu:active {
      transform: translate(2px, 2px);
      box-shadow: 1px 1px 0 #000;
    }

    /* === GRID === */
    .menu-grid {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .menu-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding-bottom: 6px;
      border-bottom: 3px solid #000;
    }

    .section-icon {
      font-size: 1.4rem;
    }

    .section-header h3 {
      font-size: 0.6rem;
      margin: 0;
    }

    .buttons-layout {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .buttons-layout.cols-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .buttons-layout.cols-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }

    @media (max-width: 768px) {
      .buttons-layout.cols-2, .buttons-layout.cols-3 {
        grid-template-columns: 1fr;
      }
      .menu-header {
        flex-direction: column;
        gap: 16px;
        align-items: flex-start;
      }
      .user-info {
        width: 100%;
        justify-content: space-between;
      }
    }

    /* === BOTONES DEL MENÚ === */
    .menu-btn {
      background: #1e293b;
      border: 3px solid #000;
      border-radius: 10px;
      padding: 18px 20px;
      text-align: left;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 14px;
      box-shadow: 4px 4px 0 #000;
      transition: all 0.1s ease;
      position: relative;
      overflow: hidden;
    }

    .menu-btn::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 203, 5, 0.05), transparent);
      transition: left 0.4s ease;
    }

    .menu-btn:hover::before {
      left: 100%;
    }

    .menu-btn:hover {
      border-color: #ffcb05;
      transform: translateY(-3px);
      box-shadow: 4px 7px 0 #000;
    }

    .menu-btn:active {
      transform: translate(2px, 2px);
      box-shadow: 2px 2px 0 #000;
    }

    .btn-vs-ia {
      border-left: 5px solid #3b82f6;
    }

    .btn-vs-ia:hover {
      border-left-color: #60a5fa;
    }

    .btn-online {
      border-left: 5px solid #8b5cf6;
    }

    .btn-online:hover {
      border-left-color: #a78bfa;
    }

    .btn-icon {
      font-size: 1.8rem;
      flex-shrink: 0;
    }

    .btn-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex-grow: 1;
    }

    .btn-title {
      font-family: 'Press Start 2P', monospace;
      font-size: 0.5rem;
      color: #fff;
    }

    .btn-desc {
      font-family: 'VT323', monospace;
      font-size: 1rem;
      color: #94a3b8;
    }

    .btn-arrow {
      font-family: 'Press Start 2P', monospace;
      font-size: 0.6rem;
      color: #ffcb05;
      opacity: 0;
      transition: opacity 0.2s ease, transform 0.2s ease;
    }

    .menu-btn:hover .btn-arrow {
      opacity: 1;
      animation: arrow-blink 0.6s steps(2) infinite;
    }

    @keyframes arrow-blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

    /* Botones pequeños */
    .btn-small {
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 16px 12px;
      gap: 8px;
    }

    .btn-small .btn-icon {
      font-size: 1.6rem;
    }

    .btn-small .btn-title {
      font-size: 0.4rem;
    }

    /* Botón de reglas */
    .btn-rules {
      width: 100%;
      background: transparent;
      border: 3px dashed #ffcb05;
      color: #ffcb05;
      padding: 12px;
      border-radius: 8px;
      cursor: pointer;
      font-family: 'Press Start 2P', monospace;
      font-size: 0.45rem;
      transition: all 0.1s ease;
      margin-top: 8px;
    }

    .btn-rules:hover {
      background: rgba(255, 203, 5, 0.1);
      border-style: solid;
    }

    .btn-rules:active {
      transform: translate(2px, 2px);
    }
  `]
})
export class MenuComponent implements OnInit {
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);

  get username(): string {
    return this.supabaseService.userProfile()?.username || 'Entrenador';
  }

  ngOnInit() {
    this.supabaseService.syncOfflineData();
  }

  navigate(path: string) {
    this.router.navigate([path]);
  }

  async cerrarSesion() {
    try {
      await this.supabaseService.signOut();
      this.router.navigate(['/']);
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  }
}
