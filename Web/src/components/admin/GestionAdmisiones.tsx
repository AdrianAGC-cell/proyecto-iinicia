import { useAuth } from '../../context/AuthContext';
import { UserCheck, UserX, ClipboardCheck, X, Link2, Loader2 } from 'lucide-react';
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
  const { user } = useAuth();
  const puedeVincular = user?.role === 'superadmin';

  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const [confirmacion, setConfirmacion] = useState<{
    id: string;
    estado: string;
    nombre: string;
  } | null>(null);

  function solicitarConfirmacion(solicitud: Solicitud, estado: string) {
    setConfirmacion({
      id: solicitud.id,
      estado,
      nombre: solicitud.full_name
    });
  }

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


    if (ocupado) return;
    setOcupado(true);
    setError('');
    setMensaje('');

    try {
      const respuesta = await fetch(
        base + '/' + encodeURIComponent(id) +
        (estado === 'VINCULAR' ? '/vincular' : ''), {
        method: estado === 'VINCULAR' ? 'POST' : 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(estado === 'VINCULAR' ? {} : { estado })
      });

      const datos = await respuesta.json();

      if (!respuesta.ok || !datos.success) {
        throw new Error(datos.error || 'No se pudo actualizar');
      }

      setMensaje(
        estado === 'VINCULAR'
          ? 'Cuenta vinculada correctamente. Matrícula: ' + datos.matricula
          : 'Solicitud actualizada correctamente'
      );
      setConfirmacion(null);
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
                onClick={() => solicitarConfirmacion(s, 'EN REVISION')}
                className="bg-sky-600 text-white px-4 py-2 rounded-lg">
                Revisar solicitud
              </button>
            )}

            {s.status === 'EN REVISION' && (
              <>
                <button disabled={ocupado}
                  onClick={() => solicitarConfirmacion(s, 'ADMITIDO')}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg">
                  Admitir aspirante
                </button>

                <button disabled={ocupado}
                  onClick={() => solicitarConfirmacion(s, 'RECHAZADO')}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg">
                  Rechazar solicitud
                </button>
              </>
            )}

            {s.status === 'ADMITIDO' && !s.moodle_synced && (
              <div className="space-y-3 w-full">
                <p className="text-sm text-amber-700">
                  Admisión autorizada. Vinculación con Moodle pendiente.
                </p>

                {puedeVincular && (
                  <button
                    disabled={ocupado}
                    onClick={() => solicitarConfirmacion(s, 'VINCULAR')}
                    className="bg-[#22abe2] hover:bg-sky-600 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2"
                  >
                    <Link2 size={18} />
                    Vincular con Moodle
                  </button>
                )}
              </div>
            )}
          </div>
        </article>
      ))}

      {confirmacion && (
        <div
          className="fixed inset-0 z-[9999] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !ocupado && setConfirmacion(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-confirmacion"
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-7 space-y-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className={
                'w-14 h-14 rounded-2xl flex items-center justify-center ' +
                (confirmacion.estado === 'RECHAZADO'
                  ? 'bg-red-100 text-red-600'
                  : 'bg-sky-100 text-[#22abe2]')
              }>
                {confirmacion.estado === 'VINCULAR'
                  ? <Link2 size={28} />
                  : confirmacion.estado === 'ADMITIDO'
                  ? <UserCheck size={28} />
                  : confirmacion.estado === 'RECHAZADO'
                  ? <UserX size={28} />
                  : <ClipboardCheck size={28} />}
              </div>

              <button
                aria-label="Cerrar"
                disabled={ocupado}
                onClick={() => setConfirmacion(null)}
                className="text-slate-400 hover:text-slate-700 p-2"
              >
                <X size={22} />
              </button>
            </div>

            <h3 id="titulo-confirmacion"
              className="text-2xl font-black text-slate-900">
              {confirmacion.estado === 'VINCULAR'
                ? '¿Vincular con Moodle?'
                : confirmacion.estado === 'ADMITIDO'
                ? '¿Admitir aspirante?'
                : confirmacion.estado === 'RECHAZADO'
                ? '¿Rechazar solicitud?'
                : '¿Revisar solicitud?'}
            </h3>

            <p className="text-sm text-slate-500 leading-relaxed">
              {confirmacion.estado === 'VINCULAR'
                ? 'Se creará la cuenta institucional y su vinculación con Moodle. El acceso académico requiere activación y matrícula en cursos.'
                : confirmacion.estado === 'ADMITIDO'
                ? 'Se autorizará la admisión del aspirante. El acceso a Moodle requiere una vinculación posterior.'
                : confirmacion.estado === 'RECHAZADO'
                ? 'La solicitud quedará registrada como rechazada.'
                : 'La solicitud pasará al proceso de revisión académica.'}
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <p className="text-xs text-slate-500 uppercase font-bold">
                Aspirante
              </p>
              <p className="font-bold text-slate-900">
                {confirmacion.nombre}
              </p>
              <p className="text-xs text-slate-500 break-all mt-1">
                {confirmacion.id}
              </p>
            </div>

            {error && (
              <p role="alert" className="bg-red-50 text-red-700 rounded-xl p-3 text-sm">
                {error}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                disabled={ocupado}
                onClick={() => setConfirmacion(null)}
                className="border border-slate-200 rounded-xl py-3 font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>

              <button
                disabled={ocupado}
                onClick={() => {
                  const actual = confirmacion;
                  void cambiarEstado(actual.id, actual.estado);
                }}
                className={
                  'rounded-xl py-3 font-bold text-white transition-colors ' +
                  (confirmacion.estado === 'RECHAZADO'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-[#22abe2] hover:bg-sky-600')
                }
              >
                {ocupado ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={18} className="animate-spin" />
                    Procesando...
                  </span>
                ) : confirmacion.estado === 'VINCULAR'
                  ? 'Vincular'
                  : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
};
