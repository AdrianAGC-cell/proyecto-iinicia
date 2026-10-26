import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Mazo } from '../../../core/models/mazo.model';

@Component({
  selector: 'app-mazo-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mazo-card glass" [class.activo]="mazo.es_mazo_activo">
      <div class="mazo-header">
        <h3>{{ mazo.nombre }}</h3>
        <span class="badge-activo" *ngIf="mazo.es_mazo_activo">ACTIVO</span>
      </div>
      <div class="mazo-body">
        <p class="text-secondary">Creado: {{ mazo.created_at | date:'shortDate' }}</p>
      </div>
      <div class="mazo-footer">
        <button class="btn-secondary" (click)="onEdit.emit(mazo)">EDITAR</button>
        <button class="btn-primary" *ngIf="!mazo.es_mazo_activo" (click)="onActivate.emit(mazo)">ACTIVAR</button>
      </div>
    </div>
  `,
  styles: [`
    .mazo-card {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      transition: var(--transition-fast);
      position: relative;
    }
    .mazo-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 25px rgba(0, 0, 0, 0.4);
    }
    .mazo-card.activo {
      border-color: var(--accent-success);
      box-shadow: 0 0 15px rgba(16, 185, 129, 0.2);
    }
    .mazo-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .badge-activo {
      background: rgba(16, 185, 129, 0.2);
      border: 1px solid var(--accent-success);
      color: var(--accent-success);
      font-size: 0.7rem;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 700;
    }
    .mazo-footer {
      display: flex;
      gap: 10px;
      margin-top: auto;
    }
    .mazo-footer button {
      flex: 1;
      padding: 8px 16px;
      font-size: 0.85rem;
    }
  `]
})
export class MazoViewerComponent {
  @Input() mazo!: Mazo;
  @Output() onEdit = new EventEmitter<Mazo>();
  @Output() onActivate = new EventEmitter<Mazo>();
}
