import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Role } from '../types';
import { supabase } from '../lib/supabase';
import type { User as SupabaseAuthUser } from '@supabase/supabase-js';

export interface AuthResponse {
  success: boolean;
  error?: string;
  needsEmailConfirmation?: boolean;
  role?: Role;
}

interface AuthContextType {
  user: User | null;
  role: Role;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password?: string) => Promise<AuthResponse>;
  register: (name: string, email: string, password: string, programId?: string) => Promise<AuthResponse>;
  loginWithGoogle: () => Promise<AuthResponse>;
  logout: () => Promise<void>;
  switchRole?: (newRole: Role) => void;
  ssoModalOpen: boolean;
  ssoCourseTarget: number | null;
  triggerMoodleSSO: (courseId?: number) => void;
  closeSSOModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);
  const [ssoModalOpen, setSsoModalOpen] = useState(false);
  const [ssoCourseTarget, setSsoCourseTarget] = useState<number | null>(null);

  const convertirUsuarioMoodle = (u: any): User => {
    const permitidos = [
      'superadmin', 'admin_tecnico', 'admin_academico',
      'coordinador', 'profesor', 'estudiante',
      'aspirante', 'soporte'
    ];

    if (
      !u ||
      !Number.isSafeInteger(Number(u.id)) ||
      Number(u.id) <= 0 ||
      !permitidos.includes(u.rol) ||
      !Array.isArray(u.roles) ||
      !u.roles.includes(u.rol)
    ) {
      throw new Error('Identidad institucional no valida');
    }

    return {
      id: String(u.id),
      name: u.nombre || u.username,
      email: u.email || '',
      role: u.rol,
      roles: u.roles,
      ambitos: u.ambitos || [],
      matricula: u.matricula || undefined,
      avatar: u.imagen || undefined,
      moodleId: Number(u.id)
    };
  };

  const buildUserFromSupabase = useCallback(
    async (sbUser: SupabaseAuthUser): Promise<User> => ({
      id: sbUser.id,
      name: sbUser.user_metadata?.full_name ||
            sbUser.user_metadata?.name ||
            sbUser.email || 'Aspirante',
      email: sbUser.email || '',
      role: 'aspirante',
      roles: ['aspirante'],
      ambitos: [],
      avatar: sbUser.user_metadata?.avatar_url
    }),
    []
  );

  useEffect(() => {
    let activo = true;

    localStorage.removeItem('iinicia_user');

    const restaurar = async () => {
      try {
        const respuesta = await fetch('/api/auth/me', {
          credentials: 'include',
          cache: 'no-store'
        });

        if (respuesta.ok) {
          const datos = await respuesta.json();

          if (datos.success && activo) {
            setUser(convertirUsuarioMoodle(datos.usuario));
            return;
          }
        }

        if (respuesta.status === 401) {
          const { data, error } = await supabase.auth.getUser();

          if (!error && data.user && activo) {
            setUser(await buildUserFromSupabase(data.user));
          }
        }
      } catch (_) {
        if (activo) setUser(null);
      } finally {
        if (activo) setLoading(false);
      }
    };

    void restaurar();

    return () => {
      activo = false;
    };
  }, [buildUserFromSupabase]);

  // Login: Soporta Moodle (mantener intacto) y Supabase signInWithPassword
  const login = async (email: string, password?: string): Promise<AuthResponse> => {
    const cleanEmail = (email || '').trim().toLowerCase();

    // 0. Intentar inicio de sesión con Moodle / Express (se mantiene 100% intacto)
    if (password) {
      try {
        const tipo = cleanEmail.includes('@')
          ? 'correo'
          : cleanEmail.startsWith('iin-')
          ? 'matricula'
          : 'usuario';

        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            identificador: cleanEmail,
            password,
            tipo
          })
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.usuario) {
            const u = json.usuario;
            const moodleUser = convertirUsuarioMoodle(u);

            await supabase.auth.signOut({ scope: 'local' });

            setUser(moodleUser);

            return {
              success: true,
              role: moodleUser.role
            };
          }
        }
      } catch (_) {
        // Si el servicio de Moodle no está disponible, continuar con Supabase
      }
    }

    // 1. Autenticación con Supabase Auth (signInWithPassword)
    if (!password) {
      return { success: false, error: 'Por favor ingresa tu contraseña.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });

      if (error) {
        let msg = error.message;
        if (msg.includes('Invalid login credentials')) {
          msg = 'Credenciales inválidas. Verifica tu correo y contraseña.';
        } else if (msg.includes('Email not confirmed')) {
          msg = 'Tu correo aún no ha sido confirmado. Revisa tu bandeja de entrada o spam para activarlo.';
        }
        return { success: false, error: msg };
      }

      if (data.user) {
        const fullUser = await buildUserFromSupabase(data.user);
        setUser(fullUser);
        return { success: true, role: fullUser.role };
      }

      return { success: false, error: 'No se pudo iniciar sesión. Inténtalo de nuevo.' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error de conexión con el servidor de autenticación.' };
    }
  };

  // Registro: Supabase signUp con emailRedirectTo
  const register = async (
    name: string,
    email: string,
    password: string,
    programId?: string
  ): Promise<AuthResponse> => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || '').trim();

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            role: 'aspirante',
            program_id: programId || 'lic-ia-datos'
          },
          emailRedirectTo: window.location.origin
        }
      });

      if (error) {
        let msg = error.message;
        if (msg.includes('already registered')) {
          msg = 'Este correo ya se encuentra registrado. Por favor inicia sesión.';
        }
        return { success: false, error: msg };
      }

      // Intentar registrar la postulación en admission_applications
      try {
        await supabase.from('admission_applications').insert([
          {
            id: `SOL-2026-${Math.floor(1000 + Math.random() * 9000)}`,
            full_name: cleanName,
            email: cleanEmail,
            program_id: programId || 'lic-ia-datos',
            status: 'EN_REVISION',
            created_at: new Date().toISOString()
          }
        ]);
      } catch (_) {
        // No bloquear el registro si la tabla tiene RLS o restricciones
      }

      // Si Supabase devolvió sesión inmediatamente (sin confirmación de correo requerida)
      if (data.session && data.user) {
        const fullUser = await buildUserFromSupabase(data.user);
        setUser(fullUser);
        return { success: true, needsEmailConfirmation: false };
      }

      // Si no devolvió sesión, requiere confirmación de email (SMTP Brevo)
      return { success: true, needsEmailConfirmation: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error al conectar con el servicio de registro.' };
    }
  };

  // Inicio de sesión con Google OAuth
  const loginWithGoogle = async (): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data?.url) {
        window.location.href = data.url;
        return { success: true };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error al iniciar sesión con Google.' };
    }
  };

  // Cierre de sesión (Moodle + Supabase signOut)
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (_) {}

    try {
      await supabase.auth.signOut();
    } catch (_) {}

    setUser(null);
    localStorage.removeItem('iinicia_user');
  };

  // Método auxiliar legado
  const switchRole = (_newRole: Role) => {
    // Las simulaciones manuales fueron removidas en favor de la autenticación real
  };

  const triggerMoodleSSO = (courseId?: number) => {
    setSsoCourseTarget(courseId || null);
    setSsoModalOpen(true);
  };

  const closeSSOModal = () => {
    setSsoModalOpen(false);
    setSsoCourseTarget(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : 'aspirante',
        isAuthenticated: !!user,
        loading,
        login,
        register,
        loginWithGoogle,
        logout,
        switchRole,
        ssoModalOpen,
        ssoCourseTarget,
        triggerMoodleSSO,
        closeSSOModal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
