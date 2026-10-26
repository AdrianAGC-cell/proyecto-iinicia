import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Carta } from '../../../core/models/carta.model';

@Component({
  selector: 'app-carta-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carta-card.component.html',
  styleUrls: ['./carta-card.component.css']
})
export class CartaCardComponent {
  @Input() carta?: Carta;
  @Input() cantidad?: number;
  @Input() inGame = false;
  @Input() hpActual?: number;
  @Input() puedeAtacar = false;
  @Input() habilidadUsada = false;
  @Input() estadoEfecto?: 'quemado' | 'paralizado' | null = null;
  @Input() esReverso = false;
  @Input() reversoUrl?: string;
  @Input() seleccionado = false;
  @Input() interactivo = true;
  @Input() esRival = false;
  @Input() acciones_restantes?: number;
  @Input() targetSelected = false; // Si este Pokémon es el objetivo seleccionado

  @Output() cardClick = new EventEmitter<void>();
  @Output() useAbilityClick = new EventEmitter<void>();

  esEspecial(): boolean {
    if (!this.carta) return false;
    const r = this.carta.nivel_rareza;
    return r === 'Rara' || r === 'Muy Rara' || r === 'Legendaria';
  }

  accionesRestantesArray(): boolean[] {
    const total = this.esEspecial() ? 3 : 2;
    const current = this.acciones_restantes !== undefined ? this.acciones_restantes : total;
    const arr = [];
    for (let i = 0; i < total; i++) {
      arr.push(i < current);
    }
    return arr;
  }

  getHpPercent(): number {
    if (!this.carta || this.hpActual === undefined) return 100;
    return Math.max(0, Math.min(100, (this.hpActual / this.carta.puntos_vida) * 100));
  }

  getHpColor(): string {
    const pct = this.getHpPercent();
    if (pct > 60) return 'linear-gradient(90deg, #16a34a, #22c55e)';
    if (pct > 30) return 'linear-gradient(90deg, #ea580c, #f59e0b)';
    return 'linear-gradient(90deg, #dc2626, #ef4444)';
  }

  onClick() {
    if (this.interactivo) {
      this.cardClick.emit();
    }
  }

  onAbilityClick(event: MouseEvent) {
    event.stopPropagation();
    if (this.interactivo && !this.habilidadUsada) {
      this.useAbilityClick.emit();
    }
  }

  getRarezaClass(): string {
    if (!this.carta) return '';
    switch (this.carta.nivel_rareza) {
      case 'Poco Común': return 'rare-poco-comun';
      case 'Rara': return 'rare-rara';
      case 'Muy Rara': return 'rare-muy-rara';
      case 'Legendaria': return 'rare-legendaria';
      default: return 'rare-comun';
    }
  }

  getTypeColor(): string {
    if (!this.carta) return 'var(--text-muted)';
    const type = this.carta.tipo_principal.toLowerCase();
    return `var(--type-${type}, #777)`;
  }
}
