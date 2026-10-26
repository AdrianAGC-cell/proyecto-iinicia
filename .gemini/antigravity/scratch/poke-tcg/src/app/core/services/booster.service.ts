import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Carta } from '../models/carta.model';

@Injectable({
  providedIn: 'root'
})
export class BoosterService {
  private supabaseService = inject(SupabaseService);

  // Tipos de sobres
  public readonly SOBRES = [
    { id: 1, nombre: 'Básico', precio: 150, descripcion: 'Ideal para principiantes. Contiene 5 cartas.' },
    { id: 2, nombre: 'Premium', precio: 350, descripcion: 'Mayor probabilidad de raras. Contiene 5 cartas.' },
    { id: 3, nombre: 'Legendario', precio: 800, descripcion: '1 carta Legendaria GARANTIZADA. Contiene 5 cartas.' }
  ];

  async abrirSobre(sobreId: number): Promise<Carta[]> {
    const user = this.supabaseService.currentUser();
    if (!user) throw new Error('Usuario no autenticado.');

    const sobre = this.SOBRES.find(s => s.id === sobreId);
    if (!sobre) throw new Error('Sobre no válido.');

    const profile = this.supabaseService.userProfile();
    if (!profile || profile.puntos < sobre.precio) {
      throw new Error('Puntos insuficientes.');
    }

    // 1. Obtener todas las cartas
    const cartas = await this.supabaseService.getCartasGlobales();
    if (cartas.length === 0) throw new Error('No hay cartas registradas en la base de datos.');

    // 2. Agrupar por rareza
    const cartasPorRareza = {
      'Común': cartas.filter(c => c.nivel_rareza === 'Común'),
      'Poco Común': cartas.filter(c => c.nivel_rareza === 'Poco Común'),
      'Rara': cartas.filter(c => c.nivel_rareza === 'Rara'),
      'Muy Rara': cartas.filter(c => c.nivel_rareza === 'Muy Rara'),
      'Legendaria': cartas.filter(c => c.nivel_rareza === 'Legendaria')
    };

    // Asegurar que tengamos cartas en cada grupo
    const getFallbackCard = (rareza: keyof typeof cartasPorRareza): Carta => {
      const list = cartasPorRareza[rareza];
      if (list.length > 0) return list[Math.floor(Math.random() * list.length)];
      return cartas[Math.floor(Math.random() * cartas.length)];
    };

    const cartasObtenidas: Carta[] = [];

    if (sobreId === 1) {
      // Básico: Común 60%, Poco Común 25%, Rara 10%, Muy Rara 4%, Legendaria 1%
      for (let i = 0; i < 5; i++) {
        const roll = Math.random() * 100;
        let rareza: keyof typeof cartasPorRareza = 'Común';
        if (roll < 60) rareza = 'Común';
        else if (roll < 85) rareza = 'Poco Común';
        else if (roll < 95) rareza = 'Rara';
        else if (roll < 99) rareza = 'Muy Rara';
        else rareza = 'Legendaria';

        cartasObtenidas.push(getFallbackCard(rareza));
      }
    } else if (sobreId === 2) {
      // Premium: Común 30%, Poco Común 30%, Rara 25%, Muy Rara 10%, Legendaria 5%
      for (let i = 0; i < 5; i++) {
        const roll = Math.random() * 100;
        let rareza: keyof typeof cartasPorRareza = 'Común';
        if (roll < 30) rareza = 'Común';
        else if (roll < 60) rareza = 'Poco Común';
        else if (roll < 85) rareza = 'Rara';
        else if (roll < 95) rareza = 'Muy Rara';
        else rareza = 'Legendaria';

        cartasObtenidas.push(getFallbackCard(rareza));
      }
    } else if (sobreId === 3) {
      // Legendario: 4 cartas normales (Común 10%, Poco Común 20%, Rara 30%, Muy Rara 25%, Legendaria 15%) + 1 Legendaria garantizada
      for (let i = 0; i < 4; i++) {
        const roll = Math.random() * 100;
        let rareza: keyof typeof cartasPorRareza = 'Común';
        if (roll < 10) rareza = 'Común';
        else if (roll < 30) rareza = 'Poco Común';
        else if (roll < 60) rareza = 'Rara';
        else if (roll < 85) rareza = 'Muy Rara';
        else rareza = 'Legendaria';

        cartasObtenidas.push(getFallbackCard(rareza));
      }
      // Carta 5: Legendaria Garantizada
      cartasObtenidas.push(getFallbackCard('Legendaria'));
    }

    // Registrar en Supabase
    await this.supabaseService.registrarAperturaSobre(user.id, sobreId, cartasObtenidas, sobre.precio);

    return cartasObtenidas;
  }
}
