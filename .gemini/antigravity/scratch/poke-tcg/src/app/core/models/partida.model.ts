import { Carta } from './carta.model';

export interface CartaEnJuego {
  instancia_id: string; // ID único para esta carta en el tablero/mano
  carta: Carta;
  hp_actual: number;
  puede_atacar: boolean;
  habilidad_usada: boolean;
  estado_efecto?: 'quemado' | 'paralizado' | null;
  acciones_restantes?: number;
}

export interface DetalleJugador {
  id: string;
  username: string;
  mano: CartaEnJuego[];
  campo: (CartaEnJuego | null)[]; // Máximo 5 slots
  mazo: Carta[];
  descarte: Carta[];
  funda_url?: string;
  tapete_url?: string;
}

export interface EstadoJuego {
  jugador1: DetalleJugador;
  jugador2?: DetalleJugador | null;
  turno_actual: string; // ID del jugador
  fase: 'draw' | 'main' | 'attack' | 'end';
  ganador_id?: string | null;
  codigo_sala?: string;
  estado: 'esperando_jugadores' | 'en_curso' | 'finalizada' | 'abandonada';
  mensajes?: { autor: string; texto: string; timestamp: string }[];
}

export interface PartidaHistorial {
  id?: number;
  jugador1_id: string;
  jugador2_id?: string | null;
  modo: 'vs_IA' | 'vs_Jugador';
  ganador_id?: string | null;
  estado: 'en_curso' | 'finalizada' | 'abandonada' | 'esperando_jugadores';
  puntos_otorgados: number;
  created_at?: string;
  finalizada_at?: string;
  // Joins
  jugador1_username?: string;
  jugador2_username?: string;
}

export interface PartidaEnLinea {
  id?: number;
  codigo_sala: string;
  jugador1_id: string;
  jugador2_id?: string | null;
  turno_actual: string | null;
  estado_juego: EstadoJuego;
  created_at?: string;
  ultima_actividad?: string;
}
