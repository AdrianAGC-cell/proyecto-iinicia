import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { DEMO_USERS } from '../data/mockData';

interface AuthContextType {
  user: User | null;
  role: Role;
  isAuthenticated: boolean;
  login: (email: string, role?: Role) => boolean;
  logout: () => void;
  switchRole: (newRole: Role) => void;
  ssoModalOpen: boolean;
  ssoCourseTarget: number | null;
  triggerMoodleSSO: (courseId?: number) => void;
  closeSSOModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to estudiante for immediate rich experience, or from localStorage
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

  const login = (email: string, roleParam?: Role) => {
    const roleKey = roleParam || 'estudiante';
    const foundUser = DEMO_USERS[roleKey] || DEMO_USERS.estudiante;
    setUser({ ...foundUser, email: email || foundUser.email });
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
