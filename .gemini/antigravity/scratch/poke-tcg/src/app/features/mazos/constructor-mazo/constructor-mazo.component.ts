import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DeckBuilderService } from '../../../core/services/deck-builder.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { ColeccionUsuario, Carta } from '../../../core/models/carta.model';
import { CartaCardComponent } from '../../../shared/components/carta-card/carta-card.component';

@Component({
  selector: 'app-constructor-mazo',
  standalone: true,
  imports: [CommonModule, FormsModule, CartaCardComponent],
  template: `
    <div class="constructor-container">
      <!-- HEADER -->
      <div class="nav-header">
        <button class="btn-secondary" (click)="cancelar()">← CANCELAR</button>
        <h2>{{ mazoId ? 'EDITAR MAZO' : 'NUEVO MAZO' }}</h2>
        <div class="deck-name-box">
          <input type="text" class="input-control name-input" placeholder="Nombre del mazo..." [(ngModel)]="nombreMazo" required />
          <div class="active-check">
            <input type="checkbox" id="esActivo" [(ngModel)]="esActivo" />
            <label for="esActivo">Definir como activo</label>
          </div>
        </div>
        <div class="counter-badge" [class.valid]="totalCartasMazo >= 20 && totalCartasMazo <= 30">
          <span>CARTAS:</span>
          <strong>{{ totalCartasMazo }} / 30</strong>
        </div>
        <button class="btn-primary" (click)="guardarMazo()" [disabled]="!nombreMazo.trim() || totalCartasMazo < 20 || totalCartasMazo > 30">
          GUARDAR MAZO
        </button>
      </div>

      <div class="alert alert-danger" *ngIf="errorMessage">
        {{ errorMessage }}
      </div>

      <div class="editor-grid">
        <!-- LEFT: USER COLLECTION (AVAILABLE CARDS) -->
        <div class="editor-pane glass">
          <h3>MI COLECCIÓN</h3>
          <p class="pane-help text-secondary">Haz clic en una carta para añadirla a tu mazo (Máx. 4 copias)</p>
          
          <div class="pane-scroll">
            <div class="cards-grid">
              <div class="card-item" *ngFor="let item of coleccionDisponible()">
                <app-carta-card 
                  [carta]="item.carta" 
                  [cantidad]="item.cantidad_copias" 
                  (cardClick)="agregarAlMazo(item.carta!)">
                </app-carta-card>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT: DECK IN CONSTRUCTION -->
        <div class="editor-pane glass">
          <h3>CARTAS EN EL MAZO</h3>
          <p class="pane-help text-secondary">Haz clic en una carta para quitarla del mazo</p>

          <div class="pane-scroll">
            <div class="cards-grid" *ngIf="cartasMazo().length > 0; else emptyMazo">
              <div class="card-item" *ngFor="let item of cartasMazo()">
                <app-carta-card 
                  [carta]="item.carta" 
                  [cantidad]="item.cantidad" 
                  (cardClick)="quitarDelMazo(item.carta)">
                </app-carta-card>
              </div>
            </div>
            
            <ng-template #emptyMazo>
              <div class="empty-deck-state">
                <p class="text-secondary">Tu mazo está vacío. Añade entre 20 y 30 cartas.</p>
              </div>
            </ng-template>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .constructor-container {
      max-width: 1300px;
      margin: 0 auto;
      padding: 40px 20px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .nav-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .nav-header h2 {
      font-size: 1.8rem;
      background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .deck-name-box {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 250px;
    }

    .name-input {
      padding: 8px 12px;
      font-size: 0.95rem;
    }

    .active-check {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    .counter-badge {
      padding: 10px 16px;
      border-radius: 8px;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5;
    }

    .counter-badge.valid {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #a7f3d0;
    }

    /* GRID */
    .editor-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      height: 70vh;
    }

    @media (max-width: 992px) {
      .editor-grid {
        grid-template-columns: 1fr;
        height: auto;
      }
    }

    .editor-pane {
      display: flex;
      flex-direction: column;
      padding: 24px;
      height: 100%;
      overflow: hidden;
    }

    .editor-pane h3 {
      font-size: 1.1rem;
      color: var(--accent-primary);
      margin-bottom: 4px;
    }

    .pane-help {
      font-size: 0.75rem;
      margin-bottom: 16px;
    }

    .pane-scroll {
      flex-grow: 1;
      overflow-y: auto;
      padding-right: 8px;
    }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 12px;
    }

    .card-item {
      width: 100%;
    }

    /* Adjust Card size in editor */
    ::ng-deep .card-item .card-container {
      max-width: 100% !important;
    }

    .empty-deck-state {
      height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px dashed var(--border-glass);
      border-radius: 12px;
    }
  `]
})
export class ConstructorMazoComponent implements OnInit {
  private deckBuilderService = inject(DeckBuilderService);
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  mazoId: number | null = null;
  nombreMazo = '';
  esActivo = false;
  errorMessage = '';

  coleccionCompleta: ColeccionUsuario[] = [];
  // Copia modificada localmente para ver cuántas copias quedan disponibles
  coleccionDisponible = signal<ColeccionUsuario[]>([]);
  // Cartas en el mazo: id de la carta y cantidad
  cartasMazo = signal<{ carta: Carta; cantidad: number }[]>([]);

  get totalCartasMazo(): number {
    return this.cartasMazo().reduce((sum, item) => sum + item.cantidad, 0);
  }

  async ngOnInit() {
    // 1. Obtener ID del mazo de los parámetros de la URL
    const idParam = this.route.snapshot.queryParams['id'];
    if (idParam) {
      this.mazoId = parseInt(idParam, 10);
    }

    // 2. Cargar colección del usuario
    const user = this.supabaseService.currentUser();
    if (user) {
      try {
        this.coleccionCompleta = await this.supabaseService.getColeccionUsuario(user.id);
        
        if (this.mazoId) {
          // Cargar mazo existente
          const mazos = await this.deckBuilderService.obtenerMazos();
          const m = mazos.find(x => x.id === this.mazoId);
          if (m) {
            this.nombreMazo = m.nombre;
            this.esActivo = m.es_mazo_activo;
          }

          const cartasDetalle = await this.deckBuilderService.obtenerDetalleMazo(this.mazoId);
          const cartasMap = cartasDetalle.map(c => ({
            carta: c.carta!,
            cantidad: c.cantidad
          }));
          this.cartasMazo.set(cartasMap);
        }

        this.actualizarColeccionDisponible();
      } catch (err) {
        console.error('Error al inicializar editor:', err);
      }
    }
  }

  actualizarColeccionDisponible() {
    const mazo = this.cartasMazo();
    
    // Clonar la colección para modificar las copias restantes
    const disponible = this.coleccionCompleta.map(c => {
      const enMazo = mazo.find(item => item.carta.id === c.carta_id);
      const copiasEnMazo = enMazo ? enMazo.cantidad : 0;
      return {
        ...c,
        cantidad_copias: c.cantidad_copias - copiasEnMazo
      };
    }).filter(c => c.cantidad_copias > 0); // Solo mostrar cartas con copias disponibles

    this.coleccionDisponible.set(disponible);
  }

  agregarAlMazo(carta: Carta) {
    const mazo = [...this.cartasMazo()];
    const enMazo = mazo.find(item => item.carta.id === carta.id);

    if (this.totalCartasMazo >= 30) {
      this.errorMessage = 'No puedes añadir más de 30 cartas al mazo.';
      return;
    }

    if (enMazo) {
      if (enMazo.cantidad >= 4) {
        this.errorMessage = 'No puedes incluir más de 4 copias de una misma carta.';
        return;
      }
      enMazo.cantidad++;
    } else {
      mazo.push({ carta, cantidad: 1 });
    }

    this.errorMessage = '';
    this.cartasMazo.set(mazo);
    this.actualizarColeccionDisponible();
  }

  quitarDelMazo(carta: Carta) {
    let mazo = [...this.cartasMazo()];
    const enMazo = mazo.find(item => item.carta.id === carta.id);

    if (enMazo) {
      enMazo.cantidad--;
      if (enMazo.cantidad <= 0) {
        mazo = mazo.filter(item => item.carta.id !== carta.id);
      }
    }

    this.errorMessage = '';
    this.cartasMazo.set(mazo);
    this.actualizarColeccionDisponible();
  }

  async guardarMazo() {
    this.errorMessage = '';
    try {
      const cartasFormateadas = this.cartasMazo().map(c => ({
        carta_id: c.carta.id!,
        cantidad: c.cantidad
      }));

      await this.deckBuilderService.guardarMazo(
        this.mazoId,
        this.nombreMazo,
        cartasFormateadas,
        this.esActivo
      );

      this.router.navigate(['/mis-mazos']);
    } catch (err: any) {
      console.error(err);
      this.errorMessage = err.message || 'Error al guardar el mazo.';
    }
  }

  cancelar() {
    this.router.navigate(['/mis-mazos']);
  }
}
