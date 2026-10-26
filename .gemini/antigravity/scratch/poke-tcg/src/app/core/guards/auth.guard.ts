import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const authGuard: CanActivateFn = (route, state) => {
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);

  const signalUser = supabaseService.currentUser();
  const statusStr = `Signal User: ${signalUser?.email || 'None'}`;
  console.log('AuthGuard Check (Sync):', statusStr);
  supabaseService.lastGuardStatus.set(statusStr);

  if (signalUser) {
    supabaseService.lastGuardStatus.set(`${statusStr} -> ACCESO PERMITIDO`);
    return true;
  }

  supabaseService.lastGuardStatus.set(`${statusStr} -> ACCESO DENEGADO (Redirigiendo a /login)`);
  router.navigate(['/login']);
  return false;
};
