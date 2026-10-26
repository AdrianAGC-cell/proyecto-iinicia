import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { Carta, ColeccionUsuario } from '../models/carta.model';
import { Mazo } from '../models/mazo.model';
import { PartidaHistorial } from '../models/partida.model';
import { EquipamientoUsuario } from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class OfflineStorageService extends Dexie {
  cartasLocales!: Table<Carta, number>;
  coleccionLocal!: Table<ColeccionUsuario, number>;
  mazosLocales!: Table<Mazo, number>;
  partidasIaHistorial!: Table<PartidaHistorial, number>;
  configAccesorios!: Table<EquipamientoUsuario, number>;

  constructor() {
    super('PokeTCGDB');
    this.version(1).stores({
      cartasLocales: '++id, pokemon_id, nombre, tipo_principal',
      coleccionLocal: '++id, usuario_id, carta_id',
      mazosLocales: '++id, usuario_id, nombre, es_mazo_activo',
      partidasIaHistorial: '++id, jugador1_id, modo, ganador_id, estado',
      configAccesorios: '++id, usuario_id'
    });
    this.cartasLocales = this.table('cartasLocales');
    this.coleccionLocal = this.table('coleccionLocal');
    this.mazosLocales = this.table('mazosLocales');
    this.partidasIaHistorial = this.table('partidasIaHistorial');
    this.configAccesorios = this.table('configAccesorios');
  }

  async saveCartas(cartas: Carta[]) {
    await this.cartasLocales.clear();
    await this.cartasLocales.bulkAdd(cartas);
  }

  async getCartas(): Promise<Carta[]> {
    return await this.cartasLocales.toArray();
  }

  async saveColeccion(coleccion: ColeccionUsuario[]) {
    await this.coleccionLocal.clear();
    await this.coleccionLocal.bulkAdd(coleccion);
  }

  async getColeccion(): Promise<ColeccionUsuario[]> {
    return await this.coleccionLocal.toArray();
  }

  async saveMazos(mazos: Mazo[]) {
    await this.mazosLocales.clear();
    await this.mazosLocales.bulkAdd(mazos);
  }

  async getMazos(): Promise<Mazo[]> {
    return await this.mazosLocales.toArray();
  }

  async queuePartida(partida: PartidaHistorial) {
    await this.partidasIaHistorial.add(partida);
  }

  async getQueuedPartidas(): Promise<PartidaHistorial[]> {
    return await this.partidasIaHistorial.toArray();
  }

  async clearQueuedPartidas(ids: number[]) {
    await this.partidasIaHistorial.bulkDelete(ids);
  }

  async saveEquipamiento(eq: EquipamientoUsuario) {
    const existing = await this.configAccesorios.where('usuario_id').equals(eq.usuario_id).first();
    if (existing && existing.id) {
      await this.configAccesorios.update(existing.id, eq);
    } else {
      await this.configAccesorios.add(eq);
    }
  }

  async getEquipamiento(usuarioId: string): Promise<EquipamientoUsuario | undefined> {
    return await this.configAccesorios.where('usuario_id').equals(usuarioId).first();
  }
}
