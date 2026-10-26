import { Injectable, inject, signal } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { OfflineStorageService } from './offline-storage.service';
import { Carta, ColeccionUsuario } from '../models/carta.model';
import { Mazo, MazoCarta, MazoDetallado } from '../models/mazo.model';
import { Usuario, EquipamientoUsuario } from '../models/usuario.model';
import { PartidaHistorial, EstadoJuego, PartidaEnLinea } from '../models/partida.model';
import { TiendaItem, InventarioAccesorio } from '../models/accesorio.model';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private offlineStorage = inject(OfflineStorageService);
  
  public supabase: SupabaseClient;
  public currentUser = signal<User | null>(null);
  public userProfile = signal<Usuario | null>(null);
  public isOnline = signal<boolean>(navigator.onLine);
  public lastGuardStatus = signal<string>('No iniciado');

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

    // Escuchar cambios de autenticación
    this.supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user ?? null;
      if (user) {
        this.currentUser.set(user);
        // Usar .then() o ejecutar asíncronamente sin await para evitar deadlock en Supabase
        Promise.resolve().then(async () => {
          await this.loadUserProfile(user.id);
          await this.syncOfflineData();
        }).catch(err => console.error('Error en sync post-login:', err));
      } else {
        this.currentUser.set(null);
        this.userProfile.set(null);
      }
    });

    // Escuchar estado de conexión
    window.addEventListener('online', () => this.handleConnectionChange(true));
    window.addEventListener('offline', () => this.handleConnectionChange(false));
  }

  private async handleConnectionChange(online: boolean) {
    this.isOnline.set(online);
    if (online && this.currentUser()) {
      await this.syncOfflineData();
    }
  }

  // ==========================================
  // AUTHENTICATION
  // ==========================================
  
  async login(email: string, password?: string) {
    if (!password) throw new Error('Se requiere contraseña');
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });
    if (error) throw new Error('Credenciales incorrectas o el entrenador no existe.');
    
    // Forzar actualización sincrónica de la señal para que el AuthGuard no bloquee la redirección
    if (data.user) {
      this.currentUser.set(data.user);
    }
    
    return data.user;
  }

  async register(email: string, password?: string, username?: string) {
    if (!password) throw new Error('Se requiere contraseña');
    if (!username) throw new Error('Se requiere nombre de entrenador');
    
    // Intentar registrar en Supabase Auth
    const { data, error } = await this.supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { username }
      }
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Error al registrar usuario.');

    // Crear el perfil en la base de datos
    const { error: profileError } = await this.supabase.from('profiles').insert({
      id: data.user.id,
      username,
      email: email.trim(),
      puntos: 150
    });

    if (profileError) {
      if (profileError.code === '23505') {
        throw new Error('El nombre de entrenador o correo ya está en uso.');
      }
      throw new Error(profileError.message || 'No se pudo crear el perfil.');
    }

    return data.user;
  }

  async signOut() {
    try {
      await this.supabase.auth.signOut();
    } catch (err) {
      console.warn("Supabase signOut error:", err);
    }
    this.currentUser.set(null);
    this.userProfile.set(null);
  }

  async loadUserProfile(userId: string) {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error al cargar perfil:', error);
      return;
    }
    this.userProfile.set(data as Usuario);
    
    // Si tenemos sesión simulada iniciada, actualizar el perfil guardado localmente
    if (localStorage.getItem('poke_simulated_profile')) {
      localStorage.setItem('poke_simulated_profile', JSON.stringify(data));
    }
  }

  // ==========================================
  // CARTAS & COLECION
  // ==========================================
  async getCartasGlobales(): Promise<Carta[]> {
    const { data, error } = await this.supabase
      .from('cartas')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;
    return data as Carta[];
  }

  async getColeccionUsuario(userId: string): Promise<ColeccionUsuario[]> {
    const { data, error } = await this.supabase
      .from('coleccion_usuario')
      .select('*, carta:cartas(*)')
      .eq('usuario_id', userId);

    if (error) throw error;
    return data as ColeccionUsuario[];
  }

  async addCartasAColeccion(userId: string, cartasIds: number[]) {
    // Para cada carta obtenida, sumar o crear
    const coleccion = await this.getColeccionUsuario(userId);
    
    for (const cartaId of cartasIds) {
      const existing = coleccion.find(c => c.carta_id === cartaId);
      if (existing) {
        const { error } = await this.supabase
          .from('coleccion_usuario')
          .update({ cantidad_copias: existing.cantidad_copias + 1 })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await this.supabase
          .from('coleccion_usuario')
          .insert({
            usuario_id: userId,
            carta_id: cartaId,
            cantidad_copias: 1
          });
        if (error) throw error;
      }
    }
    // Recargar perfil
    await this.loadUserProfile(userId);
  }

  // ==========================================
  // MAZOS
  // ==========================================
  async getMazos(userId: string): Promise<Mazo[]> {
    const { data, error } = await this.supabase
      .from('mazos')
      .select('*')
      .eq('usuario_id', userId);

    if (error) throw error;
    return data as Mazo[];
  }

  async getMazoDetalle(mazoId: number): Promise<MazoCarta[]> {
    const { data, error } = await this.supabase
      .from('mazo_cartas')
      .select('*, carta:cartas(*)')
      .eq('mazo_id', mazoId);

    if (error) throw error;
    return data as MazoCarta[];
  }

  async crearMazo(userId: string, nombre: string, esActivo = false): Promise<Mazo> {
    const { data, error } = await this.supabase
      .from('mazos')
      .insert({
        usuario_id: userId,
        nombre,
        es_mazo_activo: esActivo
      })
      .select()
      .single();

    if (error) throw error;
    return data as Mazo;
  }

  async setMazoActivo(userId: string, mazoId: number) {
    // Desactivar todos los mazos del usuario
    await this.supabase
      .from('mazos')
      .update({ es_mazo_activo: false })
      .eq('usuario_id', userId);

    // Activar el mazo seleccionado
    const { error } = await this.supabase
      .from('mazos')
      .update({ es_mazo_activo: true })
      .eq('id', mazoId);

    if (error) throw error;
  }

  async guardarCartasMazo(mazoId: number, cartas: { carta_id: number; cantidad: number }[]) {
    // Eliminar cartas anteriores del mazo
    const { error: deleteError } = await this.supabase
      .from('mazo_cartas')
      .delete()
      .eq('mazo_id', mazoId);

    if (deleteError) throw deleteError;

    if (cartas.length > 0) {
      const inserts = cartas.map(c => ({
        mazo_id: mazoId,
        carta_id: c.carta_id,
        cantidad: c.cantidad
      }));
      const { error: insertError } = await this.supabase
        .from('mazo_cartas')
        .insert(inserts);

      if (insertError) throw insertError;
    }
  }

  // ==========================================
  // TIENDA & PERSONALIZACION
  // ==========================================
  async getTiendaItems(): Promise<TiendaItem[]> {
    const { data, error } = await this.supabase
      .from('tienda_items')
      .select('*')
      .order('precio', { ascending: true });

    if (error) throw error;
    return data as TiendaItem[];
  }

  async getInventarioAccesorios(userId: string): Promise<InventarioAccesorio[]> {
    const { data: invData, error: invError } = await this.supabase
      .from('inventario_accesorios')
      .select('*')
      .eq('usuario_id', userId);

    if (invError) throw invError;

    const { data: itemsData, error: itemsError } = await this.supabase
      .from('tienda_items')
      .select('*');

    if (itemsError) throw itemsError;

    const mapped = (invData || []).map(inv => {
      const item = (itemsData || []).find(i => i.id === inv.item_id);
      return {
        ...inv,
        item
      };
    });

    return mapped as InventarioAccesorio[];
  }

  async comprarAccesorio(userId: string, itemId: number, precio: number) {
    const profile = this.userProfile();
    if (!profile || profile.puntos < precio) {
      throw new Error('Puntos insuficientes.');
    }

    // Insertar en inventario
    const { error: inventarioError } = await this.supabase
      .from('inventario_accesorios')
      .insert({
        usuario_id: userId,
        item_id: itemId
      });

    if (inventarioError) throw inventarioError;

    // Restar puntos
    const { error: puntosError } = await this.supabase
      .from('profiles')
      .update({ puntos: profile.puntos - precio })
      .eq('id', userId);

    if (puntosError) throw puntosError;

    await this.loadUserProfile(userId);
  }

  async getEquipamiento(userId: string): Promise<EquipamientoUsuario | null> {
    const { data, error } = await this.supabase
      .from('equipamiento_usuario')
      .select('*')
      .eq('usuario_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data as EquipamientoUsuario | null;
  }

  async equiparAccesorio(userId: string, equipamiento: Partial<EquipamientoUsuario>) {
    const { error } = await this.supabase
      .from('equipamiento_usuario')
      .upsert({
        usuario_id: userId,
        ...equipamiento,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  // ==========================================
  // SOBRES
  // ==========================================
  async getSobresDisponibles() {
    const { data, error } = await this.supabase
      .from('sobres')
      .select('*');

    if (error) throw error;
    return data;
  }

  async registrarAperturaSobre(userId: string, sobreId: number, cartasObtenidas: Carta[], precio: number) {
    const profile = this.userProfile();
    if (!profile || profile.puntos < precio) {
      throw new Error('Puntos insuficientes para abrir este sobre.');
    }

    // Restar puntos
    const { error: puntosError } = await this.supabase
      .from('profiles')
      .update({ puntos: profile.puntos - precio })
      .eq('id', userId);
    if (puntosError) throw puntosError;

    // Registrar apertura
    const { error: registroError } = await this.supabase
      .from('apertura_sobres')
      .insert({
        usuario_id: userId,
        sobre_id: sobreId,
        cartas_obtenidas: cartasObtenidas
      });
    if (registroError) throw registroError;

    // Añadir cartas a colección
    const ids = cartasObtenidas.map(c => c.id!);
    await this.addCartasAColeccion(userId, ids);
  }

  // ==========================================
  // HISTORIAL DE PARTIDAS
  // ==========================================
  async getHistorialPartidas(userId: string): Promise<PartidaHistorial[]> {
    const { data, error } = await this.supabase
      .from('partidas')
      .select('*')
      .or(`jugador1_id.eq.${userId},jugador2_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as PartidaHistorial[];
  }

  async registrarPartidaFinalizada(partida: PartidaHistorial) {
    if (this.isOnline()) {
      const { error } = await this.supabase
        .from('partidas')
        .insert({
          ...partida,
          finalizada_at: new Date().toISOString()
        });
      if (error) throw error;

      // Actualizar puntos del usuario si ganó/perdió
      if (partida.jugador1_id && partida.puntos_otorgados > 0) {
        const userId = partida.jugador1_id;
        const profile = await this.supabase
          .from('profiles')
          .select('puntos')
          .eq('id', userId)
          .single();

        if (profile.data) {
          await this.supabase
            .from('profiles')
            .update({ puntos: profile.data.puntos + partida.puntos_otorgados })
            .eq('id', userId);
          await this.loadUserProfile(userId);
        }
      }
    } else {
      // Guardar localmente
      await this.offlineStorage.queuePartida(partida);
    }
  }

  // ==========================================
  // MULTIPLAYER ONLINE (REALTIME)
  // ==========================================
  async crearSalaOnline(codigo: string, jugador1Id: string, estadoInicial: EstadoJuego): Promise<PartidaEnLinea> {
    const { data, error } = await this.supabase
      .from('partidas_en_linea')
      .insert({
        codigo_sala: codigo,
        jugador1_id: jugador1Id,
        turno_actual: jugador1Id,
        estado_juego: estadoInicial
      })
      .select()
      .single();

    if (error) throw error;
    return data as PartidaEnLinea;
  }

  async unirseASalaOnline(codigo: string, jugador2Id: string): Promise<PartidaEnLinea> {
    // 1. Obtener la sala
    const { data: sala, error: getError } = await this.supabase
      .from('partidas_en_linea')
      .select('*')
      .eq('codigo_sala', codigo)
      .maybeSingle();

    if (getError) throw getError;
    if (!sala) throw new Error('La sala no existe.');
    if (sala.jugador2_id && sala.jugador2_id !== jugador2Id) {
      throw new Error('La sala ya está llena.');
    }

    // 2. Actualizar sala con jugador 2
    const { data: salaActualizada, error: updateError } = await this.supabase
      .from('partidas_en_linea')
      .update({
        jugador2_id: jugador2Id,
        ultima_actividad: new Date().toISOString()
      })
      .eq('id', sala.id)
      .select()
      .single();

    if (updateError) throw updateError;
    return salaActualizada as PartidaEnLinea;
  }

  async actualizarEstadoJuego(salaId: number, estado: EstadoJuego, turnoActual: string) {
    const { error } = await this.supabase
      .from('partidas_en_linea')
      .update({
        estado_juego: estado,
        turno_actual: turnoActual,
        ultima_actividad: new Date().toISOString()
      })
      .eq('id', salaId);

    if (error) throw error;
  }

  async eliminarSala(salaId: number) {
    await this.supabase
      .from('partidas_en_linea')
      .delete()
      .eq('id', salaId);
  }

  // ==========================================
  // OFFLINE SYNC
  // ==========================================
  async syncOfflineData() {
    const user = this.currentUser();
    if (!user) return;

    try {
      // 1. Cargar colección y mazos desde Supabase y actualizar cache local
      const cartas = await this.getCartasGlobales();
      await this.offlineStorage.saveCartas(cartas);

      const coleccion = await this.getColeccionUsuario(user.id);
      await this.offlineStorage.saveColeccion(coleccion);

      const mazos = await this.getMazos(user.id);
      await this.offlineStorage.saveMazos(mazos);

      const equipamiento = await this.getEquipamiento(user.id);
      if (equipamiento) {
        await this.offlineStorage.saveEquipamiento(equipamiento);
      }

      // 2. Subir partidas vs IA jugadas offline
      const partidasOffline = await this.offlineStorage.getQueuedPartidas();
      if (partidasOffline.length > 0) {
        for (const p of partidasOffline) {
          const { id, ...partidaSinId } = p;
          // Guardar en Supabase
          const { error } = await this.supabase.from('partidas').insert({
            ...partidaSinId,
            finalizada_at: new Date().toISOString()
          });
          
          if (!error && p.puntos_otorgados > 0) {
            // Sumar puntos
            const profile = this.userProfile();
            if (profile) {
              await this.supabase
                .from('profiles')
                .update({ puntos: profile.puntos + p.puntos_otorgados })
                .eq('id', user.id);
            }
          }
        }
        const ids = partidasOffline.map(p => p.id!).filter(Boolean);
        await this.offlineStorage.clearQueuedPartidas(ids);
        await this.loadUserProfile(user.id);
      }

      console.log('Sincronización local-remota exitosa.');
    } catch (err) {
      console.error('Error durante la sincronización:', err);
    }
  }
}
