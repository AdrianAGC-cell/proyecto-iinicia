import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reglas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="reglas-container">
      <div class="header-nav">
        <button class="btn-secondary" (click)="volver()">← VOLVER</button>
      </div>

      <div class="content-box glass">
        <h2>Manual de Reglas: Pokémon TCG Arena</h2>
        
        <div class="seccion">
          <h3>1. Conceptos Básicos</h3>
          <ul>
            <li><strong>Puntos de Vida (LP)</strong>: Cada jugador inicia la partida con 4,000 LP. Si tus LP llegan a 0, pierdes.</li>
            <li><strong>El Mazo</strong>: Debe contener entre 20 y 30 cartas. No se permiten más de 4 copias de una misma carta. Si un jugador debe robar una carta al inicio de su turno y no le quedan en el mazo, pierde la partida.</li>
            <li><strong>Mano</strong>: Inicias con 5 cartas. El límite máximo de cartas en mano es de 7. Si robas más, se descartan automáticamente.</li>
            <li><strong>Campo de Batalla</strong>: Puedes tener un máximo de 5 Pokémon activos simultáneamente en tu zona del campo.</li>
          </ul>
        </div>

        <div class="seccion">
          <h3>2. Fases del Turno</h3>
          <ol>
            <li><strong>Fase de Robo (Draw Phase)</strong>: Al inicio de tu turno, robas automáticamente 1 carta de la parte superior del mazo.</li>
            <li><strong>Fase Principal (Main Phase)</strong>: Puedes invocar Pokémon de tu mano a las zonas libres del campo y usar habilidades especiales una vez por carta por turno.</li>
            <li><strong>Fase de Ataque (Attack Phase)</strong>: Puedes declarar un ataque por turno utilizando uno de tus Pokémon en el campo. Puedes atacar a un Pokémon del rival o directamente a sus LP si el rival no tiene cartas en campo.</li>
            <li><strong>Fase Final (End Phase)</strong>: Concluye tu turno y el control pasa al oponente.</li>
          </ol>
        </div>

        <div class="seccion">
          <h3>3. Reglas de Ataque y Combate</h3>
          <ul>
            <li><strong>Combate vs Pokémon</strong>: Cuando declaras un ataque contra un Pokémon rival, se compara tu <strong>Ataque</strong> contra su <strong>Defensa</strong>:
              <ul>
                <li>Si <strong>Ataque > Defensa</strong>: El Pokémon defensor recibe daño igual a la diferencia (<code>Ataque - Defensa</code>) restándose de sus puntos de vida actuales. Si su vida llega a 0, es destruido y enviado a la pila de descarte.</li>
                <li>Si <strong>Defensa >= Ataque</strong>: El defensor resiste y tu Pokémon atacante recibe un contradaño de rebote igual a la diferencia (<code>Defensa - Ataque</code>) restado directamente de tus <strong>LP generales</strong>.</li>
              </ul>
            </li>
            <li><strong>Ataque Directo</strong>: Si el rival **no posee ningún Pokémon** en su campo activo, puedes atacar sus LP generales de forma directa. Sus LP se reducen por el valor total de ataque de tu Pokémon.</li>
          </ul>
        </div>

        <div class="seccion">
          <h3>4. Habilidades Especiales por Tipo</h3>
          <p>Cada tipo principal de Pokémon concede una habilidad única activable en la Fase Principal:</p>
          <ul>
            <li><strong style="color: var(--type-fire);">Fuego</strong>: <em>Quemadura</em> (Inflige 30 de daño de fuego a una carta rival).</li>
            <li><strong style="color: var(--type-water);">Agua</strong>: <em>Curación</em> (Sana 60 de HP a un Pokémon aliado).</li>
            <li><strong style="color: var(--type-grass);">Planta</strong>: <em>Drenaje</em> (Resta 40 de HP a una carta enemiga y cura 40 HP a sí mismo).</li>
            <li><strong style="color: var(--type-electric);">Eléctrico</strong>: <em>Parálisis</em> (Paraliza a un Pokémon enemigo, impidiéndole atacar en su siguiente turno).</li>
            <li><strong>Otros tipos</strong>: <em>Placaje</em> (Añade +15 de daño extra directo al atacar).</li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reglas-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }

    .header-nav {
      margin-bottom: 24px;
    }

    .content-box {
      padding: 40px;
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    h2 {
      font-size: 2.2rem;
      text-align: center;
      background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      border-bottom: 1px solid var(--border-glass);
      padding-bottom: 16px;
    }

    .seccion {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .seccion h3 {
      font-size: 1.4rem;
      color: var(--accent-primary);
    }

    .seccion ul, .seccion ol {
      padding-left: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      color: var(--text-secondary);
    }

    .seccion li strong {
      color: var(--text-primary);
    }
  `]
})
export class ReglasComponent {
  private router = inject(Router);

  volver() {
    this.router.navigate(['/']);
  }
}
