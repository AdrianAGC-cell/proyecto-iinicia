import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SupabaseService } from './supabase.service';
import { OfflineStorageService } from './offline-storage.service';
import { Carta } from '../models/carta.model';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PokemonApiService {
  private http = inject(HttpClient);
  private supabaseService = inject(SupabaseService);
  private offlineStorage = inject(OfflineStorageService);

  private pokeApiUrl = 'https://pokeapi.co/api/v2/pokemon';

  async checkAndSeedDatabase(): Promise<Carta[]> {
    // 1. Intentar obtener cartas globales de Supabase
    try {
      let cartas = await this.supabaseService.getCartasGlobales();

      if (cartas.length === 0) {
        console.log('La base de datos de cartas está vacía. Iniciando seeding desde PokéAPI...');
        cartas = await this.seedFromPokeApi(0, 386);
      } else if (cartas.length < 386) {
        console.log(`La BD tiene ${cartas.length} cartas. Faltan cartas de otras generaciones. Obteniendo restantes...`);
        const nuevasCartas = await this.seedFromPokeApi(cartas.length, 386 - cartas.length);
        cartas = [...cartas, ...nuevasCartas];
      } else {
        console.log(`Se cargaron ${cartas.length} cartas desde Supabase.`);
      }

      // Guardar en almacenamiento local (IndexedDB)
      await this.offlineStorage.saveCartas(cartas);
      return cartas;
    } catch (err) {
      console.warn('Fallo al conectar con Supabase. Cargando caché local...', err);
      const cartasLocales = await this.offlineStorage.getCartas();
      if (cartasLocales.length > 0) {
        return cartasLocales;
      }
      throw new Error('No hay conexión de red ni datos locales guardados.');
    }
  }

  private async seedFromPokeApi(offset: number = 0, limit: number = 386): Promise<Carta[]> {
    const listResponse: any = await firstValueFrom(
      this.http.get(`${this.pokeApiUrl}?offset=${offset}&limit=${limit}`)
    );
    const results = listResponse.results;
    const cartasAInsertar: Carta[] = [];

    // Hacemos las peticiones de detalle en lotes pequeños para no sobrecargar
    const batchSize = 25;
    for (let i = 0; i < results.length; i += batchSize) {
      const batch = results.slice(i, i + batchSize);
      const batchPromises = batch.map((p: any) => firstValueFrom(this.http.get(p.url)));
      const details = await Promise.all(batchPromises);

      for (const d of details as any[]) {
        const stats = d.stats;
        const hpBase = stats[0].base_stat;
        const attackBase = stats[1].base_stat;
        const defenseBase = stats[2].base_stat;

        // Rareza basada en la suma de todas las stats base
        const totalStats = stats.reduce((sum: number, s: any) => sum + s.base_stat, 0);
        let rareza: 'Común' | 'Poco Común' | 'Rara' | 'Muy Rara' | 'Legendaria' = 'Común';
        if (totalStats >= 550) {
          rareza = 'Legendaria';
        } else if (totalStats >= 480) {
          rareza = 'Muy Rara';
        } else if (totalStats >= 400) {
          rareza = 'Rara';
        } else if (totalStats >= 310) {
          rareza = 'Poco Común';
        }

        const tipo1 = d.types[0]?.type.name || 'normal';
        const tipo2 = d.types[1]?.type.name || null;

        const habilidad = this.generarHabilidadPorTipo(tipo1);

        const nombreFormateado = d.name.charAt(0).toUpperCase() + d.name.slice(1);
        const imagen = d.sprites.other['official-artwork'].front_default || d.sprites.front_default || '';

        const desc = `Un poderoso Pokémon de tipo ${tipo1} originario de la región de Kanto.`;

        cartasAInsertar.push({
          pokemon_id: d.id,
          nombre: nombreFormateado,
          imagen_url: imagen,
          tipo_principal: tipo1,
          tipo_secundario: tipo2,
          puntos_ataque: attackBase * 2,
          puntos_defensa: defenseBase * 2,
          puntos_vida: hpBase * 3,
          habilidad_especial: habilidad,
          nivel_rareza: rareza,
          descripcion_breve: desc
        });
      }
    }

    // Insertar en Supabase cartas
    const { data, error } = await this.supabaseService.supabase
      .from('cartas')
      .insert(cartasAInsertar)
      .select();

    if (error) {
      console.error('Error al insertar cartas en Supabase:', error);
      throw error;
    }

    console.log('Seeding completado con éxito.');
    return data as Carta[];
  }

  private generarHabilidadPorTipo(tipo: string): string {
    switch (tipo.toLowerCase()) {
      case 'fire':
        return 'Quemadura: Resta 30 HP extra al rival.';
      case 'water':
        return 'Curación: Recupera 60 HP del usuario.';
      case 'grass':
        return 'Drenaje: Roba 40 HP de la carta rival.';
      case 'electric':
        return 'Parálisis: Paraliza al rival por 1 turno.';
      case 'psychic':
        return 'Escudo Psíquico: Reduce a la mitad el daño recibido.';
      case 'ice':
        return 'Congelación: Reduce en -20 el ataque del oponente.';
      case 'fighting':
        return 'Furia: Aumenta tu ataque en +30 si el HP es menor a la mitad.';
      case 'poison':
        return 'Veneno: Daña 25 HP por turno al oponente.';
      default:
        return 'Placaje: Inflige 15 HP extra de daño directo.';
    }
  }
}
