import { Component, signal, OnInit, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

interface FloatingPokemon {
  id: number;
  imageUrl: string;
  top: string;
  duration: string;
  size: string;
  direction: 'left-to-right' | 'right-to-left';
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('poke-tcg');
  
  floatingPokemons: FloatingPokemon[] = [];
  private intervalId: any;
  private platformId = inject(PLATFORM_ID);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.spawnPokemon();
      // Generar un nuevo Pokémon cruzando la pantalla cada 12 segundos
      this.intervalId = setInterval(() => this.spawnPokemon(), 12000); 
    }
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  spawnPokemon() {
    // Escoger un ID aleatorio entre 1 y 386 (Gen 1 a 3)
    const randomId = Math.floor(Math.random() * 386) + 1; 
    const newPoke: FloatingPokemon = {
      id: Date.now() + Math.random(),
      imageUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${randomId}.png`,
      top: `${Math.floor(Math.random() * 70) + 10}vh`, // Entre 10% y 80% de altura
      duration: `${Math.floor(Math.random() * 15) + 15}s`, // Entre 15 y 30 segundos
      size: `${Math.floor(Math.random() * 80) + 100}px`, // Entre 100 y 180px
      direction: Math.random() > 0.5 ? 'left-to-right' : 'right-to-left'
    };

    this.floatingPokemons.push(newPoke);

    // Mantener máximo 4 en pantalla para no saturar
    if (this.floatingPokemons.length > 4) {
      this.floatingPokemons.shift();
    }
  }
}
