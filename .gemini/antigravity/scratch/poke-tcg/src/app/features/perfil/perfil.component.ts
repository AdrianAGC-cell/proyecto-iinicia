import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';
import { PartidaHistorial } from '../../core/models/partida.model';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="perfil-container">
      <div class="nav-header">
        <button class="btn-secondary" (click)="volver()">← VOLVER AL MENÚ</button>
        <h2>PERFIL DE ENTRENADOR</h2>
      </div>

      <div class="profile-layout">
        <!-- USER CARD -->
        <div class="profile-card glass">
          <div class="avatar-container">
            <div class="avatar-glow"></div>
            <div class="avatar">
              <span>{{ userLetter }}</span>
            </div>
          </div>
          <div class="user-details">
            <h3>{{ username }}</h3>
            <span class="email text-secondary">{{ email }}</span>
            <span class="points-indicator text-warning">{{ puntos }} PUNTOS TOTALES</span>
          </div>
        </div>

        <!-- STATS DASHBOARD -->
        <div class="stats-dashboard">
          <div class="stat-card glass">
            <span class="label">Partidas Jugadas</span>
            <strong class="value">{{ partidasJugadas }}</strong>
          </div>
          <div class="stat-card glass">
            <span class="label">Victorias</span>
            <strong class="value text-success">{{ victorias }}</strong>
          </div>
          <div class="stat-card glass">
            <span class="label">Derrotas</span>
            <strong class="value text-danger">{{ derrotas }}</strong>
          </div>
          <div class="stat-card glass">
            <span class="label">Porcentaje de Victoria</span>
            <strong class="value text-info">{{ winrate | number:'1.0-1' }}%</strong>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .perfil-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 20px;
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    .nav-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .nav-header h2 {
      font-size: 2rem;
      background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    /* LAYOUT */
    .profile-layout {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 32px;
      align-items: start;
    }

    @media (max-width: 768px) {
      .profile-layout {
        grid-template-columns: 1fr;
      }
    }

    .profile-card {
      padding: 40px 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 24px;
    }

    .avatar-container {
      position: relative;
      width: 100px;
      height: 100px;
    }

    .avatar-glow {
      position: absolute;
      top: -4px;
      left: -4px;
      width: 108px;
      height: 108px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
      opacity: 0.8;
      box-shadow: var(--shadow-glow);
    }

    .avatar {
      position: absolute;
      top: 0;
      left: 0;
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: var(--bg-tertiary);
      border: 2px solid var(--border-glass);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
    }

    .avatar span {
      font-size: 3rem;
      font-weight: 800;
      color: #fff;
    }

    .user-details {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .user-details h3 {
      font-size: 1.5rem;
    }

    .email {
      font-size: 0.9rem;
    }

    .points-indicator {
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 700;
      font-size: 1rem;
      margin-top: 10px;
    }

    /* STATS DASHBOARD */
    .stats-dashboard {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    @media (max-width: 480px) {
      .stats-dashboard {
        grid-template-columns: 1fr;
      }
    }

    .stat-card {
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .stat-card .label {
      font-size: 0.85rem;
      color: var(--text-secondary);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .stat-card .value {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 2.2rem;
      font-weight: 700;
    }

    .text-success { color: var(--accent-success); }
    .text-danger { color: var(--accent-danger); }
    .text-info { color: var(--accent-info); }
  `]
})
export class PerfilComponent implements OnInit {
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);

  partidas = signal<PartidaHistorial[]>([]);

  get username(): string {
    return this.supabaseService.userProfile()?.username || 'Entrenador';
  }

  get userLetter(): string {
    return this.username.charAt(0).toUpperCase();
  }

  get email(): string {
    return this.supabaseService.userProfile()?.email || '';
  }

  get puntos(): number {
    return this.supabaseService.userProfile()?.puntos || 0;
  }

  get partidasJugadas(): number {
    return this.partidas().length;
  }

  get victorias(): number {
    const user = this.supabaseService.currentUser();
    return this.partidas().filter(p => p.ganador_id === user?.id).length;
  }

  get derrotas(): number {
    return this.partidasJugadas - this.victorias;
  }

  get winrate(): number {
    if (this.partidasJugadas === 0) return 0;
    return (this.victorias / this.partidasJugadas) * 100;
  }

  async ngOnInit() {
    const user = this.supabaseService.currentUser();
    if (user) {
      try {
        const data = await this.supabaseService.getHistorialPartidas(user.id);
        this.partidas.set(data);
      } catch (err) {
        console.error('Error al cargar historial:', err);
      }
    }
  }

  volver() {
    this.router.navigate(['/menu']);
  }
}
