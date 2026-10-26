export interface TiendaItem {
  id: number;
  nombre: string;
  tipo: 'funda_carta' | 'tapete' | 'funda_mazo' | 'foto_perfil';
  precio: number;
  imagen_url: string;
  rareza?: string;
  created_at?: string;
}

export interface InventarioAccesorio {
  id?: number;
  usuario_id: string;
  item_id: number;
  fecha_compra?: string;
  item?: TiendaItem; // Joined data
}
