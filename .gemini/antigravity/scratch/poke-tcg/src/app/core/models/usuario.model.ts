export interface Usuario {
  id: string;
  username: string;
  email: string;
  puntos: number;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface EquipamientoUsuario {
  id?: number;
  usuario_id: string;
  funda_carta_id?: number | null;
  tapete_id?: number | null;
  funda_mazo_id?: number | null;
  foto_perfil_id?: number | null;
  updated_at?: string;
}
