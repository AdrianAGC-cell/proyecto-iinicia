import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameLogicService } from '../../../core/services/game-logic.service';
import { AiService } from '../../../core/services/ai.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { EstadoJuego, CartaEnJuego } from '../../../core/models/partida.model';
import { Carta } from '../../../core/models/carta.model';
import { TapeteComponent } from '../../../shared/components/tapete/tapete.component';
import { CartaCardComponent } from '../../../shared/components/carta-card/carta-card.component';

@Component({
  selector: 'app-vs-ia',
  standalone: true,
  imports: [CommonModule, TapeteComponent, CartaCardComponent],
  templateUrl: './vs-ia.component.html',
  styleUrls: ['./vs-ia.component.css']
})
export class VsIaComponent implements OnInit {
  public gameLogic = inject(GameLogicService);
  public aiService = inject(AiService);
  public supabaseService = inject(SupabaseService);
  public router = inject(Router);

  gameState = this.gameLogic.gameState;
  
  loading = true;
  noActiveDeck = false;
  
  // Combate variables
  cartaAtacanteIndex: number | null = null;
  objetivoSeleccionadoIdx: number | null = null; // Índice del Pokémon rival seleccionado como objetivo
  logs: string[] = [];

  // Cosméticos equipados
  fundaUrl?: string;
  tapeteUrl?: string;

  async ngOnInit() {
    await this.iniciarPartidaIA();
  }

  async iniciarPartidaIA() {
    this.loading = true;
    this.noActiveDeck = false;
    this.logs = ['Generando mazo para el combate...'];

    const user = this.supabaseService.currentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    // Set de cartas de respaldo por si Supabase falla
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

    const timeout = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms));

    try {
      // 1. Obtener catálogo de cartas global de Supabase
      let cartasGlobales: Carta[] = [];
      try {
        cartasGlobales = await Promise.race([
          this.supabaseService.getCartasGlobales(),
          timeout(1500)
        ]) as Carta[];
      } catch (apiErr) {
        console.warn('Error/Timeout al conectar con Supabase. Usando cartas de respaldo locales:', apiErr);
      }

      if (!cartasGlobales || cartasGlobales.length === 0) {
        cartasGlobales = FALLBACK_CARTAS;
      }

      // 2. Generar mazo del jugador (10 cartas aleatorias, 2 copias = 20 cartas)
      const jMazo: Carta[] = [];
      const shuffleCartasJ = [...cartasGlobales].sort(() => 0.5 - Math.random());
      const seleccionadasJ = shuffleCartasJ.slice(0, 10);
      seleccionadasJ.forEach(carta => {
        jMazo.push(carta);
        jMazo.push(carta);
      });

      // 3. Generar mazo de la IA (10 cartas aleatorias, 2 copias = 20 cartas)
      const iaMazo: Carta[] = [];
      const shuffleCartasIa = [...cartasGlobales].sort(() => 0.5 - Math.random());
      const seleccionadasIa = shuffleCartasIa.slice(0, 10);
      seleccionadasIa.forEach(carta => {
        iaMazo.push(carta);
        iaMazo.push(carta);
      });

      // 4. Inicializar juego
      this.gameLogic.inicializarPartida(
        user.id,
        this.supabaseService.userProfile()?.username || 'Tú',
        jMazo,
        'bot_ia_id',
        'Inteligencia Artificial',
        iaMazo,
        'vs_IA'
      );

      // 5. Auto-desplegar TODOS los Pokémon de la IA al campo
      this.autoDeployIA();

      this.logs.push('¡Partida iniciada contra la IA! Invoca tus Pokémon al campo.');
      this.logs.push('La IA ya desplegó todos sus Pokémon. ¡Selecciona un objetivo rival para atacar!');
      this.loading = false;
    } catch (err) {
      console.error('Error crítico al iniciar la partida, usando plan de respaldo total:', err);
      try {
        const jMazo = [...FALLBACK_CARTAS].concat([...FALLBACK_CARTAS]);
        const iaMazo = [...FALLBACK_CARTAS].concat([...FALLBACK_CARTAS]);
        this.gameLogic.inicializarPartida(
          user.id,
          this.supabaseService.userProfile()?.username || 'Tú',
          jMazo,
          'bot_ia_id',
          'Inteligencia Artificial',
          iaMazo,
          'vs_IA'
        );
        this.autoDeployIA();
        this.logs.push('Partida iniciada en modo seguro de respaldo.');
      } catch (innerErr) {
        this.logs.push('Error irrecuperable al iniciar la partida.');
      }
      this.loading = false;
    }
  }

  // Desplegar TODAS las cartas de la mano de la IA al campo
  private autoDeployIA(): void {
    const state = this.gameState();
    if (!state || !state.jugador2) return;
    
    // Mover todas las cartas de la mano al campo (máximo 5 slots)
    let deployed = 0;
    while (state.jugador2.mano.length > 0 && deployed < 5) {
      const emptyIdx = state.jugador2.campo.findIndex(c => c === null);
      if (emptyIdx === -1) break;
      
      const card = state.jugador2.mano.shift()!;
      card.puede_atacar = true;
      const rareza = card.carta.nivel_rareza;
      const esEspecial = rareza === 'Rara' || rareza === 'Muy Rara' || rareza === 'Legendaria';
      card.acciones_restantes = esEspecial ? 3 : 2;
      state.jugador2.campo[emptyIdx] = card;
      deployed++;
    }
    
    this.gameLogic.gameState.set({ ...state });
  }

  get esMiTurno(): boolean {
    const user = this.supabaseService.currentUser();
    const state = this.gameState();
    return state?.turno_actual === user?.id && state?.estado === 'en_curso';
  }

  // ACCIÓN: Invocar carta a un slot
  invocar(manoIndex: number) {
    if (!this.esMiTurno) return;
    const state = this.gameState();
    if (!state) return;

    const slotLibreIdx = state.jugador1.campo.findIndex(c => c === null);
    if (slotLibreIdx === -1) {
      this.logs.push('Tu campo está lleno. No puedes invocar más de 5 cartas.');
      return;
    }

    const carta = state.jugador1.mano[manoIndex].carta;
    const success = this.gameLogic.invocarCarta('jugador1', manoIndex, slotLibreIdx);
    if (success) {
      this.logs.push(`Invocaste a ${carta.nombre} en el campo.`);
    }
  }

  // ACCIÓN: Seleccionar objetivo rival para atacar
  seleccionarObjetivoRival(idx: number) {
    if (!this.esMiTurno) return;
    const state = this.gameState();
    if (!state || !state.jugador2) return;

    const carta = state.jugador2.campo[idx];
    if (!carta) return;

    // Si ya estaba seleccionado, deseleccionar
    if (this.objetivoSeleccionadoIdx === idx) {
      this.objetivoSeleccionadoIdx = null;
      this.gameLogic.seleccionarObjetivo(null);
      this.logs.push('Objetivo deseleccionado.');
    } else {
      this.objetivoSeleccionadoIdx = idx;
      this.gameLogic.seleccionarObjetivo(carta.instancia_id);
      this.logs.push(`🎯 Objetivo seleccionado: ${carta.carta.nombre}. Ahora haz clic en tu Pokémon para atacar.`);

      // Si ya hay un atacante seleccionado, ejecutar el ataque
      if (this.cartaAtacanteIndex !== null) {
        this.ejecutarAtaque();
      }
    }
  }

  // ACCIÓN: Usar habilidad
  usarHabilidad(campoIndex: number) {
    if (!this.esMiTurno) return;
    const state = this.gameState();
    if (!state) return;

    const carta = state.jugador1.campo[campoIndex];
    if (!carta || carta.habilidad_usada) return;

    const tipo = carta.carta.tipo_principal.toLowerCase();

    if (tipo === 'water') {
      // Curar el aliado más dañado
      let targetIdx = campoIndex;
      let minHp = carta.hp_actual;
      state.jugador1.campo.forEach((c, idx) => {
        if (c && c.hp_actual < minHp) {
          minHp = c.hp_actual;
          targetIdx = idx;
        }
      });

      this.gameLogic.usarHabilidad('jugador1', campoIndex, targetIdx);
      const targetName = state.jugador1.campo[targetIdx]?.carta.nombre;
      this.logs.push(`💧 ¡${carta.carta.nombre} usó Curación en ${targetName}!`);
    } else {
      // Usar objetivo seleccionado o primer rival disponible
      const oponenteCampo = state.jugador2?.campo;
      let targetIdx = this.objetivoSeleccionadoIdx;
      
      if (targetIdx === null || targetIdx === undefined || !oponenteCampo?.[targetIdx]) {
        targetIdx = oponenteCampo?.findIndex(c => c !== null) ?? -1;
      }

      if (targetIdx !== -1 && oponenteCampo?.[targetIdx]) {
        const targetName = oponenteCampo?.[targetIdx]?.carta.nombre;
        this.gameLogic.usarHabilidad('jugador1', campoIndex, targetIdx);
        this.logs.push(`⚡ ¡${carta.carta.nombre} usó su habilidad especial contra ${targetName}!`);
      } else {
        this.logs.push('No hay cartas enemigas en el campo para aplicar el efecto.');
      }
    }

    this.verificarFinDeJuego();
  }

  // ACCIÓN: Seleccionar atacante propio
  seleccionarAtacante(index: number) {
    if (!this.esMiTurno) return;
    const state = this.gameState();
    if (!state) return;

    if (index !== 0) {
      this.logs.push('Solo el Pokémon Activo (Adelante) puede atacar.');
      return;
    }

    const carta = state.jugador1.campo[index];
    if (!carta || !carta.puede_atacar) return;

    if (this.cartaAtacanteIndex === index) {
      this.cartaAtacanteIndex = null;
    } else {
      this.cartaAtacanteIndex = index;
      this.logs.push(`⚔️ ${carta.carta.nombre} listo para atacar. Selecciona un Pokémon rival como objetivo.`);
      
      // Si ya hay un objetivo seleccionado, ejecutar el ataque
      if (this.objetivoSeleccionadoIdx !== null) {
        this.ejecutarAtaque();
      }
    }
  }

  // Ejecutar el ataque cuando hay atacante Y objetivo seleccionados
  private ejecutarAtaque() {
    if (this.cartaAtacanteIndex === null || this.objetivoSeleccionadoIdx === null) return;
    const state = this.gameState();
    if (!state) return;

    const atacante = state.jugador1.campo[this.cartaAtacanteIndex];
    const defensor = state.jugador2?.campo[this.objetivoSeleccionadoIdx];
    if (!atacante || !defensor) return;

    const success = this.gameLogic.atacar(this.cartaAtacanteIndex, this.objetivoSeleccionadoIdx);
    if (success) {
      this.logs.push(`💥 ¡Tu ${atacante.carta.nombre} atacó a ${defensor.carta.nombre}!`);
      this.cartaAtacanteIndex = null;
      this.objetivoSeleccionadoIdx = null;
      this.verificarFinDeJuego();
    }
  }

  // FINALIZAR TURNO -> JUEGA IA
  finalizarTurno() {
    if (!this.esMiTurno) return;
    this.cartaAtacanteIndex = null;
    this.objetivoSeleccionadoIdx = null;
    this.logs.push('Finalizaste tu turno. Turno de la IA...');
    this.gameLogic.finalizarTurno();

    setTimeout(() => {
      this.ejecutarTurnoIA();
    }, 1500);
  }

  ejecutarTurnoIA() {
    const state = this.gameState();
    if (!state || state.estado === 'finalizada') return;

    this.logs.push('🤖 La IA está pensando sus movimientos...');
    const nuevoEstado = this.aiService.ejecutarTurnoIA(state);
    
    this.gameLogic.gameState.set(nuevoEstado);
    this.logs.push('🤖 La IA ha completado sus jugadas. ¡Es tu turno!');
    
    this.verificarFinDeJuego();
  }

  async verificarFinDeJuego() {
    const state = this.gameState();
    if (!state || state.estado !== 'finalizada') return;

    const user = this.supabaseService.currentUser();
    if (!user) return;

    const gano = state.ganador_id === user.id;
    this.logs.push(gano ? '🏆 ¡FELICIDADES! Has derrotado a la IA.' : '💀 DERROTA. La IA ha ganado.');

    try {
      await this.supabaseService.registrarPartidaFinalizada({
        jugador1_id: user.id,
        jugador2_id: 'bot_ia_id',
        modo: 'vs_IA',
        ganador_id: state.ganador_id,
        estado: 'finalizada',
        puntos_otorgados: 0
      });
    } catch (err) {
      console.error('Error al registrar partida finalizada:', err);
    }
  }

  async rendirse() {
    const state = this.gameState();
    if (!state || state.estado !== 'en_curso') return;

    const user = this.supabaseService.currentUser();
    if (!user) return;

    this.gameLogic.abandonarPartida(user.id);
    this.logs.push('Has abandonado la partida.');

    try {
      await this.supabaseService.registrarPartidaFinalizada({
        jugador1_id: user.id,
        jugador2_id: 'bot_ia_id',
        modo: 'vs_IA',
        ganador_id: 'bot_ia_id',
        estado: 'abandonada',
        puntos_otorgados: 0
      });
    } catch (err) {
      console.error('Error al registrar abandono:', err);
    }
  }

  getTopDiscardUrl(descarte?: any[] | null): string | null {
    if (!descarte || descarte.length === 0) return null;
    return descarte[descarte.length - 1].imagen_url;
  }

  salir() {
    this.router.navigate(['/menu']);
  }
}
