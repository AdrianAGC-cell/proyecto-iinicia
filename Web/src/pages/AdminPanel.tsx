import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Server,
  Database,
  BookOpen,
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

interface Curso {
  id: number;
  nombre: string;
  nombreCorto: string;
  categoria: number;
  visible: boolean;
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
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [errorCursos, setErrorCursos] = useState('');
  const [busqueda, setBusqueda] = useState('');
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
    setCursos([]);
    setError('');
    setErrorCursos('');
    setCargando(true);

    const cargar = async () => {
      try {

        const datos = await consultar('/api/auth/admin/resumen');

        if (!activo) return;

        setResumen(datos);

        if (puedeVerCursos) {
          try {
            const resultado = await consultar('/api/auth/admin/cursos');

            if (activo) {
              setCursos(resultado.cursos);
            }
          } catch (e: any) {
            if (activo) setErrorCursos(e.message);
          }
        }

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

  const filtrados = cursos.filter(curso =>
    `${curso.nombre} ${curso.nombreCorto}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

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
        <section className="bg-white border rounded-3xl p-6 shadow-sm space-y-5">

          <div className="flex items-center gap-3">
            <BookOpen className="text-sky-600" />

            <h2 className="text-xl font-bold">
              Cursos institucionales
            </h2>
          </div>

          {rol === 'coordinador' && (
            <p className="text-sm text-slate-500">
              Categorías asignadas: {
                user.ambitos
                  ?.filter(a => a.rol === 'coordinador')
                  .map(a => a.instancia)
                  .join(', ') || 'Sin categorías'
              }
            </p>
          )}

          {errorCursos ? (
            <p className="text-red-600">{errorCursos}</p>
          ) : (
            <>
              <p className="text-slate-500">
                Cursos encontrados: {cursos.length}
              </p>

              <input
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar curso..."
                className="w-full border rounded-xl p-3"
              />

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-3">ID</th>
                      <th className="p-3">Curso</th>
                      <th className="p-3">Clave</th>
                      <th className="p-3">Categoría</th>
                      <th className="p-3">Estado</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtrados.map(curso => (
                      <tr key={curso.id} className="border-b">
                        <td className="p-3">{curso.id}</td>
                        <td className="p-3 font-semibold">{curso.nombre}</td>
                        <td className="p-3">{curso.nombreCorto}</td>
                        <td className="p-3">{curso.categoria}</td>
                        <td className="p-3">
                          {curso.visible ? 'Visible' : 'Oculto'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!cargando && filtrados.length === 0 && (
                <p className="text-slate-500 py-5">
                  No hay cursos disponibles para esta consulta.
                </p>
              )}
            </>
          )}

        </section>
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

      {rol === 'soporte' && (
        <section className="bg-white border rounded-2xl p-6">
          <Headphones className="text-sky-600 mb-3" />
          <h2 className="font-bold">Soporte técnico</h2>
          <p className="text-sm text-slate-500 mt-2">
            Diagnóstico de conexión disponible.
            Gestión de incidencias pendiente.
          </p>
        </section>
      )}

    </main>
  );
};
