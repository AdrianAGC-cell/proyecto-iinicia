import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DeckBuilderService } from '../../../core/services/deck-builder.service';
import { Mazo } from '../../../core/models/mazo.model';
import { MazoViewerComponent } from '../../../shared/components/mazo-viewer/mazo-viewer.component';

@Component({
  selector: 'app-mis-mazos',
  standalone: true,
  imports: [CommonModule, MazoViewerComponent],
  template: `
    <div class="mazos-container">
      <div class="nav-header">
        <button class="btn-secondary" (click)="volver()">← VOLVER AL MENÚ</button>
        <h2>MIS MAZOS</h2>
        <button class="btn-primary" (click)="crearNuevoMazo()">+ CREAR MAZO</button>
      </div>

      <div class="mazos-grid" *ngIf="mazos().length > 0; else emptyState">
        <div class="mazo-item" *ngFor="let m of mazos()">
          <app-mazo-viewer 
            [mazo]="m" 
            (onEdit)="editarMazo(m)" 
            (onActivate)="activarMazo(m)">
          </app-mazo-viewer>
        </div>
      </div>

      <ng-template #emptyState>
        <div class="empty-box glass">
          <p class="text-secondary">Aún no tienes ningún mazo. ¡Crea uno nuevo para empezar a jugar!</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .mazos-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 40px 20px;
      display: flex;
      flex-direction: column;
      gap: 32px;
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

    .mazos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
    }

    .empty-box {
      padding: 60px;
      text-align: center;
      border-radius: 12px;
    }
  `]
})
export class MisMazosComponent implements OnInit {
  private deckBuilderService = inject(DeckBuilderService);
  private router = inject(Router);

  mazos = signal<Mazo[]>([]);

  async ngOnInit() {
    await this.cargarMazos();
  }

  async cargarMazos() {
    try {
      const data = await this.deckBuilderService.obtenerMazos();
      this.mazos.set(data);
    } catch (err) {
      console.error('Error al cargar mazos:', err);
    }
  }

  crearNuevoMazo() {
    // Redirigir al constructor sin ID de mazo
    this.router.navigate(['/constructor-mazo']);
  }

  editarMazo(mazo: Mazo) {
    // Redirigir al constructor con ID del mazo
    this.router.navigate(['/constructor-mazo'], { queryParams: { id: mazo.id } });
  }

  async activarMazo(mazo: Mazo) {
    try {
      await this.deckBuilderService.setMazoActivo(mazo.id!);
      await this.cargarMazos();
    } catch (err) {
      console.error('Error al activar mazo:', err);
    }
  }

  volver() {
    this.router.navigate(['/menu']);
  }
}
