import React, { useEffect, useState } from 'react';

interface Solicitud {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  program_id: string;
  program_name: string | null;
  previous_school: string;
  average_grade: number;
  status: string;
  moodle_synced: boolean;
  created_at: string;
}

const base = '/api/auth/admisiones/admin/solicitudes';

export const GestionAdmisiones: React.FC = () => {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [cargando, setCargando] = useState(true);

  async function cargar() {
    setCargando(true);
    setError('');

    try {
      const respuesta = await fetch(base, {
        credentials: 'include',
        cache: 'no-store'
      });

      const datos = await respuesta.json();

      if (!respuesta.ok || !datos.success) {
        throw new Error(datos.error || 'Error de consulta');
      }

      setSolicitudes(datos.solicitudes);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void cargar();
  }, []);

  async function cambiarEstado(id: string, estado: string) {
    if (!window.confirm('¿Confirmar cambio a ' + estado + '?')) {
      return;
    }

    setOcupado(true);
    setError('');
    setMensaje('');

    try {
      const respuesta = await fetch(base + '/' + encodeURIComponent(id), {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado })
      });

      const datos = await respuesta.json();

      if (!respuesta.ok || !datos.success) {
        throw new Error(datos.error || 'No se pudo actualizar');
      }

      setMensaje('Solicitud actualizada correctamente');
      await cargar();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <section className="bg-white border rounded-2xl p-6 space-y-5">
      <div className="flex justify-between items-center gap-3">
        <h2 className="text-xl font-bold">Gestión de admisiones</h2>
        <button onClick={cargar}
          disabled={cargando || ocupado}
          className="bg-sky-600 text-white px-4 py-2 rounded-lg">
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {['PENDIENTE', 'EN REVISION', 'ADMITIDO', 'RECHAZADO'].map(estado => (
          <div key={estado} className="bg-slate-50 border rounded-xl p-4">
            <p className="text-xs text-slate-500">{estado}</p>
            <p className="text-2xl font-bold">
              {solicitudes.filter(s => s.status === estado).length}
            </p>
          </div>
        ))}
      </div>

      {error && <p className="bg-red-50 text-red-700 p-3 rounded-lg">{error}</p>}
      {mensaje && <p className="bg-green-50 text-green-700 p-3 rounded-lg">{mensaje}</p>}

      {cargando && <p>Consultando solicitudes...</p>}

      {!cargando && !error && !solicitudes.length && (
        <p className="text-slate-500">
          No hay nuevas solicitudes de admisión registradas.
        </p>
      )}

      {solicitudes.map(s => (
        <article key={s.id} className="border rounded-xl p-5 space-y-3">
          <div className="flex justify-between gap-3">
            <h3 className="font-bold">{s.full_name}</h3>
            <span className="bg-sky-50 text-sky-700 rounded-lg px-3 py-1 text-xs">
              {s.status}
            </span>
          </div>

          <div className="text-sm text-slate-600 space-y-1">
            <p>Folio: {s.id}</p>
            <p>Correo: {s.email}</p>
            <p>Teléfono: {s.phone || 'No registrado'}</p>
            <p>Programa: {s.program_name || s.program_id}</p>
            <p>Escuela anterior: {s.previous_school}</p>
            <p>Promedio: {s.average_grade}</p>
            <p>Moodle: {s.moodle_synced ? 'Sincronizado' : 'Pendiente'}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {s.status === 'PENDIENTE' && (
              <button disabled={ocupado}
                onClick={() => cambiarEstado(s.id, 'EN REVISION')}
                className="bg-sky-600 text-white px-4 py-2 rounded-lg">
                Revisar solicitud
              </button>
            )}

            {s.status === 'EN REVISION' && (
              <>
                <button disabled={ocupado}
                  onClick={() => cambiarEstado(s.id, 'ADMITIDO')}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg">
                  Admitir aspirante
                </button>

                <button disabled={ocupado}
                  onClick={() => cambiarEstado(s.id, 'RECHAZADO')}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg">
                  Rechazar solicitud
                </button>
              </>
            )}

            {s.status === 'ADMITIDO' && !s.moodle_synced && (
              <p className="text-sm text-amber-700">
                Admisión autorizada. Acceso a Moodle pendiente de vinculación.
              </p>
            )}
          </div>
        </article>
      ))}
    </section>
  );
};
