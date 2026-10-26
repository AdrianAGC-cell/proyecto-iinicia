import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { GameLogicService } from '../../../core/services/game-logic.service';
import { DeckBuilderService } from '../../../core/services/deck-builder.service';

import { EstadoJuego, CartaEnJuego, DetalleJugador, PartidaEnLinea } from '../../../core/models/partida.model';
import { Carta } from '../../../core/models/carta.model';
import { RealtimeChannel } from '@supabase/supabase-js';
import { TapeteComponent } from '../../../shared/components/tapete/tapete.component';
import { CartaCardComponent } from '../../../shared/components/carta-card/carta-card.component';

@Component({
  selector: 'app-online',
  standalone: true,
  imports: [CommonModule, FormsModule, TapeteComponent, CartaCardComponent],
  templateUrl: './online.component.html',
  styleUrls: ['./online.component.css']
})
export class OnlineComponent implements OnInit, OnDestroy {
  public supabaseService = inject(SupabaseService);
  public gameLogic = inject(GameLogicService);
  public deckBuilder = inject(DeckBuilderService);

  public router = inject(Router);

  userId = '';
  username = '';
  
  // UI states
  enSala = false;
  codigoSala = '';
  codigoJoin = '';
  esCreador = false;
  loading = false;
  noActiveDeck = false;
  errorMessage = '';

  // Partida actual
  salaInfo?: PartidaEnLinea;
  gameState = signal<EstadoJuego | null>(null);
  logs: string[] = [];
  cartaAtacanteIndex: number | null = null;
  
  // Realtime channel
  private channel?: RealtimeChannel;

  async ngOnInit() {
    const user = this.supabaseService.currentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }
    this.userId = user.id;
    this.username = this.supabaseService.userProfile()?.username || 'Entrenador';
  }

  ngOnDestroy() {
    this.desconectarSala();
  }

  generarCodigoSala(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // ==========================================
  // FLUJO DE SALAS
  // ==========================================
  async crearSala() {
    this.loading = true;
    this.errorMessage = '';
    
    try {
      const jMazo = await this.obtenerMazoPlan();
      if (jMazo.length === 0) throw new Error('Mazo no configurado correctamente.');

      const codigo = this.generarCodigoSala();
      const estadoInicial = this.gameLogic.inicializarPartida(
        this.userId,
        this.username,
        jMazo,
        '', // Aún no hay jugador 2
        'Esperando Rival...',
        [],
        'vs_Jugador',
        codigo
      );

      this.salaInfo = await this.supabaseService.crearSalaOnline(codigo, this.userId, estadoInicial);
      this.codigoSala = codigo;
      this.esCreador = true;
      this.enSala = true;
      this.gameState.set(estadoInicial);
      
      this.logs = ['Sala creada. Comparte el código con tu rival para empezar.'];
      this.conectarRealtime(codigo);
    } catch (err: any) {
      console.error(err);
      this.errorMessage = err.message || 'Error al crear la sala.';
    } finally {
      this.loading = false;
    }
  }

  async unirseASala() {
    if (!this.codigoJoin.trim()) return;
    this.loading = true;
    this.errorMessage = '';

    try {
      const jMazo = await this.obtenerMazoPlan();
      if (jMazo.length === 0) throw new Error('Mazo no configurado correctamente.');

      const codigo = this.codigoJoin.toUpperCase().trim();
      const sala = await this.supabaseService.unirseASalaOnline(codigo, this.userId);
      
      this.salaInfo = sala;
      this.codigoSala = codigo;
      this.esCreador = false;
      this.enSala = true;

      // Reiniciar las estadísticas locales para evitar acarrear datos de partidas anteriores
      this.gameLogic.stats.set({
        jugador1: { danioTotal: 0, pokemonEliminados: 0, curacionTotal: 0, turnosJugados: 0, ataquesUsados: 0 },
        jugador2: { danioTotal: 0, pokemonEliminados: 0, curacionTotal: 0, turnosJugados: 0, ataquesUsados: 0 }
      });

      // Generar la mano y mazo del jugador 2 en el estado
      const estadoOriginal = sala.estado_juego as EstadoJuego;
      const estadoActualizado = JSON.parse(JSON.stringify(estadoOriginal)) as EstadoJuego;
      
      // Barajar y repartir mano para jugador 2
      const mazoBarajado = this.gameLogic.barajar(jMazo);
      const mano2: CartaEnJuego[] = [];
      for (let i = 0; i < 5; i++) {
        if (mazoBarajado.length > 0) {
          const c = mazoBarajado.shift()!;
          mano2.push({
            instancia_id: 'j2_' + Math.random().toString(36).substr(2, 9),
            carta: c,
            hp_actual: c.puntos_vida,
            puede_atacar: false,
            habilidad_usada: false
          });
        }
      }

      estadoActualizado.jugador2 = {
        id: this.userId,
        username: this.username,
        mano: mano2,
        campo: [null, null, null, null],
        mazo: mazoBarajado,
        descarte: []
      };
      
      estadoActualizado.estado = 'en_curso';
      estadoActualizado.turno_actual = estadoActualizado.jugador1.id; // Inicia J1

      // Guardar actualización en Supabase
      await this.supabaseService.actualizarEstadoJuego(sala.id!, estadoActualizado, estadoActualizado.turno_actual);
      
      this.gameState.set(estadoActualizado);
      this.logs = ['¡Te has unido a la partida! Esperando turno del primer jugador.'];
      this.conectarRealtime(codigo);
    } catch (err: any) {
      console.error(err);
      this.errorMessage = err.message || 'Error al unirse a la sala. Verifica el código.';
    } finally {
      this.loading = false;
    }
  }

  async obtenerMazoPlan(): Promise<Carta[]> {
    const FALLBACK_CARTAS: Carta[] = [
      { id: 1, pokemon_id: 1, nombre: 'Bulbasaur', imagen_url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png', tipo_principal: 'grass', puntos_ataque: 196, puntos_defensa: 196, puntos_vida: 135, habilidad_especial: 'Drenaje: Roba 40 HP de la carta rival.', nivel_rareza: 'Común' },
      { id: 4, pokemon_id: 4, nombre: 'Charmander', imagen_url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png', tipo_principal: 'fire', puntos_ataque: 208, puntos_defensa: 172, puntos_vida: 117, habilidad_especial: 'Quemadura: Resta 30 HP extra al rival.', nivel_rareza: 'Común' },
      { id: 7, pokemon_id: 7, nombre: 'Squirtle', imagen_url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/7.png', tipo_principal: 'water', puntos_ataque: 192, puntos_defensa: 260, puntos_vida: 132, habilidad_especial: 'Curación: Recupera 60 HP del usuario.', nivel_rareza: 'Común' },
      { id: 25, pokemon_id: 25, nombre: 'Pikachu', imagen_url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png', tipo_principal: 'electric', puntos_ataque: 224, puntos_defensa: 156, puntos_vida: 115, habilidad_especial: 'Parálisis: Añade 20 extra de daño.', nivel_rareza: 'Común' },
      { id: 10, pokemon_id: 10, nombre: 'Caterpie', imagen_url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10.png', tipo_principal: 'bug', puntos_ataque: 120, puntos_defensa: 140, puntos_vida: 135, habilidad_especial: 'Placaje: Inflige 15 HP extra.', nivel_rareza: 'Común' },
      { id: 13, pokemon_id: 13, nombre: 'Weedle', imagen_url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/13.png', tipo_principal: 'bug', puntos_ataque: 130, puntos_defensa: 130, puntos_vida: 125, habilidad_especial: 'Placaje: Inflige 15 HP extra.', nivel_rareza: 'Común' },
      { id: 16, pokemon_id: 16, nombre: 'Pidgey', imagen_url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/16.png', tipo_principal: 'flying', puntos_ataque: 160, puntos_defensa: 170, puntos_vida: 130, habilidad_especial: 'Tornado: Inflige 20 HP extra.', nivel_rareza: 'Común' },
      { id: 19, pokemon_id: 19, nombre: 'Rattata', imagen_url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/19.png', tipo_principal: 'normal', puntos_ataque: 170, puntos_defensa: 140, puntos_vida: 110, habilidad_especial: 'Mordisco: Inflige 15 HP extra.', nivel_rareza: 'Común' },
      { id: 27, pokemon_id: 27, nombre: 'Sandshrew', imagen_url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/27.png', tipo_principal: 'ground', puntos_ataque: 190, puntos_defensa: 220, puntos_vida: 140, habilidad_especial: 'Excavar: Evita 10 HP de daño.', nivel_rareza: 'Común' },
      { id: 74, pokemon_id: 74, nombre: 'Geodude', imagen_url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/74.png', tipo_principal: 'rock', puntos_ataque: 180, puntos_defensa: 280, puntos_vida: 150, habilidad_especial: 'Defensa: Bloquea 20 HP.', nivel_rareza: 'Común' }
    ];

    let cartasGlobales: Carta[] = [];
    try {
      cartasGlobales = await this.supabaseService.getCartasGlobales();
    } catch (apiErr) {
      console.warn('Error al conectar con Supabase en Multijugador. Usando cartas de respaldo locales:', apiErr);
    }

    if (!cartasGlobales || cartasGlobales.length === 0) {
      cartasGlobales = FALLBACK_CARTAS;
    }

    const jMazo: Carta[] = [];
    const shuffleCartas = [...cartasGlobales].sort(() => 0.5 - Math.random());
    const seleccionadas = shuffleCartas.slice(0, 10);
    seleccionadas.forEach(carta => {
      jMazo.push(carta);
      jMazo.push(carta);
    });

    return jMazo;
  }

  // ==========================================
  // REALTIME SYNCHRONIZATION
  // ==========================================
  conectarRealtime(codigo: string) {
    this.channel = this.supabaseService.supabase
      .channel('room-' + codigo)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'partidas_en_linea',
        filter: `codigo_sala=eq.${codigo}`
      }, payload => {
        const data = payload.new as PartidaEnLinea;
        this.salaInfo = data;
        const oldState = this.gameState();
        const newState = data.estado_juego as EstadoJuego;
        
        this.gameState.set(newState);
        
        // Detectar si el turno ha cambiado
        if (oldState?.turno_actual !== newState.turno_actual) {
          if (newState.turno_actual === this.userId) {
            this.logs.push('¡Es tu turno! Robaste 1 carta.');
          } else {
            this.logs.push(`Turno de ${this.rival?.username || 'tu rival'}...`);
          }
        }

        // Detectar si el oponente se unió
        if (oldState?.estado === 'esperando_jugadores' && newState.estado === 'en_curso') {
          this.logs.push(`¡${newState.jugador2?.username} se ha unido al combate!`);
        }

        // Detectar fin de juego
        if (newState.estado === 'finalizada' || newState.estado === 'abandonada') {
          this.manejarFinJuego(newState);
        }
      })
      .subscribe();
  }

  desconectarSala() {
    if (this.channel) {
      this.supabaseService.supabase.removeChannel(this.channel);
    }
  }

  // ==========================================
  // GETTERS DE PROYECCIÓN
  // ==========================================
  get mio(): DetalleJugador | undefined {
    const state = this.gameState();
    if (!state) return undefined;
    return state.jugador1.id === this.userId ? state.jugador1 : state.jugador2 || undefined;
  }

  get rival(): DetalleJugador | undefined {
    const state = this.gameState();
    if (!state) return undefined;
    return state.jugador1.id === this.userId ? state.jugador2 || undefined : state.jugador1;
  }

  get esMiTurno(): boolean {
    const state = this.gameState();
    return state?.turno_actual === this.userId && state?.estado === 'en_curso';
  }

  get myStats() {
    const state = this.gameState();
    if (!state) return { danioTotal: 0, pokemonEliminados: 0, curacionTotal: 0, turnosJugados: 0 };
    const key = state.jugador1.id === this.userId ? 'jugador1' : 'jugador2';
    return this.gameLogic.stats()[key];
  }

  // ==========================================
  // ACCIONES DEL JUEGO
  // ==========================================
  async invocar(manoIndex: number) {
    if (!this.esMiTurno) {
      this.logs.push(`No puedes jugar, no es tu turno. (Turno actual: ${this.gameState()?.turno_actual})`);
      return;
    }
    const state = this.gameState();
    const miJugador = this.mio;
    if (!state || !miJugador) {
      this.logs.push('Error: Estado o jugador no encontrado.');
      return;
    }

    const slotLibreIdx = miJugador.campo.findIndex(c => c === null);
    if (slotLibreIdx === -1) {
      this.logs.push('Tu campo está lleno.');
      return;
    }

    const key = state.jugador1.id === this.userId ? 'jugador1' : 'jugador2';
    
    // Ejecutar lógica de invocación en estado local
    this.gameLogic.gameState.set(state); // Cargar estado actual
    const success = this.gameLogic.invocarCarta(key, manoIndex, slotLibreIdx);

    if (success) {
      const actualizado = this.gameLogic.gameState()!;
      this.gameState.set(actualizado);
      this.logs.push(`Invocaste una carta en el slot ${slotLibreIdx + 1}.`);
      
      // Subir a Supabase
      await this.supabaseService.actualizarEstadoJuego(this.salaInfo!.id!, actualizado, state.turno_actual);
    } else {
      const statsTurnos = this.gameLogic.stats()[key]?.turnosJugados || 0;
      this.logs.push(`Falló invocarCarta. Key: ${key}, Slot: ${slotLibreIdx}, turnosJugados: ${statsTurnos}`);
    }
  }

  async usarHabilidad(campoIndex: number) {
    if (!this.esMiTurno) return;
    const state = this.gameState();
    const miJugador = this.mio;
    const oponente = this.rival;
    if (!state || !miJugador || !oponente) return;

    const carta = miJugador.campo[campoIndex];
    if (!carta || carta.habilidad_usada) return;

    const key = state.jugador1.id === this.userId ? 'jugador1' : 'jugador2';
    const tipo = carta.carta.tipo_principal.toLowerCase();

    // Buscar objetivo automático
    let targetIdx = campoIndex;
    if (tipo === 'water') {
      let minHp = carta.hp_actual;
      miJugador.campo.forEach((c, idx) => {
        if (c && c.hp_actual < minHp) {
          minHp = c.hp_actual;
          targetIdx = idx;
        }
      });
    } else {
      const idx = oponente.campo.findIndex(c => c !== null);
      if (idx !== -1) targetIdx = idx;
    }

    this.gameLogic.gameState.set(state);
    const success = this.gameLogic.usarHabilidad(key, campoIndex, targetIdx);
    if (success) {
      const actualizado = this.gameLogic.gameState()!;
      this.gameState.set(actualizado);
      this.logs.push(`¡Habilidad especial activada por ${carta.carta.nombre}!`);

      await this.supabaseService.actualizarEstadoJuego(this.salaInfo!.id!, actualizado, state.turno_actual);
    }
  }

  seleccionarAtacante(index: number) {
    if (!this.esMiTurno) return;
    const miJugador = this.mio;
    if (!miJugador) return;

    // Solo el Pokémon Activo (índice 0) puede atacar
    if (index !== 0) {
      this.logs.push('Solo el Pokémon Activo (Adelante) puede atacar.');
      return;
    }

    const carta = miJugador.campo[index];
    if (!carta || !carta.puede_atacar) return;

    if (this.cartaAtacanteIndex === index) {
      this.cartaAtacanteIndex = null;
    } else {
      this.cartaAtacanteIndex = index;
      this.logs.push(`Atacante ${carta.carta.nombre} seleccionado. Elige objetivo rival.`);
    }
  }

  async declararObjetivoAtaque(defensorIndex: number | null) {
    if (this.cartaAtacanteIndex === null || !this.esMiTurno) return;
    const state = this.gameState();
    if (!state) return;

    this.gameLogic.gameState.set(state);
    const success = this.gameLogic.atacar(this.cartaAtacanteIndex, defensorIndex);

    if (success) {
      const actualizado = this.gameLogic.gameState()!;
      this.gameState.set(actualizado);
      this.logs.push('Ataque ejecutado.');
      this.cartaAtacanteIndex = null;

      await this.supabaseService.actualizarEstadoJuego(this.salaInfo!.id!, actualizado, state.turno_actual);
    }
  }

  async finalizarTurno() {
    if (!this.esMiTurno) return;
    const state = this.gameState();
    if (!state) return;

    this.gameLogic.gameState.set(state);
    this.gameLogic.finalizarTurno();

    const actualizado = this.gameLogic.gameState()!;
    this.gameState.set(actualizado);
    this.logs.push('Finalizaste tu turno.');

    const turnoOponente = state.jugador1.id === this.userId ? state.jugador2!.id : state.jugador1.id;
    await this.supabaseService.actualizarEstadoJuego(this.salaInfo!.id!, actualizado, turnoOponente);
  }

  async rendirse() {
    const state = this.gameState();
    if (!state || state.estado !== 'en_curso') return;

    this.gameLogic.gameState.set(state);
    this.gameLogic.abandonarPartida(this.userId);

    const actualizado = this.gameLogic.gameState()!;
    await this.supabaseService.actualizarEstadoJuego(this.salaInfo!.id!, actualizado, state.turno_actual);
  }

  // ==========================================
  // FIN DEL JUEGO
  // ==========================================
  async manejarFinJuego(estado: EstadoJuego) {
    this.desconectarSala();
    
    const gano = estado.ganador_id === this.userId;

    this.logs.push(gano ? '¡VICTORIA! Has ganado la partida online.' : 'DERROTA. Tu rival ha ganado.');
    
    // Creador registra la partida en la tabla de historial y elimina la sala
    if (this.esCreador) {
      try {
        await this.supabaseService.registrarPartidaFinalizada({
          jugador1_id: estado.jugador1.id,
          jugador2_id: estado.jugador2?.id,
          modo: 'vs_Jugador',
          ganador_id: estado.ganador_id,
          estado: estado.estado,
          puntos_otorgados: 0
        });
        
        await this.supabaseService.eliminarSala(this.salaInfo!.id!);
      } catch (err) {
        console.error('Error al registrar partida finalizada en servidor:', err);
      }
    }
  }

  getTopDiscardUrl(descarte?: Carta[] | null): string | null {
    if (!descarte || descarte.length === 0) return null;
    return descarte[descarte.length - 1].imagen_url;
  }

  salir() {
    this.router.navigate(['/menu']);
  }
}
