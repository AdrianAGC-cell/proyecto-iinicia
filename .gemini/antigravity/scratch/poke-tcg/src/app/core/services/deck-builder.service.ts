import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Mazo, MazoCarta, MazoDetallado } from '../models/mazo.model';
import { Carta } from '../models/carta.model';

@Injectable({
  providedIn: 'root'
})
export class DeckBuilderService {
  private supabaseService = inject(SupabaseService);

  validarMazo(cartas: { cartaId: number; cantidad: number }[]): { valido: boolean; error?: string } {
    const totalCartas = cartas.reduce((sum, c) => sum + c.cantidad, 0);

    if (totalCartas < 20) {
      return { valido: false, error: `El mazo tiene ${totalCartas} cartas. Debe tener al menos 20 cartas.` };
    }
    if (totalCartas > 30) {
      return { valido: false, error: `El mazo tiene ${totalCartas} cartas. Debe tener máximo 30 cartas.` };
    }

    for (const c of cartas) {
      if (c.cantidad > 4) {
        return { valido: false, error: 'No puedes incluir más de 4 copias de una misma carta.' };
      }
      if (c.cantidad < 1) {
        return { valido: false, error: 'Cantidad no válida para una carta.' };
      }
    }

    return { valido: true };
  }

  async obtenerMazos(): Promise<Mazo[]> {
    const user = this.supabaseService.currentUser();
    if (!user) throw new Error('Usuario no autenticado.');
    return await this.supabaseService.getMazos(user.id);
  }

  async obtenerDetalleMazo(mazoId: number): Promise<MazoCarta[]> {
    return await this.supabaseService.getMazoDetalle(mazoId);
  }

  async guardarMazo(
    mazoId: number | null,
    nombre: string,
    cartas: { carta_id: number; cantidad: number }[],
    esActivo = false
  ): Promise<Mazo> {
    const user = this.supabaseService.currentUser();
    if (!user) throw new Error('Usuario no autenticado.');

    const validacion = this.validarMazo(cartas.map(c => ({ cartaId: c.carta_id, cantidad: c.cantidad })));
    if (!validacion.valido) {
      throw new Error(validacion.error);
    }

    let mazo: Mazo;
    if (mazoId) {
      // Actualizar mazo existente
      const { data, error } = await this.supabaseService.supabase
        .from('mazos')
        .update({ nombre, es_mazo_activo: esActivo })
        .eq('id', mazoId)
        .select()
        .single();
      if (error) throw error;
      mazo = data as Mazo;
    } else {
      // Crear nuevo mazo
      mazo = await this.supabaseService.crearMazo(user.id, nombre, esActivo);
    }

    // Guardar cartas del mazo
    await this.supabaseService.guardarCartasMazo(mazo.id!, cartas);

    if (esActivo) {
      await this.supabaseService.setMazoActivo(user.id, mazo.id!);
    }

    return mazo;
  }

  async setMazoActivo(mazoId: number): Promise<void> {
    const user = this.supabaseService.currentUser();
    if (!user) throw new Error('Usuario no autenticado.');
    await this.supabaseService.setMazoActivo(user.id, mazoId);
  }

  async crearMazoInicial(userId: string): Promise<void> {
    // 1. Obtener las cartas globales de la base de datos
    const cartas = await this.supabaseService.getCartasGlobales();
    if (cartas.length === 0) {
      throw new Error('No hay cartas en la base de datos para generar el mazo inicial.');
    }

    // 2. Filtrar Pokémon básicos/comunes (ej: Bulbasaur, Charmander, Squirtle, Pikachu, Pidgey, Rattata, Caterpie, Weedle, Sandshrew, Geodude)
    const basicIds = [
      1, // Bulbasaur
      4, // Charmander
      7, // Squirtle
      25, // Pikachu
      10, // Caterpie
      13, // Weedle
      16, // Pidgey
      19, // Rattata
      27, // Sandshrew
      74  // Geodude
    ];

    // Encontrar estas cartas en nuestro catálogo
    const cartasBasicas = cartas.filter(c => basicIds.includes(c.pokemon_id));

    if (cartasBasicas.length === 0) {
      // Si por alguna razón no coincide el id del Pokémon, usar las primeras 10 cartas comunes
      const comunes = cartas.filter(c => c.nivel_rareza === 'Común').slice(0, 10);
      cartasBasicas.push(...comunes);
    }

    // 3. Crear registros en la colección del usuario con 4 copias de cada uno de los primeros 5 básicos (total = 20 cartas)
    // O 2 copias de 10 básicos (total = 20 cartas). Usemos 2 copias de 10 básicos para más variedad en el mazo inicial!
    const copiasPorCarta = 2;
    const cartasParaColeccion: { usuario_id: string; carta_id: number; cantidad_copias: number }[] = [];
    const cartasParaMazo: { carta_id: number; cantidad: number }[] = [];

    cartasBasicas.slice(0, 10).forEach(c => {
      cartasParaColeccion.push({
        usuario_id: userId,
        carta_id: c.id!,
        cantidad_copias: 4 // Damos 4 copias en colección
      });
      cartasParaMazo.push({
        carta_id: c.id!,
        cantidad: copiasPorCarta // Metemos 2 copias en el mazo inicial
      });
    });

    // Subir a la colección
    const { error: colError } = await this.supabaseService.supabase
      .from('coleccion_usuario')
      .insert(cartasParaColeccion);

    if (colError) throw colError;

    // 4. Crear el mazo inicial "Mazo Principal" y marcarlo como activo
    const mazo = await this.supabaseService.crearMazo(userId, 'Mazo Principal', true);

    // Guardar las cartas del mazo
    await this.supabaseService.guardarCartasMazo(mazo.id!, cartasParaMazo);
  }
}
