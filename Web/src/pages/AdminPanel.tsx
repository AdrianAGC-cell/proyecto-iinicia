import { GestionSoporte } from '../components/admin/GestionSoporte';
import { GestionCohortes } from '../components/admin/GestionCohortes';
import { GestionCursos } from '../components/admin/GestionCursos';
import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Server,
  Database,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Users,
  Headphones
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { nombresRoles } from '../security/roles';

interface Resumen {
  moodle: {
    conectado: boolean;
    sitio: string;
    version: string | null;
    latencia: number;
  };
}

async function consultar(ruta: string) {
  const respuesta = await fetch(ruta, {
    credentials: 'include',
    cache: 'no-store'
  });

  const datos = await respuesta.json();

  if (!respuesta.ok || !datos.success) {
    throw new Error(datos.error || 'Error de consulta');
  }

  return datos;
}

export const AdminPanel: React.FC = () => {

  const { user } = useAuth();

  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [actualizacion, setActualizacion] = useState(0);

  const rol = user?.role;

  const puedeVerCursos =
    rol === 'superadmin' ||
    rol === 'admin_academico' ||
    rol === 'coordinador';

  const descripciones: Record<string, string> = {
    superadmin: 'Administración general de la plataforma institucional.',
    admin_tecnico: 'Supervisión técnica y estado de las integraciones.',
    admin_academico: 'Administración de la oferta académica institucional.',
    coordinador: 'Supervisión de los cursos de tu categoría asignada.',
    soporte: 'Diagnóstico básico de los servicios institucionales.'
  };

  useEffect(() => {

    let activo = true;

    setResumen(null);
    setError('');
    setCargando(true);

    const cargar = async () => {
      try {

        const datos = await consultar('/api/auth/admin/resumen');

        if (!activo) return;

        setResumen(datos);


      } catch (e: any) {
        if (activo) setError(e.message);
      } finally {
        if (activo) setCargando(false);
      }
    };

    void cargar();

    return () => {
      activo = false;
    };

  }, [user?.id, rol, puedeVerCursos, actualizacion]);

  if (!user) return null;

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">

      <section className="bg-slate-900 text-white rounded-3xl p-8">
        <div className="flex items-center gap-4">
          <ShieldCheck className="w-12 h-12 text-sky-400" />

          <div>
            <p className="text-sky-400 text-sm font-bold">
              ADMINISTRACIÓN IINICIA
            </p>

            <h1 className="text-3xl font-black">
              {nombresRoles[user.role]}
            </h1>

            <p className="text-slate-300 mt-2">
              Bienvenido, {user.name}
            </p>
          </div>
        </div>

        <p className="mt-5 text-slate-300">
          {descripciones[user.role]}
        </p>
      </section>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">
          Estado de los servicios
        </h2>

        <button
          onClick={() => setActualizacion(v => v + 1)}
          disabled={cargando}
          className="flex items-center gap-2 bg-sky-600 text-white px-4 py-3 rounded-xl disabled:opacity-50"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {cargando && (
        <div className="flex gap-3 items-center p-6">
          <Loader2 className="animate-spin text-sky-600" />
          Consultando Moodle...
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-5 flex gap-3">
          <AlertCircle />
          {error}
        </div>
      )}

      {resumen && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">

          <article className="bg-white border rounded-2xl p-6 shadow-sm">
            <Server className="text-sky-600 mb-4" />
            <p className="text-slate-500">Servidor Moodle</p>

            <div className="flex items-center gap-2 mt-2 text-green-600 font-bold">
              <CheckCircle2 className="w-5 h-5" />
              Conectado
            </div>

            <p className="mt-2 text-sm">
              {resumen.moodle.sitio}
            </p>
          </article>

          <article className="bg-white border rounded-2xl p-6 shadow-sm">
            <Database className="text-sky-600 mb-4" />
            <p className="text-slate-500">Versión Moodle</p>

            <p className="text-xl font-bold mt-2">
              {resumen.moodle.version || 'No disponible'}
            </p>
          </article>

          <article className="bg-white border rounded-2xl p-6 shadow-sm">
            <RefreshCw className="text-sky-600 mb-4" />
            <p className="text-slate-500">Tiempo de respuesta</p>

            <p className="text-3xl font-black mt-2">
              {resumen.moodle.latencia} ms
            </p>
          </article>

        </section>
      )}

      {puedeVerCursos && resumen && (
        <GestionCursos />
      )}

      {resumen &&
        (rol === 'superadmin' || rol === 'admin_academico') && (
          <GestionCohortes />
      )}


      {(rol === 'superadmin' || rol === 'admin_academico') && (
        <section className="bg-white border rounded-2xl p-6">
          <Users className="text-sky-600 mb-3" />
          <h2 className="font-bold">Gestión de admisiones</h2>
          <p className="text-sm text-slate-500 mt-2">
            Integración de solicitudes y matrículas pendiente.
          </p>
        </section>
      )}

      {(rol === 'soporte' || rol === 'superadmin') && (
        <GestionSoporte administrar />
      )}

      <GestionSoporte />

    </main>
  );
};
