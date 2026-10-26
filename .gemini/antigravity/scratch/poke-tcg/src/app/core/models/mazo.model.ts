import { Carta } from './carta.model';

export interface Mazo {
  id?: number;
  usuario_id: string;
  nombre: string;
  es_mazo_activo: boolean;
  created_at?: string;
  cartas_count?: number; // helper field
}

export interface MazoCarta {
  id?: number;
  mazo_id: number;
  carta_id: number;
  cantidad: number;
  carta?: Carta; // Joined data
}

export interface MazoDetallado {
  mazo: Mazo;
  cartas: MazoCarta[];
}
