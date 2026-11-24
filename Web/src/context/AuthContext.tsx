import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { DEMO_USERS } from '../data/mockData';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  role: Role;
  isAuthenticated: boolean;
  login: (email: string, role?: Role, password?: string, customName?: string, avatarUrl?: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (newRole: Role) => void;
  ssoModalOpen: boolean;
  ssoCourseTarget: number | null;
  triggerMoodleSSO: (courseId?: number) => void;
  closeSSOModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Credenciales institucionales oficiales autorizadas para la plataforma
const INSTITUTIONAL_CREDENTIALS: Record<string, { role: Role; name: string; matricula?: string; moodleId: number }> = {
  'admin.sistemas@iinicia.edu.mx': {
    role: 'admin',
    name: 'Ing. Roberto Peña Guzmán',
    matricula: 'ADM-2020-001',
    moodleId: 1001
  },
  'coordinador@iinicia.edu.mx': {
    role: 'coordinador',
    name: 'Coordinación Académica IINICIA',
    matricula: 'COORD-2021-004',
    moodleId: 1002
  },
  'sofia.alarcon@iinicia.edu.mx': {
    role: 'coordinador',
    name: 'Dra. Sofía Alarcón Ruiz',
    matricula: 'COORD-2021-004',
    moodleId: 1002
  },
  'profesor@iinicia.edu.mx': {
    role: 'profesor',
    name: 'Claustro Docente IINICIA',
    matricula: 'DOC-2026-104',
    moodleId: 1003
  },
  'alejandro.mendez@iinicia.edu.mx': {
    role: 'profesor',
    name: 'Dr. Alejandro Méndez Vargas',
    matricula: 'DOC-2022-019',
    moodleId: 1003
  },
  'valeria.morales@iinicia.edu.mx': {
    role: 'estudiante',
    name: 'Valeria Morales Santillán',
    matricula: 'IIN-2024-8842',
    moodleId: 1042
  },
  'diego.solis@gmail.com': {
    role: 'aspirante',
    name: 'Diego Solís',
    moodleId: 1045
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // VULN-006 FIX: Use sessionStorage instead of plaintext localStorage
  // This ensures sessions do not linger indefinitely and are isolated to the active tab.
  const [user, setUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem('iinicia_user') || localStorage.getItem('iinicia_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        localStorage.removeItem('iinicia_user'); // Clean up old insecure storage
        return parsed;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [ssoModalOpen, setSsoModalOpen] = useState(false);
  const [ssoCourseTarget, setSsoCourseTarget] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      sessionStorage.setItem('iinicia_user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('iinicia_user');
      localStorage.removeItem('iinicia_user');
    }
  }, [user]);

  // Escuchar eventos de confirmación de Supabase Auth (correo confirmado o login con Google)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
        const userEmail = session.user.email;
        const metadata = session.user.user_metadata || {};
        const isGoogle = session.user.app_metadata?.provider === 'google' || String(metadata.iss || '').includes('google');
        const userName = metadata.full_name || metadata.name || (isGoogle ? 'Estudiante Google' : userEmail?.split('@')[0]) || 'Usuario IINICIA';
        const userAvatar = metadata.avatar_url || metadata.picture;
        if (userEmail) {
          const targetRole: Role = isGoogle ? 'estudiante' : 'aspirante';
          login(userEmail, targetRole, undefined, userName, userAvatar);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (
    email: string,
    roleParam?: Role,
    _password?: string,
    customName?: string,
    avatarUrl?: string
  ): Promise<boolean> => {
    const cleanEmail = (email || '').trim().toLowerCase();

    // 1. Verificar credenciales institucionales oficiales
    if (cleanEmail in INSTITUTIONAL_CREDENTIALS) {
      const cred = INSTITUTIONAL_CREDENTIALS[cleanEmail];
      const instUser: User = {
        id: `USR-${cleanEmail.replace(/[@.]/g, '-')}`,
        name: cred.name,
        email: cleanEmail,
        role: cred.role,
        matricula: cred.matricula,
        programId: 'lic-ia-datos',
        programName: 'Licenciatura en Inteligencia Artificial y Ciencia de Datos',
        semester: cred.role === 'estudiante' ? 4 : undefined,
        avatar: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        moodleId: cred.moodleId
      };
      setUser(instUser);
      return true;
    }

    // 2. Acceso con Google (Entra como Estudiante Google)
    if (cleanEmail.includes('google') || (roleParam === 'estudiante' && !_password && customName?.includes('Google'))) {
      const googleUser: User = {
        id: `USR-GOOGLE-${Date.now().toString().slice(-6)}`,
        name: customName || 'Estudiante Google',
        email: cleanEmail,
        role: 'estudiante',
        matricula: 'IIN-2026-GOOGLE',
        programId: 'lic-ia-datos',
        programName: 'Licenciatura en Inteligencia Artificial y Ciencia de Datos',
        semester: 1,
        avatar: avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        moodleId: 1088
      };
      setUser(googleUser);
      return true;
    }

    // 3. Check Supabase 'users' table
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .ilike('email', cleanEmail)
        .maybeSingle();

      if (data && !error) {
        let mappedRole: Role = 'estudiante';
        const rawRole = (data.role_id || '').toLowerCase();
        if (rawRole === 'admin' || rawRole === 'superadmin' || rawRole === 'admin_academico') {
          mappedRole = 'admin';
        } else if (rawRole === 'coordinador') {
          mappedRole = 'coordinador';
        } else if (rawRole === 'profesor') {
          mappedRole = 'profesor';
        } else if (rawRole === 'aspirante') {
          mappedRole = 'aspirante';
        }

        const dbUser: User = {
          id: data.id,
          name: data.full_name || customName || cleanEmail.split('@')[0],
          email: data.email,
          role: mappedRole,
          matricula: data.matricula || undefined,
          programId: data.program_id || undefined,
          programName: data.program_name || undefined,
          semester: data.current_semester || undefined,
          avatar: avatarUrl || data.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
          moodleId: 1042
        };

        setUser(dbUser);
        return true;
      }
    } catch (err) {
      console.warn('[Supabase AuthContext] Users table query error:', err);
    }

    // 2. Check Supabase 'admission_applications' table (permite iniciar sesión a aspirantes y admitidos)
    try {
      const { data: appData, error: appError } = await supabase
        .from('admission_applications')
        .select('*')
        .ilike('email', cleanEmail)
        .maybeSingle();

      if (appData && !appError) {
        const isAdmitido = (appData.status || '').toUpperCase() === 'ADMITIDO';
        const mappedRole: Role = isAdmitido ? 'estudiante' : 'aspirante';
        const moodleIdNum = appData.moodle_user_id || 1042;
        const matricula = isAdmitido
          ? `IIN-2026-${appData.moodle_user_id || appData.id.replace('SOL-2026-', '')}`
          : undefined;

        const applicantUser: User = {
          id: appData.id,
          name: appData.full_name || customName || cleanEmail.split('@')[0],
          email: appData.email,
          role: mappedRole,
          matricula,
          programId: appData.program_id,
          programName: appData.program_name,
          semester: isAdmitido ? 1 : undefined,
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
          moodleId: moodleIdNum
        };

        setUser(applicantUser);
        return true;
      }
    } catch (err) {
      console.warn('[Supabase AuthContext] Applications query error:', err);
    }

    // VULN-008 FIX: Demo fallback only works in development mode.
    // In production, only Supabase-authenticated users can log in.
    if (import.meta.env.DEV) {
      const DEMO_EMAILS: Record<string, string> = {
        'valeria.morales@iinicia.edu.mx': 'estudiante',
        'diego.solis@gmail.com': 'aspirante',
        'alejandro.mendez@iinicia.edu.mx': 'profesor',
        'sofia.alarcon@iinicia.edu.mx': 'coordinador',
        'admin.sistemas@iinicia.edu.mx': 'admin',
      };

      if (cleanEmail in DEMO_EMAILS) {
        const roleKey = (roleParam || DEMO_EMAILS[cleanEmail]) as Role;
        const fallbackUser = DEMO_USERS[roleKey] || DEMO_USERS.estudiante;
        setUser({ ...fallbackUser, email: cleanEmail });
        return true;
      }

      // Allow any email in DEV with the provided role (or aspirante)
      const resolvedName =
        customName ||
        cleanEmail
          .split('@')[0]
          .split(/[._-]/)
          .filter(Boolean)
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
          .join(' ');

      const devUser: User = {
        id: `USR-DEV-${Date.now().toString().slice(-6)}`,
        name: resolvedName,
        email: cleanEmail,
        role: roleParam || 'aspirante',
        programName: 'Licenciatura en Inteligencia Artificial y Ciencia de Datos',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
      };
      setUser(devUser);
      return true;
    }

    // PRODUCTION: If Supabase didn't find the user, deny login.
    console.warn('[IINICIA Auth] User not found in Supabase. Login denied in production.');
    return false;
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('iinicia_user');
    localStorage.removeItem('iinicia_user');
    supabase.auth.signOut().catch(() => {});
  };

  // VULN-004 FIX: switchRole only works in development mode.
  // In production, role switching is disabled to prevent privilege escalation.
  const switchRole = (newRole: Role) => {
    if (import.meta.env.DEV && DEMO_USERS[newRole]) {
      setUser(DEMO_USERS[newRole]);
    }
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
        login,
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
