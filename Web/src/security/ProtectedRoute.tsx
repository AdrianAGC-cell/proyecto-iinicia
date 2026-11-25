import React from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types';
import { rutaPorRol } from './roles';

interface Props {
  roles: Role[];
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<Props> = ({
  roles,
  children
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span>Verificando permisos...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(user.role)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="bg-white border rounded-3xl p-8 text-center max-w-md shadow-lg">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold">
            Acceso restringido
          </h2>
          <p className="text-slate-500 my-4">
            Tu rol no tiene permisos para acceder a esta sección.
          </p>
          <a
            href={rutaPorRol(user.role)}
            className="inline-block bg-blue-600 text-white rounded-xl px-5 py-3"
          >
            Volver a mi panel
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
