import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PointsService {
  calcularPuntos(modo: 'vs_IA' | 'vs_Jugador', gano: boolean): number {
    if (modo === 'vs_IA') {
      return gano ? 100 : 30;
    } else {
      return gano ? 150 : 50;
    }
  }
}
