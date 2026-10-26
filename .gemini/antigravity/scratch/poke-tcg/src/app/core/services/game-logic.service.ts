
import { Injectable, signal } from '@angular/core';
import { EstadoJuego, CartaEnJuego, DetalleJugador } from '../models/partida.model';
import { Carta } from '../models/carta.model';

@Injectable({
  providedIn: 'root'
})
export class GameLogicService {
  private objetivoSeleccionadoId: string | null = null;

  public gameState = signal<EstadoJuego | null>(null);

  public stats = signal<{
    jugador1: { danioTotal: number, pokemonEliminados: number, curacionTotal: number, turnosJugados: number, ataquesUsados: number },
    jugador2: { danioTotal: number, pokemonEliminados: number, curacionTotal: number, turnosJugados: number, ataquesUsados: number }
  }>({
    jugador1: { danioTotal: 0, pokemonEliminados: 0, curacionTotal: 0, turnosJugados: 0, ataquesUsados: 0 },
    jugador2: { danioTotal: 0, pokemonEliminados: 0, curacionTotal: 0, turnosJugados: 0, ataquesUsados: 0 }
  });

  seleccionarObjetivo(pokemonId: string | null) {
    this.objetivoSeleccionadoId = pokemonId;
  }

  getObjetivoSeleccionadoId(): string | null {
    return this.objetivoSeleccionadoId;
  }

  /**
   * FÓRMULA DE DAÑO BALANCEADA:
   * - Base = 35% del ATK del atacante
   * - Reducción = 15% de la DEF del defensor
   * - Mínimo = 10% del HP máximo del defensor (para que siempre haga daño relevante)
   * - Resultado: cada Pokémon muere en ~3-5 golpes
   */
  calcularDanio(atacante: Carta, defensor: Carta): number {
    // Incrementado el multiplicador base de ataque para hacer más daño
    const base = atacante.puntos_ataque * 0.70; 
    const reduccion = defensor.puntos_defensa * 0.15;
    const dmgCalculado = Math.floor(base - reduccion);
    const dmgMinimo = Math.floor(defensor.puntos_vida * 0.15); // Mínimo 15% del HP máximo
    return Math.max(dmgMinimo, dmgCalculado);
  }

  barajar(cartas: Carta[]): Carta[] {
    const arr = [...cartas];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  inicializarPartida(
    j1Id: string, j1Name: string, j1Mazo: Carta[],
    j2Id: string, j2Name: string, j2Mazo: Carta[],
    modo: 'vs_IA' | 'vs_Jugador',
    codigoSala?: string
  ): EstadoJuego {
    const mazo1 = this.barajar(j1Mazo);
    const mazo2 = this.barajar(j2Mazo);

    const mano1: CartaEnJuego[] = [];
    const mano2: CartaEnJuego[] = [];

    for (let i = 0; i < 5; i++) {
      if (mazo1.length > 0) {
        const c = mazo1.shift()!;
        mano1.push({
          instancia_id: 'j1_' + Math.random().toString(36).substr(2, 9),
          carta: c,
          hp_actual: c.puntos_vida,
          puede_atacar: false,
          habilidad_usada: false,
          acciones_restantes: 0
        });
      }
      if (mazo2.length > 0) {
        const c = mazo2.shift()!;
        mano2.push({
          instancia_id: 'j2_' + Math.random().toString(36).substr(2, 9),
          carta: c,
          hp_actual: c.puntos_vida,
          puede_atacar: false,
          habilidad_usada: false,
          acciones_restantes: 0
        });
      }
    }

    const estado: EstadoJuego = {
      jugador1: {
        id: j1Id,
        username: j1Name,
        mano: mano1,
        campo: [null, null, null, null],
        mazo: mazo1,
        descarte: []
      },
      jugador2: {
        id: j2Id,
        username: j2Name,
        mano: mano2,
        campo: [null, null, null, null],
        mazo: mazo2,
        descarte: []
      },
      turno_actual: j1Id,
      fase: 'main',
      estado: modo === 'vs_Jugador' ? 'esperando_jugadores' : 'en_curso',
      codigo_sala: codigoSala,
      mensajes: []
    };

    // Resetear estadísticas
    this.stats.set({
      jugador1: { danioTotal: 0, pokemonEliminados: 0, curacionTotal: 0, turnosJugados: 0, ataquesUsados: 0 },
      jugador2: { danioTotal: 0, pokemonEliminados: 0, curacionTotal: 0, turnosJugados: 0, ataquesUsados: 0 }
    });
    this.objetivoSeleccionadoId = null;
    this.gameState.set(estado);
    return estado;
  }

  robarCarta(jugadorKey: 'jugador1' | 'jugador2'): boolean {
    const estado = this.gameState();
    if (!estado) return false;

    const jugador = estado[jugadorKey];
    if (!jugador) return false;

    if (jugador.mazo.length === 0) {
      const hasFieldCards = jugador.campo.some(c => c !== null);
      if (!hasFieldCards && jugador.mano.length === 0) {
        estado.estado = 'finalizada';
        estado.ganador_id = jugadorKey === 'jugador1' ? estado.jugador2?.id : estado.jugador1.id;
        this.gameState.set({ ...estado });
      }
      return false;
    }

    const robada = jugador.mazo.shift()!;
    if (jugador.mano.length < 7) {
      jugador.mano.push({
        instancia_id: jugadorKey + '_' + Math.random().toString(36).substr(2, 9),
        carta: robada,
        hp_actual: robada.puntos_vida,
        puede_atacar: false,
        habilidad_usada: false
      });
    } else {
      jugador.descarte.push(robada);
    }

    this.gameState.set({ ...estado });
    return true;
  }

  invocarCarta(jugadorKey: 'jugador1' | 'jugador2', manoIndex: number, campoIndex: number): boolean {
    const estado = this.gameState();
    if (!estado) return false;

    const jugador = estado[jugadorKey];
    if (!jugador) return false;

    if (campoIndex < 0 || campoIndex >= 4 || jugador.campo[campoIndex] !== null) {
      return false;
    }

    const carta = jugador.mano[manoIndex];
    if (!carta) return false;

    jugador.mano.splice(manoIndex, 1);
    carta.puede_atacar = true;
    carta.acciones_restantes = 1; // 1 ataque por turno
    carta.habilidad_usada = false; // habilidad disponible (independiente del ataque)
    jugador.campo[campoIndex] = carta;

    this.gameState.set({ ...estado });
    return true;
  }

  /**
   * USAR HABILIDAD - independiente del ataque.
   * Cada Pokémon puede usar SU HABILIDAD + ATACAR en el mismo turno.
   * La habilidad NO consume puntos de acción.
   */
  usarHabilidad(jugadorKey: 'jugador1' | 'jugador2', campoIndex: number, targetSlotIndex?: number): boolean {
    const estado = this.gameState();
    if (!estado) return false;

    const jugador = estado[jugadorKey];
    const oponente = jugadorKey === 'jugador1' ? estado.jugador2 : estado.jugador1;
    if (!jugador || !oponente) return false;

    const carta = jugador.campo[campoIndex];
    if (!carta || carta.habilidad_usada) return false;

    const tipo = carta.carta.tipo_principal.toLowerCase();

    switch (tipo) {
      case 'water': { // Curación - 25% del HP máximo
        const healAmount = Math.floor(carta.carta.puntos_vida * 0.25);
        if (targetSlotIndex !== undefined && jugador.campo[targetSlotIndex]) {
          const target = jugador.campo[targetSlotIndex]!;
          const antes = target.hp_actual;
          target.hp_actual = Math.min(target.carta.puntos_vida, target.hp_actual + healAmount);
          carta.habilidad_usada = true;
          this.actualizarStat(jugadorKey, 'curacionTotal', target.hp_actual - antes);
        } else {
          const antes = carta.hp_actual;
          carta.hp_actual = Math.min(carta.carta.puntos_vida, carta.hp_actual + healAmount);
          carta.habilidad_usada = true;
          this.actualizarStat(jugadorKey, 'curacionTotal', carta.hp_actual - antes);
        }
        break;
      }

      case 'fire': { // Quemadura - 15% del HP máximo del objetivo
        if (targetSlotIndex !== undefined && oponente.campo[targetSlotIndex]) {
          const target = oponente.campo[targetSlotIndex]!;
          const dmg = Math.floor(target.carta.puntos_vida * 0.15);
          target.hp_actual -= dmg;
          carta.habilidad_usada = true;
          this.actualizarStat(jugadorKey, 'danioTotal', dmg);
          this.verificarMuerteCarta(oponente, targetSlotIndex, jugadorKey);
        }
        break;
      }

      case 'grass': { // Drenaje - roba 12% HP del rival
        if (targetSlotIndex !== undefined && oponente.campo[targetSlotIndex]) {
          const target = oponente.campo[targetSlotIndex]!;
          const dmg = Math.floor(target.carta.puntos_vida * 0.12);
          target.hp_actual -= dmg;
          carta.hp_actual = Math.min(carta.carta.puntos_vida, carta.hp_actual + dmg);
          carta.habilidad_usada = true;
          this.actualizarStat(jugadorKey, 'danioTotal', dmg);
          this.actualizarStat(jugadorKey, 'curacionTotal', dmg);
          this.verificarMuerteCarta(oponente, targetSlotIndex, jugadorKey);
        }
        break;
      }

      case 'electric': { // Parálisis
        if (targetSlotIndex !== undefined && oponente.campo[targetSlotIndex]) {
          const target = oponente.campo[targetSlotIndex]!;
          target.estado_efecto = 'paralizado';
          target.puede_atacar = false;
          target.acciones_restantes = 0;
          carta.habilidad_usada = true;
        }
        break;
      }

      default: { // Placaje - 10% del HP máximo del objetivo
        if (targetSlotIndex !== undefined && oponente.campo[targetSlotIndex]) {
          const target = oponente.campo[targetSlotIndex]!;
          const dmg = Math.floor(target.carta.puntos_vida * 0.10);
          target.hp_actual -= dmg;
          carta.habilidad_usada = true;
          this.actualizarStat(jugadorKey, 'danioTotal', dmg);
          this.verificarMuerteCarta(oponente, targetSlotIndex, jugadorKey);
        }
        break;
      }
    }

    this.verificarFinPartida();
    this.gameState.set({ ...estado });
    return true;
  }

  /**
   * ATACAR - usa la fórmula de daño balanceada.
   * Cada Pokémon puede atacar 1 vez por turno (independiente de la habilidad).
   */
  atacar(atacanteIndex: number, defensorIndex: number | null): boolean {
    const estado = this.gameState();
    if (!estado) return false;

    const currentTurn = estado.turno_actual;
    const esJ1 = currentTurn === estado.jugador1.id;
    const jugadorKey = esJ1 ? 'jugador1' : 'jugador2';
    const oponenteKey = esJ1 ? 'jugador2' : 'jugador1';
    
    const jugador = estado[jugadorKey];
    const oponente = estado[oponenteKey];

    if (!jugador || !oponente) return false;

    // Solo se permite 1 ataque por turno en toda la partida
    if (this.stats()[jugadorKey].ataquesUsados > 0) {
      return false; 
    }

    // Solo el Pokémon Activo (índice 0) puede atacar
    if (atacanteIndex !== 0) {
      return false;
    }

    const cartaAtacante = jugador.campo[atacanteIndex];
    if (!cartaAtacante) return false;

    if (oponente.campo.every(c => c === null)) {
      // Oponente no tiene cartas en campo, no hacemos nada
      return false; 
    }

    // Resolver objetivo
    let targetIdx: number | null = defensorIndex;
    if (targetIdx === null && this.objetivoSeleccionadoId) {
      targetIdx = oponente.campo.findIndex(c => c?.instancia_id === this.objetivoSeleccionadoId);
      if (targetIdx === -1) targetIdx = null;
    }
    // Auto-seleccionar primer enemigo si no hay objetivo
    if (targetIdx === null) {
      targetIdx = oponente.campo.findIndex(c => c !== null);
    }

    if (targetIdx !== null && targetIdx !== -1 && oponente.campo[targetIdx]) {
      const cartaDefensora = oponente.campo[targetIdx]!;
      const dmg = this.calcularDanio(cartaAtacante.carta, cartaDefensora.carta);
      cartaDefensora.hp_actual -= dmg;

      this.actualizarStat(jugadorKey, 'danioTotal', dmg);

      console.log(`${cartaAtacante.carta.nombre} infligió ${dmg} a ${cartaDefensora.carta.nombre} (HP: ${cartaDefensora.hp_actual}/${cartaDefensora.carta.puntos_vida})`);
      this.verificarMuerteCarta(oponente, targetIdx, jugadorKey);
    }

    // Consumir acción de ataque
    const pa = cartaAtacante.acciones_restantes || 0;
    cartaAtacante.acciones_restantes = pa > 0 ? pa - 1 : 0;
    cartaAtacante.puede_atacar = false; // 1 ataque por turno
    
    // Registrar ataque consumido
    this.actualizarStat(jugadorKey, 'ataquesUsados', 1);

    this.objetivoSeleccionadoId = null;
    this.verificarFinPartida();
    this.gameState.set({ ...estado });
    return true;
  }

  public actualizarStat(jugadorKey: 'jugador1' | 'jugador2', stat: 'danioTotal' | 'curacionTotal' | 'pokemonEliminados' | 'turnosJugados' | 'ataquesUsados', valor: number) {
    const s = this.stats();
    const jStats = { ...s[jugadorKey] };
    jStats[stat] += valor;
    this.stats.set({ ...s, [jugadorKey]: jStats });
  }

  private verificarMuerteCarta(jugador: DetalleJugador, index: number, killerKey?: 'jugador1' | 'jugador2') {
    const carta = jugador.campo[index];
    if (carta && carta.hp_actual <= 0) {
      jugador.descarte.push(carta.carta);
      jugador.campo[index] = null;
      console.log(`${carta.carta.nombre} fue destruido.`);
      if (killerKey) {
        this.actualizarStat(killerKey, 'pokemonEliminados', 1);
      }
    }
  }

  verificarFinPartida() {
    const estado = this.gameState();
    if (!estado) return;

    const j1FieldAlive = estado.jugador1.campo.some(c => c && c.hp_actual > 0);
    const j2 = estado.jugador2;
    const j2FieldAlive = j2 ? j2.campo.some(c => c && c.hp_actual > 0) : false;

    if (!j1FieldAlive) {
      estado.estado = 'finalizada';
      estado.ganador_id = j2?.id;
    } else if (!j2FieldAlive) {
      estado.estado = 'finalizada';
      estado.ganador_id = estado.jugador1.id;
    }
  }

  finalizarTurno(): void {
    const estado = this.gameState();
    if (!estado) return;

    const jKey = estado.turno_actual === estado.jugador1.id ? 'jugador1' : 'jugador2';
    const oKey = jKey === 'jugador1' ? 'jugador2' : 'jugador1';

    const jugadorActual = estado[jKey];
    const oponente = estado[oKey];
    if (!oponente || !jugadorActual) return;

    // Resetear habilidad y ataque para el siguiente turno (ambos independientes)
    oponente.campo.forEach(c => {
      if (c) {
        c.habilidad_usada = false; // Puede usar habilidad de nuevo
        if (c.estado_efecto === 'paralizado') {
          c.estado_efecto = null;
          c.puede_atacar = false;
          c.acciones_restantes = 0;
        } else {
          c.puede_atacar = true; // Puede atacar de nuevo
          c.acciones_restantes = 1; // 1 ataque por turno
        }
      }
    });

    // Incrementar turnos
    this.actualizarStat(oKey, 'turnosJugados', 1);

    this.objetivoSeleccionadoId = null;
    estado.turno_actual = oponente.id;
    estado.fase = 'draw';

    this.gameState.set({ ...estado });
    this.robarCarta(oKey);
  }

  abandonarPartida(jugadorId: string) {
    const estado = this.gameState();
    if (!estado) return;

    estado.estado = 'abandonada';
    estado.ganador_id = jugadorId === estado.jugador1.id ? estado.jugador2?.id : estado.jugador1.id;
    this.gameState.set({ ...estado });
  }
}
