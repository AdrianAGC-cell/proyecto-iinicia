import { Injectable } from '@angular/core';
import { EstadoJuego, CartaEnJuego } from '../models/partida.model';
import { Carta } from '../models/carta.model';

import { GameLogicService } from './game-logic.service';

@Injectable({
  providedIn: 'root'
})
export class AiService {

  constructor(private gameLogic: GameLogicService) {}

  /** Misma fórmula de daño que game-logic */
  private calcularDanio(atacante: Carta, defensor: Carta): number {
    const base = atacante.puntos_ataque * 0.35;
    const reduccion = defensor.puntos_defensa * 0.15;
    const dmgCalculado = Math.floor(base - reduccion);
    const dmgMinimo = Math.floor(defensor.puntos_vida * 0.12);
    return Math.max(dmgMinimo, dmgCalculado);
  }

  ejecutarTurnoIA(estado: EstadoJuego): EstadoJuego {
    const nuevoEstado = JSON.parse(JSON.stringify(estado)) as EstadoJuego;
    const bot = nuevoEstado.jugador2;
    const jugador = nuevoEstado.jugador1;

    if (!bot || !jugador || nuevoEstado.estado === 'finalizada') {
      return nuevoEstado;
    }

    // === FASE DE ROBO ===
    if (nuevoEstado.fase === 'draw') {
      if (bot.mazo.length > 0) {
        const robada = bot.mazo.shift()!;
        bot.mano.push({
          instancia_id: 'ia_' + Math.random().toString(36).substr(2, 9),
          carta: robada,
          hp_actual: robada.puntos_vida,
          puede_atacar: false,
          habilidad_usada: false
        });
      }
      nuevoEstado.fase = 'main';
    }

    // === FASE PRINCIPAL: INVOCAR + HABILIDADES ===
    if (nuevoEstado.fase === 'main') {
      // Solo desplegar si es el inicio (nadie ha muerto aún o no se ha invocado nada)
      // La regla del jugador: "cuando se muere un pokemon no se puede volver a sacar uno"
      const turnosJugados = this.gameLogic.stats().jugador2?.turnosJugados || 0;
      if (turnosJugados === 0) {
        while (bot.mano.length > 0) {
          const slotLibre = bot.campo.findIndex(c => c === null);
          if (slotLibre === -1) break;

          const paraInvocar = bot.mano.shift()!;
          paraInvocar.puede_atacar = true;
          paraInvocar.acciones_restantes = 1;
          paraInvocar.habilidad_usada = false;
          bot.campo[slotLibre] = paraInvocar;
        }
      }

      const campoIA = bot.campo.filter(c => c !== null) as CartaEnJuego[];

      // HABILIDADES: La IA usa habilidades ANTES de atacar (independientes)
      for (const c of campoIA) {
        if (c.habilidad_usada) continue;
        const tipo = c.carta.tipo_principal.toLowerCase();

        if (tipo === 'water') {
          // Curar al Pokémon más dañado
          let objetivo = c;
          let minRatio = c.hp_actual / c.carta.puntos_vida;
          for (const ally of campoIA) {
            const ratio = ally.hp_actual / ally.carta.puntos_vida;
            if (ratio < minRatio) {
              minRatio = ratio;
              objetivo = ally;
            }
          }
          if (minRatio < 0.7) { // Solo curar si hay alguien bajo 70%
            const heal = Math.floor(c.carta.puntos_vida * 0.25);
            objetivo.hp_actual = Math.min(objetivo.carta.puntos_vida, objetivo.hp_actual + heal);
            c.habilidad_usada = true;
            this.gameLogic.actualizarStat('jugador2', 'curacionTotal', heal);
          }
        } else if (tipo === 'fire') {
          const enemigo = jugador.campo.find(e => e !== null);
          if (enemigo) {
            const dmg = Math.floor(enemigo.carta.puntos_vida * 0.15);
            enemigo.hp_actual -= dmg;
            c.habilidad_usada = true;
            this.gameLogic.actualizarStat('jugador2', 'danioTotal', dmg);
            this.verificarMuerteCarta(jugador, enemigo);
          }
        } else if (tipo === 'grass') {
          const enemigo = jugador.campo.find(e => e !== null);
          if (enemigo) {
            const dmg = Math.floor(enemigo.carta.puntos_vida * 0.12);
            enemigo.hp_actual -= dmg;
            c.hp_actual = Math.min(c.carta.puntos_vida, c.hp_actual + dmg);
            c.habilidad_usada = true;
            this.gameLogic.actualizarStat('jugador2', 'danioTotal', dmg);
            this.gameLogic.actualizarStat('jugador2', 'curacionTotal', dmg);
            this.verificarMuerteCarta(jugador, enemigo);
          }
        } else if (tipo === 'electric') {
          const enemigo = jugador.campo.find(e => e !== null && e.estado_efecto !== 'paralizado');
          if (enemigo) {
            enemigo.estado_efecto = 'paralizado';
            enemigo.puede_atacar = false;
            enemigo.acciones_restantes = 0;
            c.habilidad_usada = true;
          }
        }
      }

      nuevoEstado.fase = 'attack';
    }

    // === FASE DE ATAQUE: SOLO EL ACTIVO (0) ataca ===
    if (nuevoEstado.fase === 'attack') {
      const atacante = bot.campo[0];

      if (atacante && atacante.puede_atacar) {
        const enemigos = jugador.campo
          .map((c, idx) => ({ carta: c, idx }))
          .filter(e => e.carta !== null) as { carta: CartaEnJuego; idx: number }[];

        if (enemigos.length > 0) {
          // Priorizar al más débil (menos HP actual)
          enemigos.sort((a, b) => a.carta.hp_actual - b.carta.hp_actual);
          const objetivo = enemigos[0];

          const dmg = this.calcularDanio(atacante.carta, objetivo.carta.carta);
          objetivo.carta.hp_actual -= dmg;
          this.gameLogic.actualizarStat('jugador2', 'danioTotal', dmg);

          if (objetivo.carta.hp_actual <= 0) {
            jugador.descarte.push(objetivo.carta.carta);
            jugador.campo[objetivo.idx] = null;
            this.gameLogic.actualizarStat('jugador2', 'pokemonEliminados', 1);
          }

          atacante.puede_atacar = false;
        }
      }

      // Verificar victoria por 3 eliminaciones
      const killsIA = this.gameLogic.stats().jugador2?.pokemonEliminados || 0;
      if (killsIA >= 3) {
        nuevoEstado.estado = 'finalizada';
        nuevoEstado.ganador_id = bot.id;
        return nuevoEstado;
      }

      nuevoEstado.fase = 'end';
    }

    // === FASE FINAL ===
    if (nuevoEstado.fase === 'end') {
      jugador.campo.forEach(c => {
        if (c) {
          c.puede_atacar = true;
          c.habilidad_usada = false;
          c.acciones_restantes = 1;
          if (c.estado_efecto === 'paralizado') {
            c.estado_efecto = null;
            c.puede_atacar = false;
            c.acciones_restantes = 0;
          }
        }
      });

      nuevoEstado.turno_actual = jugador.id;
      nuevoEstado.fase = 'draw';
    }

    return nuevoEstado;
  }

  private verificarMuerteCarta(jugador: any, cartaEnJuego: CartaEnJuego) {
    if (cartaEnJuego.hp_actual <= 0) {
      const idx = jugador.campo.findIndex((c: any) => c === cartaEnJuego);
      if (idx !== -1) {
        jugador.descarte.push(cartaEnJuego.carta);
        jugador.campo[idx] = null;
        this.gameLogic.actualizarStat('jugador2', 'pokemonEliminados', 1);
      }
    }
  }
}
