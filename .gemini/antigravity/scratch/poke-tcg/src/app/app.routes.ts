import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'login', 
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) 
  },
  { 
    path: 'registro', 
    redirectTo: 'login' 
  },
  { 
    path: 'reglas', 
    loadComponent: () => import('./features/reglas/reglas.component').then(m => m.ReglasComponent) 
  },
  { 
    path: 'menu', 
    loadComponent: () => import('./features/menu/menu.component').then(m => m.MenuComponent),
    canActivate: [authGuard] 
  },

  { 
    path: 'mis-mazos', 
    loadComponent: () => import('./features/mazos/mis-mazos/mis-mazos.component').then(m => m.MisMazosComponent),
    canActivate: [authGuard] 
  },
  { 
    path: 'constructor-mazo', 
    loadComponent: () => import('./features/mazos/constructor-mazo/constructor-mazo.component').then(m => m.ConstructorMazoComponent),
    canActivate: [authGuard] 
  },
  { 
    path: 'vs-ia', 
    loadComponent: () => import('./features/partida/vs-ia/vs-ia.component').then(m => m.VsIaComponent),
    canActivate: [authGuard] 
  },
  { 
    path: 'online', 
    loadComponent: () => import('./features/partida/online/online.component').then(m => m.OnlineComponent),
    canActivate: [authGuard] 
  },
  { 
    path: 'historial', 
    loadComponent: () => import('./features/historial/historial.component').then(m => m.HistorialComponent),
    canActivate: [authGuard] 
  },

  { 
    path: 'sobres', 
    loadComponent: () => import('./features/sobres/sobres.component').then(m => m.SobresComponent),
    canActivate: [authGuard] 
  },

  { 
    path: 'perfil', 
    loadComponent: () => import('./features/perfil/perfil.component').then(m => m.PerfilComponent),
    canActivate: [authGuard] 
  },
  { 
    path: '**', 
    redirectTo: '' 
  }
];
