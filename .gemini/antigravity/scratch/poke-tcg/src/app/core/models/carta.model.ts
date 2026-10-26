export interface Carta {
  id?: number;
  pokemon_id: number;
  nombre: string;
  imagen_url: string;
  tipo_principal: string;
  tipo_secundario?: string | null;
  puntos_ataque: number;
  puntos_defensa: number;
  puntos_vida: number;
  habilidad_especial: string;
  nivel_rareza: 'Común' | 'Poco Común' | 'Rara' | 'Muy Rara' | 'Legendaria';
  descripcion_breve?: string | null;
  created_at?: string;
}

export interface ColeccionUsuario {
  id?: number;
  usuario_id: string;
  carta_id: number;
  cantidad_copias: number;
  carta?: Carta; // Joined data
}
