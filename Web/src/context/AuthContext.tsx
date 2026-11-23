import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Role } from '../types';
import { supabase } from '../lib/supabase';
import type { User as SupabaseAuthUser } from '@supabase/supabase-js';

export interface AuthResponse {
  success: boolean;
  error?: string;
  needsEmailConfirmation?: boolean;
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
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('iinicia_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Evitar restaurar usuarios mock por defecto si no tienen sesión válida
        if (parsed && !parsed.id?.startsWith('usr-demo')) {
          return parsed;
        }
      } catch (_) {
        return null;
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(true);
  const [ssoModalOpen, setSsoModalOpen] = useState(false);
  const [ssoCourseTarget, setSsoCourseTarget] = useState<number | null>(null);

  // Helper para construir el objeto User del sistema a partir del usuario de Supabase
  const buildUserFromSupabase = useCallback(async (sbUser: SupabaseAuthUser): Promise<User> => {
    const email = (sbUser.email || '').trim().toLowerCase();
    const meta = sbUser.user_metadata || {};
    
    let name = meta.full_name || meta.name || email.split('@')[0];
    let avatar = meta.avatar_url || meta.picture || undefined;
    let matricula: string | undefined = meta.matricula || undefined;
    let programId: string | undefined = meta.program_id || undefined;
    let programName: string | undefined = meta.program_name || undefined;
    let semester: number | undefined = meta.semester ? Number(meta.semester) : undefined;
    
    // Deducción o lectura de rol
    let mappedRole: Role = 'estudiante';
    if (meta.role) {
      mappedRole = meta.role as Role;
    } else if (email.includes('admin')) {
      mappedRole = 'admin';
    } else if (email.includes('coord')) {
      mappedRole = 'coordinador';
    } else if (email.includes('prof')) {
      mappedRole = 'profesor';
    } else if (email.includes('asp')) {
      mappedRole = 'aspirante';
    }

    // 1. Intentar enriquecer datos desde la tabla 'users' de Supabase
    try {
      const { data: dbUser, error } = await supabase
        .from('users')
        .select('*')
        .ilike('email', email)
        .maybeSingle();

      if (dbUser && !error) {
        if (dbUser.full_name) name = dbUser.full_name;
        if (dbUser.avatar_url) avatar = dbUser.avatar_url;
        if (dbUser.matricula) matricula = dbUser.matricula;
        if (dbUser.program_id) programId = dbUser.program_id;
        if (dbUser.program_name) programName = dbUser.program_name;
        if (dbUser.current_semester) semester = dbUser.current_semester;
        
        const rawRole = (dbUser.role_id || '').toLowerCase();
        if (rawRole.includes('admin') || rawRole.includes('superadmin')) mappedRole = 'admin';
        else if (rawRole.includes('coord')) mappedRole = 'coordinador';
        else if (rawRole.includes('prof')) mappedRole = 'profesor';
        else if (rawRole.includes('asp')) mappedRole = 'aspirante';
        else if (rawRole.includes('est')) mappedRole = 'estudiante';
      }
    } catch (e) {
      console.warn('[Supabase] No se pudo consultar la tabla users:', e);
    }

    // 2. Si es aspirante o estudiante sin matrícula, consultar 'admission_applications'
    if (!matricula) {
      try {
        const { data: appData } = await supabase
          .from('admission_applications')
          .select('*')
          .ilike('email', email)
          .maybeSingle();

        if (appData) {
          if (appData.full_name) name = appData.full_name;
          if (appData.program_id) programId = appData.program_id;
          if (appData.program_name) programName = appData.program_name;
          const isAdmitido = (appData.status || '').toUpperCase() === 'ADMITIDO';
          if (isAdmitido) {
            mappedRole = 'estudiante';
            matricula = `IIN-2026-${appData.moodle_user_id || appData.id.replace('SOL-2026-', '')}`;
            semester = 1;
          } else {
            mappedRole = 'aspirante';
          }
        }
      } catch (e) {
        console.warn('[Supabase] No se pudo consultar la tabla admission_applications:', e);
      }
    }

    const constructedUser: User = {
      id: sbUser.id,
      name,
      email,
      role: mappedRole,
      matricula,
      programId,
      programName,
      semester,
      avatar: avatar || undefined,
      moodleId: 1042
    };

    return constructedUser;
  }, []);

  // Escuchar cambios de sesión de Supabase (onAuthStateChange y getSession)
  useEffect(() => {
    let isMounted = true;

    // Verificar sesión inicial existente
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      if (session?.user) {
        const fullUser = await buildUserFromSupabase(session.user);
        if (isMounted) {
          setUser(fullUser);
          localStorage.setItem('iinicia_user', JSON.stringify(fullUser));
        }
      }
      setLoading(false);
    });

    // Suscripción reactiva a cambios de autenticación (login, logout, oauth callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          const fullUser = await buildUserFromSupabase(session.user);
          setUser(fullUser);
          localStorage.setItem('iinicia_user', JSON.stringify(fullUser));
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('iinicia_user');
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [buildUserFromSupabase]);

  // Sincronizar cambios locales de usuario
  useEffect(() => {
    if (user) {
      localStorage.setItem('iinicia_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('iinicia_user');
    }
  }, [user]);

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
            const moodleUser: User = {
              id: String(u.id),
              name: u.nombre || u.username,
              email: u.email || cleanEmail,
              role: 'estudiante',
              matricula: u.matricula || undefined,
              avatar: u.imagen || undefined,
              moodleId: Number(u.id)
            };
            setUser(moodleUser);
            localStorage.setItem('iinicia_user', JSON.stringify(moodleUser));
            return { success: true };
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
        localStorage.setItem('iinicia_user', JSON.stringify(fullUser));
        return { success: true };
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
        localStorage.setItem('iinicia_user', JSON.stringify(fullUser));
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
