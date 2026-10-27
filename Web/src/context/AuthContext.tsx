import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { DEMO_USERS } from '../data/mockData';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  role: Role;
  isAuthenticated: boolean;
  login: (email: string, role?: Role, password?: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (newRole: Role) => void;
  ssoModalOpen: boolean;
  ssoCourseTarget: number | null;
  triggerMoodleSSO: (courseId?: number) => void;
  closeSSOModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Restore saved user or default to estudiante
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('iinicia_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEMO_USERS.estudiante;
      }
    }
    return DEMO_USERS.estudiante;
  });

  const [ssoModalOpen, setSsoModalOpen] = useState(false);
  const [ssoCourseTarget, setSsoCourseTarget] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      localStorage.setItem('iinicia_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('iinicia_user');
    }
  }, [user]);

  const login = async (email: string, roleParam?: Role, _password?: string): Promise<boolean> => {
    const cleanEmail = (email || '').trim().toLowerCase();

    // 1. Check Supabase 'users' table
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
          name: data.full_name || cleanEmail.split('@')[0],
          email: data.email,
          role: mappedRole,
          matricula: data.matricula || undefined,
          programId: data.program_id || undefined,
          programName: data.program_name || undefined,
          semester: data.current_semester || undefined,
          avatar: data.avatar_url || undefined,
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
          name: appData.full_name,
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

    // 3. Fallback persona for testing
    const roleKey =
      roleParam ||
      (cleanEmail.includes('admin')
        ? 'admin'
        : cleanEmail.includes('coord')
        ? 'coordinador'
        : cleanEmail.includes('prof')
        ? 'profesor'
        : cleanEmail.includes('asp') || cleanEmail.includes('solis')
        ? 'aspirante'
        : 'estudiante');

    const fallbackUser = DEMO_USERS[roleKey] || DEMO_USERS.estudiante;
    setUser({ ...fallbackUser, email: cleanEmail || fallbackUser.email });
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  const switchRole = (newRole: Role) => {
    if (DEMO_USERS[newRole]) {
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
