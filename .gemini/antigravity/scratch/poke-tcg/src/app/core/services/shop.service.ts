import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { TiendaItem, InventarioAccesorio } from '../models/accesorio.model';
import { EquipamientoUsuario } from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class ShopService {
  private supabaseService = inject(SupabaseService);

  async obtenerCatalogo(): Promise<TiendaItem[]> {
    return await this.supabaseService.getTiendaItems();
  }

  async obtenerInventarioUsuario(userId: string): Promise<InventarioAccesorio[]> {
    return await this.supabaseService.getInventarioAccesorios(userId);
  }

  async comprarAccesorio(itemId: number, precio: number): Promise<void> {
    const user = this.supabaseService.currentUser();
    if (!user) throw new Error('Usuario no autenticado.');
    await this.supabaseService.comprarAccesorio(user.id, itemId, precio);
  }

  async obtenerEquipamiento(userId: string): Promise<EquipamientoUsuario | null> {
    return await this.supabaseService.getEquipamiento(userId);
  }

  async equiparAccesorio(itemId: number | null, tipo: 'funda_carta' | 'tapete' | 'funda_mazo' | 'foto_perfil'): Promise<void> {
    const user = this.supabaseService.currentUser();
    if (!user) throw new Error('Usuario no autenticado.');

    const currentEq = await this.obtenerEquipamiento(user.id) || { usuario_id: user.id };
    
    const key = this.mapTipoToField(tipo);
    const updatedEq = {
      ...currentEq,
      [key]: itemId
    };

    await this.supabaseService.equiparAccesorio(user.id, updatedEq);
  }

  private mapTipoToField(tipo: string): string {
    switch (tipo) {
      case 'funda_carta': return 'funda_carta_id';
      case 'tapete': return 'tapete_id';
      case 'funda_mazo': return 'funda_mazo_id';
      case 'foto_perfil': return 'foto_perfil_id';
      default: throw new Error('Tipo de accesorio inválido');
    }
  }
}
