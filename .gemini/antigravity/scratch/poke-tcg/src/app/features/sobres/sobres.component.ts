import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BoosterService } from '../../core/services/booster.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { Router } from '@angular/router';
import { Carta } from '../../core/models/carta.model';
import { CartaCardComponent } from '../../shared/components/carta-card/carta-card.component';

@Component({
  selector: 'app-sobres',
  standalone: true,
  imports: [CommonModule, CartaCardComponent],
  template: `
    <div class="sobres-container">
      <div class="nav-header">
        <button class="btn-secondary" (click)="volver()">← VOLVER AL MENÚ</button>
        <h2>TIENDA DE SOBRES</h2>
        <div class="puntos-badge glass">
          <span>MIS PUNTOS:</span>
          <strong class="text-warning">{{ puntos }} PTS</strong>
        </div>
      </div>

      <div class="alert alert-danger" *ngIf="errorMessage">
        {{ errorMessage }}
      </div>

      <!-- BOOSTER PACKS LIST -->
      <div class="sobres-grid">
        <div class="sobre-card glass" *ngFor="let pack of sobres">
          <div class="sobre-glow" [ngClass]="'glow-' + pack.id"></div>
          <div class="sobre-visual">
            <div class="pack-badge">{{ pack.nombre | uppercase }}</div>
            <div class="pack-wrapper">
              <span class="pack-title">POKÉMON</span>
              <span class="pack-subtitle">TCG PACK</span>
            </div>
          </div>
          <div class="sobre-info">
            <h3>Sobre {{ pack.nombre }}</h3>
            <p class="text-secondary">{{ pack.descripcion }}</p>
          </div>
          <div class="sobre-footer">
            <span class="price">{{ pack.precio }} PTS</span>
            <button class="btn-primary" [disabled]="puntos < pack.precio || loading" (click)="comprarSobre(pack.id)">
              ABRIR SOBRE
            </button>
          </div>
        </div>
      </div>

      <!-- OVERLAY MODAL: PACK OPENING ANIMATION -->
      <div class="opening-overlay" *ngIf="mostrarModal">
        <div class="opening-content glass">
          <h3>¡Has abierto un Sobre {{ sobreAbiertoNombre }}!</h3>
          <p class="help-text text-secondary">Haz clic en cada carta para revelarla</p>

          <div class="cards-reveal-zone">
            <div class="reveal-card-container" 
                 *ngFor="let c of cartasAbiertas(); let idx = index" 
                 [class.flipped]="c.revelada"
                 (click)="revelarCarta(idx)">
              
              <!-- FACE DOWN (BACK) -->
              <div class="card-side card-back-side">
                <app-carta-card [esReverso]="true" [interactivo]="false"></app-carta-card>
              </div>

              <!-- FACE UP (FRONT) -->
              <div class="card-side card-front-side">
                <app-carta-card [carta]="c.carta" [interactivo]="false"></app-carta-card>
              </div>
            </div>
          </div>

          <div class="modal-footer" *ngIf="todasReveladas">
            <button class="btn-primary accept-btn" (click)="cerrarModal()">AÑADIR A LA COLECCIÓN</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .sobres-container {
      max-width: 1000px;
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

    .puntos-badge {
      display: flex;
      gap: 8px;
      align-items: center;
      padding: 10px 20px;
      border-radius: 10px;
    }

    .puntos-badge span {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    .puntos-badge strong {
      font-size: 1.1rem;
    }

    /* SOBRES GRID */
    .sobres-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 32px;
    }

    .sobre-card {
      padding: 24px;
      display: flex;
      flex-direction: column;
      position: relative;
      border-radius: 16px;
      overflow: hidden;
      transition: var(--transition-medium);
      height: 380px;
    }

    .sobre-card:hover {
      transform: translateY(-8px) scale(1.02);
      box-shadow: 0 15px 30px rgba(0,0,0,0.5);
    }

    .sobre-glow {
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      opacity: 0.08;
      border-radius: 40%;
      animation: rotate-glow 12s linear infinite;
    }

    .glow-1 { background: radial-gradient(circle, var(--accent-info) 0%, transparent 60%); }
    .glow-2 { background: radial-gradient(circle, var(--accent-primary) 0%, transparent 60%); }
    .glow-3 { background: radial-gradient(circle, var(--accent-warning) 0%, transparent 60%); }

    @keyframes rotate-glow {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .sobre-visual {
      flex-grow: 1;
      background: radial-gradient(circle, var(--bg-tertiary) 0%, var(--bg-secondary) 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--border-glass);
      margin-bottom: 16px;
      position: relative;
    }

    .pack-badge {
      position: absolute;
      top: 10px;
      left: 10px;
      font-size: 0.6rem;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 4px;
      background: rgba(0,0,0,0.3);
      border: 1px solid var(--border-glass);
    }

    .pack-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      border: 2px dashed rgba(255,255,255,0.08);
      padding: 24px;
      border-radius: 8px;
    }

    .pack-wrapper .pack-title {
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 800;
      font-size: 1.5rem;
      color: var(--text-muted);
      letter-spacing: 0.05em;
    }

    .pack-wrapper .pack-subtitle {
      font-size: 0.75rem;
      color: var(--text-muted);
      letter-spacing: 0.2em;
    }

    .sobre-info {
      margin-bottom: 20px;
    }

    .sobre-info h3 {
      font-size: 1.25rem;
      margin-bottom: 4px;
    }

    .sobre-info p {
      font-size: 0.85rem;
      line-height: 1.4;
    }

    .sobre-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
    }

    .sobre-footer .price {
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 700;
      font-size: 1.25rem;
    }

    /* OVERLAY MODAL */
    .opening-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(5, 5, 8, 0.95);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .opening-content {
      max-width: 1000px;
      width: 100%;
      padding: 48px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
      border-radius: 20px;
    }

    .opening-content h3 {
      font-size: 1.8rem;
      text-align: center;
      background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .help-text {
      font-size: 0.9rem;
      margin-top: -12px;
    }

    .cards-reveal-zone {
      display: flex;
      justify-content: center;
      gap: 16px;
      flex-wrap: wrap;
      perspective: 1000px; /* Enable 3D space */
      width: 100%;
      margin: 20px 0;
    }

    .reveal-card-container {
      width: 150px;
      aspect-ratio: 2 / 3;
      position: relative;
      transform-style: preserve-3d;
      transition: transform var(--transition-medium);
      cursor: pointer;
    }

    .reveal-card-container.flipped {
      transform: rotateY(180deg);
    }

    .card-side {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      backface-visibility: hidden; /* Hide back side when turned */
      -webkit-backface-visibility: hidden;
      border-radius: 12px;
    }

    .card-back-side {
      transform: rotateY(0deg);
      z-index: 2;
    }

    .card-front-side {
      transform: rotateY(180deg);
    }

    ::ng-deep .card-side app-carta-card .card-container {
      max-width: 100% !important;
    }

    .modal-footer {
      width: 100%;
      display: flex;
      justify-content: center;
      animation: fade-in 0.5s ease forwards;
    }

    .accept-btn {
      width: 250px;
    }

    @keyframes fade-in {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class SobresComponent {
  private boosterService = inject(BoosterService);
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);

  sobres = this.boosterService.SOBRES;
  loading = false;
  errorMessage = '';

  mostrarModal = false;
  sobreAbiertoNombre = '';
  cartasAbiertas = signal<{ carta: Carta; revelada: boolean }[]>([]);
  todasReveladas = false;

  get puntos(): number {
    return this.supabaseService.userProfile()?.puntos || 0;
  }

  async comprarSobre(sobreId: number) {
    this.loading = true;
    this.errorMessage = '';
    const sobre = this.sobres.find(s => s.id === sobreId);
    if (!sobre) return;

    try {
      this.sobreAbiertoNombre = sobre.nombre;
      const cartas = await this.boosterService.abrirSobre(sobreId);
      
      this.cartasAbiertas.set(cartas.map(c => ({ carta: c, revelada: false })));
      this.todasReveladas = false;
      this.mostrarModal = true;
    } catch (err: any) {
      console.error(err);
      this.errorMessage = err.message || 'Error al abrir el sobre.';
    } finally {
      this.loading = false;
    }
  }

  revelarCarta(idx: number) {
    const list = [...this.cartasAbiertas()];
    if (!list[idx].revelada) {
      list[idx].revelada = true;
      this.cartasAbiertas.set(list);
      
      // Comprobar si todas fueron reveladas
      this.todasReveladas = list.every(c => c.revelada);
    }
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.cartasAbiertas.set([]);
    this.todasReveladas = false;
  }

  volver() {
    this.router.navigate(['/menu']);
  }
}
