import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="login-wrapper">
      <!-- Decorative background elements -->
      <div class="bg-orb orb-1"></div>
      <div class="bg-orb orb-2"></div>
      
      <!-- Premium Pokédex Card -->
      <div class="pokedex-card">
        <!-- Pokédex Physical Header Elements -->
        <div class="pokedex-top-bar">
          <div class="main-lens-outer">
            <div class="main-lens-inner"></div>
          </div>
          <div class="led-container">
            <div class="led led-red"></div>
            <div class="led led-yellow"></div>
            <div class="led led-green"></div>
          </div>
        </div>
        
        <div class="pokedex-yellow-stripe"></div>
        
        <!-- Inside Screen -->
        <div class="pokedex-screen">
          <div class="auth-header">
            <div class="pokeball-logo">
              <div class="pokeball-center"></div>
            </div>
            <h2>{{ isLoginMode ? 'INICIAR SESIÓN' : 'NUEVO ENTRENADOR' }}</h2>
            <p class="subtitle">
              {{ isLoginMode 
                 ? 'Bienvenido de vuelta a TCG Arena.' 
                 : '¡Regístrate para comenzar tu aventura!' }}
            </p>
          </div>
          
          <div class="alert-box" *ngIf="errorMessage">
            <span class="alert-icon">⚠️</span>
            <span>{{ errorMessage }}</span>
          </div>
          
          <div class="alert-box success-box" *ngIf="successMessage">
            <span class="alert-icon">✅</span>
            <span>{{ successMessage }}</span>
          </div>

          <form (ngSubmit)="onSubmit()" #loginForm="ngForm" class="login-form" *ngIf="!successMessage">
            <!-- EMAIL -->
            <div class="input-group">
              <label for="email">CORREO ELECTRÓNICO</label>
              <input type="email" 
                     id="email" 
                     name="email" 
                     class="input-pokedex" 
                     placeholder="entrenador@pokemon.com" 
                     [(ngModel)]="email" 
                     required 
                     email 
                     #emailRef="ngModel">
              <span class="error-text" *ngIf="emailRef.invalid && (emailRef.dirty || emailRef.touched)">
                Por favor ingresa un correo válido.
              </span>
            </div>

            <!-- CONTRASEÑA -->
            <div class="input-group">
              <label for="password">CONTRASEÑA SECRETA</label>
              <input type="password" 
                     id="password" 
                     name="password" 
                     class="input-pokedex" 
                     placeholder="Mínimo 6 caracteres" 
                     [(ngModel)]="password" 
                     required 
                     minlength="6"
                     #passRef="ngModel">
              <span class="error-text" *ngIf="passRef.invalid && (passRef.dirty || passRef.touched)">
                La contraseña debe tener al menos 6 caracteres.
              </span>
            </div>

            <!-- USERNAME (ONLY IN REGISTER MODE) -->
            <div class="input-group" *ngIf="!isLoginMode">
              <label for="username">NOMBRE DE ENTRENADOR</label>
              <input type="text" 
                     id="username" 
                     name="username" 
                     class="input-pokedex" 
                     placeholder="Ej: AshKetchum" 
                     [(ngModel)]="username" 
                     [required]="!isLoginMode" 
                     minlength="3"
                     #userRef="ngModel">
              <span class="error-text" *ngIf="userRef.invalid && (userRef.dirty || userRef.touched)">
                Mínimo 3 caracteres requeridos.
              </span>
            </div>

            <button type="submit" class="btn-pokedex" [disabled]="loginForm.invalid || loading">
              <span *ngIf="!loading">{{ isLoginMode ? 'ENTRAR' : 'CREAR CUENTA' }}</span>
              <div class="spinner" *ngIf="loading"></div>
            </button>
          </form>

          <div class="auth-footer" *ngIf="!successMessage">
            <button type="button" class="btn-toggle-mode" (click)="toggleMode()">
              {{ isLoginMode ? '¿Eres nuevo? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión' }}
            </button>
            <button class="btn-back-home" routerLink="/">VOLVER AL INICIO</button>
          </div>
          
          <div class="auth-footer" *ngIf="successMessage">
            <button class="btn-pokedex" (click)="toggleMode()">IR AL LOGIN</button>
          </div>
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
      background: radial-gradient(circle at 50% 50%, #151a30 0%, #080a13 100%);
      overflow: hidden;
      font-family: 'Space Grotesk', sans-serif;
      padding: 20px;
    }

    .bg-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(120px);
      z-index: 0;
      opacity: 0.25;
    }

    .orb-1 {
      width: 500px;
      height: 500px;
      background: #ef4444;
      top: -100px;
      left: -100px;
      animation: float 8s ease-in-out infinite alternate;
    }

    .orb-2 {
      width: 500px;
      height: 500px;
      background: #3b82f6;
      bottom: -150px;
      right: -100px;
      animation: float 12s ease-in-out infinite alternate-reverse;
    }

    @keyframes float {
      0% { transform: translateY(0px) scale(1); }
      100% { transform: translateY(30px) scale(1.1); }
    }

    /* POKEDEX CARD DESIGN */
    .pokedex-card {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 440px;
      background: #cc1414; /* Pure Pokédex Red */
      border: 6px solid #202020; /* Solid Thick Dark Border */
      border-radius: 28px;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.6), inset 0 4px 0 rgba(255, 255, 255, 0.3), inset 0 -6px 0 rgba(0, 0, 0, 0.2);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    /* Pokédex physical buttons / lights at top */
    .pokedex-top-bar {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 4px 8px;
      margin-bottom: 4px;
    }

    .main-lens-outer {
      width: 54px;
      height: 54px;
      background: #e2e8f0;
      border: 4px solid #202020;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
    }

    .main-lens-inner {
      width: 36px;
      height: 36px;
      background: radial-gradient(circle at 35% 35%, #93c5fd 0%, #2563eb 60%, #1d4ed8 100%);
      border: 2px solid #202020;
      border-radius: 50%;
      box-shadow: inset 0 2px 4px rgba(255,255,255,0.6);
      animation: pulse-lens 4s infinite alternate;
    }

    @keyframes pulse-lens {
      0% { filter: brightness(1); }
      100% { filter: brightness(1.2) drop-shadow(0 0 4px rgba(59, 130, 246, 0.8)); }
    }

    .led-container {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .led {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 2px solid #202020;
      box-shadow: inset 0 1px 2px rgba(255,255,255,0.5);
    }

    .led-red { background: #ef4444; animation: blink-led 1s infinite alternate; }
    .led-yellow { background: #eab308; animation: blink-led 1.4s infinite alternate 0.2s; }
    .led-green { background: #22c55e; animation: blink-led 1.8s infinite alternate 0.4s; }

    @keyframes blink-led {
      0% { opacity: 0.4; filter: brightness(0.6); }
      100% { opacity: 1; filter: brightness(1.3); }
    }

    .pokedex-yellow-stripe {
      height: 8px;
      background: #ffcb05; /* Pikachu Yellow accent line */
      border-top: 2.5px solid #202020;
      border-bottom: 2.5px solid #202020;
      margin: 0 -16px;
    }

    /* POKEDEX SCREEN (WHERE FORM RESIDES) */
    .pokedex-screen {
      background: #181d26; /* Dark Screen Gray */
      border: 4px solid #202020;
      border-radius: 18px;
      padding: 30px 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      box-shadow: inset 0 4px 10px rgba(0, 0, 0, 0.8);
      position: relative;
    }

    /* Screen scan lines overlay effect */
    .pokedex-screen::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.15) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03));
      background-size: 100% 4px, 6px 100%;
      border-radius: 14px;
      pointer-events: none;
      z-index: 10;
    }

    .auth-header {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .pokeball-logo {
      width: 60px;
      height: 60px;
      background: linear-gradient(to bottom, #ef4444 46%, #202020 46%, #202020 54%, #ffffff 54%);
      border: 4px solid #202020;
      border-radius: 50%;
      position: relative;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
      animation: wobble 3s ease-in-out infinite;
    }

    @keyframes wobble {
      0%, 100% { transform: rotate(0deg); }
      15% { transform: rotate(-12deg); }
      30% { transform: rotate(12deg); }
      45% { transform: rotate(-8deg); }
      60% { transform: rotate(8deg); }
      75% { transform: rotate(0deg); }
    }

    .pokeball-center {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 18px;
      height: 18px;
      background: #ffffff;
      border: 4px solid #202020;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      z-index: 2;
    }

    .auth-header h2 {
      font-size: 1.35rem;
      font-weight: 900;
      color: #ffcb05; /* Pikachu Yellow */
      letter-spacing: 1px;
      margin: 0;
      text-shadow: 0 2px 4px rgba(0,0,0,0.5);
    }

    .auth-header .subtitle {
      font-size: 0.85rem;
      color: #94a3b8;
      line-height: 1.4;
      margin: 0;
    }

    .alert-box {
      background: rgba(239, 68, 68, 0.15);
      border: 2px solid #ef4444;
      color: #fca5a5;
      padding: 10px 14px;
      border-radius: 10px;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: monospace;
    }

    .success-box {
      background: rgba(34, 197, 94, 0.15);
      border-color: #22c55e;
      color: #86efac;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 18px;
      z-index: 2;
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .input-group label {
      font-size: 0.75rem;
      font-weight: 800;
      color: #ffcb05; /* Pikachu Yellow */
      letter-spacing: 0.5px;
      margin-left: 2px;
    }

    .input-pokedex {
      width: 100%;
      background: #11151c;
      border: 3.5px solid #202020;
      border-radius: 10px;
      padding: 12px 14px;
      color: #ffffff;
      font-family: monospace;
      font-size: 0.95rem;
      outline: none;
      box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.6);
      box-sizing: border-box;
      transition: all 0.2s ease;
    }

    .input-pokedex:focus {
      border-color: #ffcb05;
      box-shadow: 0 0 10px rgba(255, 203, 5, 0.3), inset 0 2px 5px rgba(0,0,0,0.6);
    }

    .error-text {
      color: #f87171;
      font-size: 0.75rem;
      font-family: monospace;
      margin-left: 2px;
      margin-top: 4px;
    }

    /* POKEDEX ACTION BUTTON */
    .btn-pokedex {
      margin-top: 8px;
      background: #ffcb05; /* Pikachu Yellow */
      color: #0f132a;
      border: 3.5px solid #202020;
      border-radius: 12px;
      padding: 14px;
      font-size: 0.95rem;
      font-weight: 900;
      letter-spacing: 0.5px;
      cursor: pointer;
      box-shadow: 0 4px 0 #b38e00, 0 4px 8px rgba(0,0,0,0.3);
      display: flex;
      justify-content: center;
      align-items: center;
      transition: all 0.1s ease;
    }

    .btn-pokedex:hover:not([disabled]) {
      background: #ffd500;
    }

    .btn-pokedex:active:not([disabled]) {
      transform: translateY(2px);
      box-shadow: 0 2px 0 #b38e00, 0 2px 4px rgba(0,0,0,0.3);
    }

    .btn-pokedex[disabled] {
      background: #475569;
      color: #94a3b8;
      border-color: #202020;
      box-shadow: none;
      cursor: not-allowed;
      transform: none;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 3px solid rgba(15, 19, 42, 0.2);
      border-top-color: #0f132a;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .auth-footer {
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 10px;
      z-index: 2;
    }

    .btn-toggle-mode {
      background: transparent;
      border: none;
      color: #60a5fa;
      font-size: 0.9rem;
      font-weight: 700;
      cursor: pointer;
      transition: color 0.2s;
    }

    .btn-toggle-mode:hover {
      color: #93c5fd;
      text-decoration: underline;
    }

    .btn-back-home {
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 0.8rem;
      font-weight: 800;
      cursor: pointer;
      transition: color 0.2s;
    }

    .btn-back-home:hover {
      color: #ffcb05;
    }

    @media (max-width: 480px) {
      .pokedex-card {
        border-radius: 20px;
        padding: 12px;
      }
      .pokedex-screen {
        padding: 20px 16px;
      }
    }
  `]
})
export class LoginComponent {
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);

  isLoginMode = true;
  email = '';
  password = '';
  username = '';
  loading = false;
  errorMessage = '';
  successMessage = '';

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.errorMessage = '';
    this.successMessage = '';
  }

  async onSubmit() {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    try {
      if (this.isLoginMode) {
        await this.supabaseService.login(this.email, this.password);
        this.router.navigate(['/menu']);
      } else {
        const result = await this.supabaseService.register(this.email, this.password, this.username);
        // Si el usuario se registra y tiene que confirmar correo, la sesión es null (o depende del retorno)
        const currentUser = this.supabaseService.currentUser();
        if (currentUser) {
          this.router.navigate(['/menu']);
        } else {
          this.successMessage = '¡Registro exitoso! Por favor, revisa tu correo electrónico para confirmar tu cuenta y luego inicia sesión.';
        }
      }
    } catch (err: any) {
      console.error('Error en onSubmit:', err);
      this.errorMessage = err.message || 'Error de autenticación.';
    } finally {
      this.loading = false;
    }
  }
}
