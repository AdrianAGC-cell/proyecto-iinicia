import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';
import { PartidaHistorial } from '../../core/models/partida.model';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="historial-container">
      <div class="nav-header">
        <button class="btn-secondary" (click)="volver()">← VOLVER AL MENÚ</button>
        <h2>HISTORIAL DE PARTIDAS</h2>
      </div>

      <div class="table-container glass">
        <table class="history-table" *ngIf="partidas().length > 0; else emptyState">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Modo</th>
              <th>Resultado</th>
              <th>Puntos</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of partidas()" [class.win]="esGanador(p)" [class.loss]="!esGanador(p)">
              <td>{{ p.created_at | date:'short' }}</td>
              <td>{{ p.modo === 'vs_IA' ? 'VS Inteligencia Artificial' : 'Combate Online' }}</td>
              <td>
                <span class="result-badge" [class.badge-win]="esGanador(p)" [class.badge-loss]="!esGanador(p)">
                  {{ esGanador(p) ? 'VICTORIA' : 'DERROTA' }}
                </span>
              </td>
              <td>
                <strong class="points-reward" [class.plus]="p.puntos_otorgados > 0">
                  +{{ p.puntos_otorgados }} PTS
                </strong>
              </td>
            </tr>
          </tbody>
        </table>

        <ng-template #emptyState>
          <div class="empty-state">
            <p class="text-secondary">No has disputado ninguna partida todavía.</p>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .historial-container {
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

    .table-container {
      border-radius: 12px;
      overflow: hidden;
    }

    .history-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .history-table th, .history-table td {
      padding: 16px 24px;
    }

    .history-table th {
      background: rgba(255, 255, 255, 0.03);
      color: var(--text-secondary);
      font-size: 0.85rem;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      font-weight: 700;
    }

    .history-table tr {
      border-bottom: 1px solid var(--border-glass);
      transition: var(--transition-fast);
    }

    .history-table tr:hover {
      background: rgba(255, 255, 255, 0.02);
    }

    .result-badge {
      font-size: 0.75rem;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 4px;
    }

    .badge-win {
      background: rgba(16, 185, 129, 0.15);
      color: var(--accent-success);
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .badge-loss {
      background: rgba(239, 68, 68, 0.15);
      color: var(--accent-danger);
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .points-reward {
      font-family: 'Space Grotesk', sans-serif;
    }

    .points-reward.plus {
      color: var(--accent-warning);
    }

    .empty-state {
      padding: 60px;
      text-align: center;
    }
  `]
})
export class HistorialComponent implements OnInit {
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);

  partidas = signal<PartidaHistorial[]>([]);

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

  esGanador(partida: PartidaHistorial): boolean {
    const user = this.supabaseService.currentUser();
    return partida.ganador_id === user?.id;
  }

  volver() {
    this.router.navigate(['/menu']);
  }
}
