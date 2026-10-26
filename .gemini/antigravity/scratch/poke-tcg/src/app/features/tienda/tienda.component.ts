import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ShopService } from '../../core/services/shop.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { TiendaItem, InventarioAccesorio } from '../../core/models/accesorio.model';

@Component({
  selector: 'app-tienda',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tienda-container">
      <div class="nav-header">
        <button class="btn-secondary" (click)="volver()">← VOLVER AL MENÚ</button>
        <h2>TIENDA COSMÉTICA</h2>
        <div class="puntos-badge glass">
          <span>MIS PUNTOS:</span>
          <strong class="text-warning">{{ puntos }} PTS</strong>
        </div>
      </div>

      <div class="alert alert-danger" *ngIf="errorMessage">
        {{ errorMessage }}
      </div>

      <!-- PRODUCTS GRID -->
      <div class="products-grid" *ngIf="productos().length > 0; else emptyCatalogo">
        <div class="product-card glass" *ngFor="let item of productos()" [class.bought]="estaComprado(item.id)">
          <div class="product-badge">{{ item.tipo | uppercase }}</div>
          <div class="product-image-box">
            <img [src]="item.imagen_url || 'assets/default_item.png'" [alt]="item.nombre" class="product-image" />
          </div>
          <div class="product-info">
            <h3>{{ item.nombre }}</h3>
            <span class="rarity text-secondary">Rareza: {{ item.rareza || 'Común' }}</span>
          </div>
          <div class="product-footer">
            <span class="price" *ngIf="!estaComprado(item.id)">{{ item.priceFormatted }} PTS</span>
            <span class="owned-text" *ngIf="estaComprado(item.id)">COMPRADO</span>
            
            <button class="btn-primary buy-btn" 
                    *ngIf="!estaComprado(item.id)" 
                    [disabled]="puntos < item.precio || loadingId === item.id"
                    (click)="comprar(item)">
              {{ loadingId === item.id ? 'COMPRANDO...' : 'COMPRAR' }}
            </button>
          </div>
        </div>
      </div>

      <ng-template #emptyCatalogo>
        <div class="empty-box glass">
          <p class="text-secondary">Cargando catálogo de artículos...</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .tienda-container {
      max-width: 1100px;
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

    /* GRID */
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 24px;
    }

    .product-card {
      padding: 20px;
      display: flex;
      flex-direction: column;
      position: relative;
      border-radius: 12px;
      transition: var(--transition-fast);
    }

    .product-card:hover {
      transform: translateY(-4px);
    }

    .product-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-glass);
      font-size: 0.65rem;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 700;
      color: var(--text-secondary);
    }

    .product-image-box {
      aspect-ratio: 4 / 3;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0,0,0,0.15);
      border-radius: 8px;
      margin-bottom: 16px;
      overflow: hidden;
      border: 1px solid var(--border-glass);
    }

    .product-image {
      max-height: 80%;
      max-width: 80%;
      object-fit: contain;
    }

    .product-info {
      margin-bottom: 20px;
    }

    .product-info h3 {
      font-size: 1.1rem;
      margin-bottom: 4px;
    }

    .rarity {
      font-size: 0.75rem;
    }

    .product-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
    }

    .price {
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 700;
      font-size: 1.1rem;
    }

    .owned-text {
      color: var(--accent-success);
      font-weight: 800;
      font-size: 0.9rem;
    }

    .buy-btn {
      padding: 8px 16px;
      font-size: 0.85rem;
    }

    .product-card.bought {
      border-color: rgba(16, 185, 129, 0.15);
    }

    .empty-box {
      padding: 60px;
      text-align: center;
      border-radius: 12px;
    }
  `]
})
export class TiendaComponent implements OnInit {
  private shopService = inject(ShopService);
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);

  productos = signal<(TiendaItem & { priceFormatted: string })[]>([]);
  inventario = signal<InventarioAccesorio[]>([]);
  
  loadingId: number | null = null;
  errorMessage = '';

  get puntos(): number {
    return this.supabaseService.userProfile()?.puntos || 0;
  }

  async ngOnInit() {
    await this.cargarDatos();
  }

  async cargarDatos() {
    const user = this.supabaseService.currentUser();
    if (!user) {
      this.errorMessage = 'No hay entrenador activo en la sesión.';
      return;
    }

    try {
      this.errorMessage = '';
      const items = await this.shopService.obtenerCatalogo();
      this.productos.set(items.map(p => ({ ...p, priceFormatted: p.precio.toString() })));

      const inv = await this.shopService.obtenerInventarioUsuario(user.id);
      this.inventario.set(inv);
    } catch (err: any) {
      console.error('Error al cargar tienda:', err);
      this.errorMessage = 'Error al conectar con la base de datos de accesorios: ' + (err.message || err);
    }
  }

  estaComprado(itemId: number): boolean {
    return this.inventario().some(inv => inv.item_id === itemId);
  }

  async comprar(item: TiendaItem) {
    this.loadingId = item.id;
    this.errorMessage = '';
    try {
      await this.shopService.comprarAccesorio(item.id, item.precio);
      await this.cargarDatos();
    } catch (err: any) {
      console.error(err);
      this.errorMessage = err.message || 'Fallo al procesar la compra.';
    } finally {
      this.loadingId = null;
    }
  }

  volver() {
    this.router.navigate(['/menu']);
  }
}
