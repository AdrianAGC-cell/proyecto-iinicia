import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { DeckBuilderService } from '../../../core/services/deck-builder.service';
import { PokemonApiService } from '../../../core/services/pokemon-api.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="login-wrapper">
      <div class="bg-orb orb-1"></div>
      <div class="bg-orb orb-2"></div>
      
      <div class="auth-card-premium">
        <div class="auth-header">
          <div class="logo-placeholder">
            <div class="pokeball-icon"></div>
          </div>
          <h2>NUEVO ENTRENADOR</h2>
          <p class="subtitle">Únete a la liga y obtén tu mazo inicial de 20 cartas</p>
        </div>
        
        <div class="alert-box" *ngIf="errorMessage">
          <span class="alert-icon">⚠️</span>
          <span>{{ errorMessage }}</span>
        </div>

        <div class="alert-box success-box" *ngIf="successMessage">
          <span class="alert-icon">✅</span>
          <span>{{ successMessage }}</span>
        </div>

        <form (ngSubmit)="onSubmit()" #registerForm="ngForm" class="login-form" *ngIf="!successMessage">
          
          <div class="input-group">
            <label for="username">Nombre de Entrenador (Usuario)</label>
            <div class="input-wrapper">
              <input type="text" 
                     id="username" 
                     name="username" 
                     class="input-premium" 
                     placeholder="Ej: AshKetchum" 
                     [(ngModel)]="username" 
                     required 
                     minlength="3"
                     #userRef="ngModel">
            </div>
            <span class="error-text" *ngIf="userRef.invalid && (userRef.dirty || userRef.touched)">
              El nombre de usuario debe tener al menos 3 caracteres.
            </span>
          </div>

          <div class="input-group">
            <label for="email">Correo Electrónico</label>
            <div class="input-wrapper">
              <input type="email" 
                     id="email" 
                     name="email" 
                     class="input-premium" 
                     placeholder="entrenador@pokemon.com" 
                     [(ngModel)]="email" 
                     required 
                     email 
                     #emailRef="ngModel">
            </div>
            <span class="error-text" *ngIf="emailRef.invalid && (emailRef.dirty || emailRef.touched)">
              Por favor ingresa un correo válido.
            </span>
          </div>

          <div class="input-group">
            <label for="password">Contraseña</label>
            <div class="input-wrapper">
              <input type="password" 
                     id="password" 
                     name="password" 
                     class="input-premium" 
                     placeholder="••••••••" 
                     [(ngModel)]="password" 
                     required 
                     minlength="6" 
                     #passRef="ngModel">
            </div>
            <span class="error-text" *ngIf="passRef.invalid && (passRef.dirty || passRef.touched)">
              Mínimo 6 caracteres requeridos.
            </span>
          </div>

          <button type="submit" class="btn-submit" [disabled]="registerForm.invalid || loading">
            <span *ngIf="!loading">Crear Entrenador</span>
            <div class="spinner" *ngIf="loading"></div>
          </button>
        </form>

        <div class="auth-footer" *ngIf="!successMessage">
          <p>¿Ya tienes una cuenta? <a routerLink="/login">Inicia sesión aquí</a></p>
          <button class="btn-text" routerLink="/">Volver al inicio</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: radial-gradient(circle at 50% 50%, #0f132a 0%, #070913 100%);
      overflow: hidden;
      font-family: 'Outfit', sans-serif;
    }

    .bg-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(100px);
      z-index: 0;
      opacity: 0.35;
    }

    .orb-1 {
      width: 450px;
      height: 450px;
      background: #ff1f1f; /* Pokéball Red */
      top: -120px;
      left: -120px;
      animation: float 10s ease-in-out infinite alternate;
    }

    .orb-2 {
      width: 550px;
      height: 550px;
      background: #2a75d3; /* Pokémon Blue */
      bottom: -180px;
      right: -120px;
      animation: float 14s ease-in-out infinite alternate-reverse;
    }

    @keyframes float {
      0% { transform: translateY(0px) scale(1); }
      100% { transform: translateY(40px) scale(1.15); }
    }

    .auth-card-premium {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 420px;
      background: rgba(15, 19, 42, 0.85);
      backdrop-filter: blur(25px);
      -webkit-backdrop-filter: blur(25px);
      border: 2px solid #ffcb05; /* Golden Yellow Border */
      border-radius: 24px;
      padding: 48px 40px;
      box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(255, 203, 5, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }

    .auth-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .logo-placeholder {
      width: 72px;
      height: 72px;
      margin: 0 auto 20px;
      background: linear-gradient(135deg, #ff1f1f 0%, #2a75d3 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 20px rgba(42, 117, 211, 0.3), 0 0 15px rgba(255, 203, 5, 0.2);
    }

    .pokeball-icon {
      width: 44px;
      height: 44px;
      background: linear-gradient(to bottom, #ff1f1f 46%, #1a1a2e 46%, #1a1a2e 54%, #ffffff 54%);
      border: 4px solid #1a1a2e;
      border-radius: 50%;
      position: relative;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
      animation: wobble 3s ease-in-out infinite;
    }
    
    @keyframes wobble {
      0%, 100% { transform: rotate(0deg); }
      10% { transform: rotate(-15deg); }
      20% { transform: rotate(15deg); }
      30% { transform: rotate(-10deg); }
      40% { transform: rotate(10deg); }
      50% { transform: rotate(0deg); }
    }

    .pokeball-icon::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 14px;
      height: 14px;
      background: #ffffff;
      border: 3px solid #1a1a2e;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      z-index: 2;
    }

    .auth-header h2 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1.85rem;
      font-weight: 800;
      color: #ffffff;
      margin: 0 0 8px 0;
      letter-spacing: -0.5px;
      text-shadow: 0 0 10px rgba(255, 203, 5, 0.2);
    }

    .auth-header .subtitle {
      font-size: 0.95rem;
      color: #a5b4fc;
      line-height: 1.5;
      margin: 0;
    }

    .alert-box {
      background: rgba(255, 31, 31, 0.1);
      border: 1px solid rgba(255, 31, 31, 0.3);
      color: #fca5a5;
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 0.9rem;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .success-box {
      background: rgba(76, 175, 80, 0.1);
      border: 1px solid rgba(76, 175, 80, 0.3);
      color: #81c784;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .input-group label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #a5b4fc;
      margin-left: 4px;
    }

    .input-wrapper {
      position: relative;
    }

    .input-premium {
      width: 100%;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 203, 5, 0.2);
      border-radius: 12px;
      padding: 14px 16px;
      color: #ffffff;
      font-size: 1rem;
      transition: all 0.3s ease;
      box-sizing: border-box;
      outline: none;
    }

    .input-premium::placeholder {
      color: #6366f1;
    }

    .input-premium:focus {
      border-color: #ffcb05;
      background: rgba(0, 0, 0, 0.4);
      box-shadow: 0 0 0 4px rgba(255, 203, 5, 0.15);
    }

    .error-text {
      color: #ff5555;
      font-size: 0.8rem;
      margin-left: 4px;
    }

    .btn-submit {
      margin-top: 12px;
      background: linear-gradient(135deg, #ffcb05 0%, #ff8800 100%);
      color: #0f132a;
      border: 2px solid #1a1a2e;
      border-radius: 12px;
      padding: 16px;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 8px 20px rgba(255, 203, 5, 0.35);
      display: flex;
      justify-content: center;
      align-items: center;
      height: 54px;
    }

    .btn-submit:hover:not([disabled]) {
      transform: translateY(-2px);
      box-shadow: 0 12px 25px rgba(255, 203, 5, 0.5);
      background: linear-gradient(135deg, #ffd500 0%, #ffa500 100%);
    }

    .btn-submit:active:not([disabled]) {
      transform: translateY(0);
    }

    .btn-submit[disabled] {
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.3);
      border-color: rgba(255, 255, 255, 0.05);
      box-shadow: none;
      cursor: not-allowed;
    }

    .spinner {
      width: 24px;
      height: 24px;
      border: 3px solid rgba(15, 19, 42, 0.3);
      border-top-color: #0f132a;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .auth-footer {
      margin-top: 32px;
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .auth-footer p {
      margin: 0;
      color: #a5b4fc;
      font-size: 0.9rem;
    }

    .auth-footer a {
      color: #ffcb05;
      text-decoration: none;
      font-weight: 700;
      transition: color 0.2s;
    }

    .auth-footer a:hover {
      color: #ff8800;
    }

    .btn-text {
      background: transparent;
      border: none;
      color: #6366f1;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: color 0.2s;
      padding: 8px;
    }

    .btn-text:hover {
      color: #ffffff;
    }

    @media (max-width: 480px) {
      .auth-card-premium {
        padding: 32px 24px;
        border-radius: 20px;
      }
      
      .orb-1, .orb-2 {
        opacity: 0.25;
      }
    }
  `]
})
export class RegistroComponent {
  private supabaseService = inject(SupabaseService);
  private pokemonApiService = inject(PokemonApiService);
  private deckBuilderService = inject(DeckBuilderService);
  private router = inject(Router);

  username = '';
  email = '';
  password = '';
  loading = false;
  errorMessage = '';
  successMessage = '';

  async onSubmit() {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    try {
      // 1. Registrar el usuario en Supabase
      const user = await this.supabaseService.register(this.email, this.password, this.username);

      // 2. Verificar si el usuario ya inició sesión automáticamente (real o simulada)
      const currentUser = this.supabaseService.currentUser();

      if (currentUser) {
        this.successMessage = '¡Entrenador creado con éxito! Redirigiendo...';
        this.router.navigate(['/menu']);
      } else {
        this.successMessage = '¡Registro exitoso! Por favor, revisa tu correo electrónico para confirmar tu cuenta antes de iniciar sesión.';
        this.loading = false;
      }
    } catch (err: any) {
      console.error(err);
      this.errorMessage = err.message || 'Error al registrar el entrenador. Intenta con otros datos.';
      this.loading = false;
    }
  }
}
