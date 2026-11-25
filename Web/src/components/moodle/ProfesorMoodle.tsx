import React, { useEffect, useState } from 'react';
import {
  Users,
  FileText,
  Eye,
  Download,
  Save,
  Loader2,
  RefreshCw
} from 'lucide-react';

type Archivo = {
  indice: number;
  nombre: string;
  tamano: number;
  tipo: string;
};

type Estudiante = {
  id: number;
  nombre: string;
  estado: string;
  intento: number | null;
  calificacion: number | null;
  fechaEntrega: number | null;
  archivos: Archivo[];
};

type SolicitudCancelacion = {
  requestid: number;
  userid: number;
  assignid: number;
  attemptnumber: number;
  status: string;
  timecreated: number;
};

type Datos = {
  success: boolean;
  tarea: {
    id: number;
    nombre: string;
    calificacionMaxima: number;
  };
  totalEstudiantes: number;
  totalEntregados: number;
  estudiantes: Estudiante[];
};

type Props = {
  courseId: number;
  assignmentId: number;
};

export const ProfesorMoodle: React.FC<Props> = ({
  courseId,
  assignmentId
}) => {

  const [solicitudes, setSolicitudes] =
    useState<SolicitudCancelacion[]>([]);

  const [errorCancelacion, setErrorCancelacion] =
    useState('');

  const [revision, setRevision] = useState<{
    solicitud: SolicitudCancelacion;
    nombre: string;
    aprobar: boolean;
  } | null>(null);

  const [datos, setDatos] = useState<Datos | null>(null);
  const [loading, setLoading] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [seleccionado, setSeleccionado] =
    useState<Estudiante | null>(null);

  const [nota, setNota] = useState('');
  const [comentario, setComentario] = useState('');
  const [guardando, setGuardando] = useState(false);

  const ruta =
    `/api/auth/teacher/courses/${courseId}/assignments/${assignmentId}`;

  const cargar = async () => {
    setLoading(true);
    setError('');
    setDatos(null);
    setSolicitudes([]);
    setErrorCancelacion('');
    setRevision(null);
    setSeleccionado(null);

    try {
      const respuesta = await fetch(`${ruta}/submissions`, {
        credentials: 'include'
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok || !resultado.success ||
          !Array.isArray(resultado.estudiantes)) {
        throw new Error(
          resultado.error || 'No se pudieron consultar las entregas'
        );
      }

      setDatos(resultado);

      try {
        const respuestaCancelacion = await fetch(
          `${ruta}/cancellation`,
          {
            credentials: 'include',
            cache: 'no-store'
          }
        );

        const info = await respuestaCancelacion.json();

        if (
          !respuestaCancelacion.ok ||
          info.success !== true ||
          !Array.isArray(info.solicitudes)
        ) {
          throw new Error('No se pudieron consultar las solicitudes');
        }

        setSolicitudes(
          info.compatible === true
            ? info.solicitudes
            : []
        );

      } catch {
        setErrorCancelacion(
          'No se pudieron consultar las solicitudes de cancelacion.'
        );
      }

    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Error consultando Moodle'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (abierto) void cargar();
  }, [abierto, ruta]);

  const revisarCancelacion = async () => {
    if (!revision || guardando || loading) return;

    const { solicitud, aprobar } = revision;

    setRevision(null);
    setGuardando(true);
    setError('');
    setMensaje('');

    try {
      const respuesta = await fetch(
        `${ruta}/cancellation/${solicitud.requestid}`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ aprobar })
        }
      );

      const resultado = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok || resultado.success !== true) {
        throw new Error(
          resultado.error || 'No se pudo verificar la operacion'
        );
      }

      await cargar();

      setMensaje(
        resultado.estado === 'approved'
          ? 'Cancelacion autorizada. Los archivos se conservaron.'
          : 'Solicitud de cancelacion rechazada.'
      );

    } catch (e) {
      await cargar();

      setError(
        e instanceof Error
          ? e.message
          : 'Error al revisar la solicitud'
      );
    } finally {
      setGuardando(false);
    }
  };

  const seleccionar = (estudiante: Estudiante) => {
    setSeleccionado(estudiante);
    setNota(
      estudiante.calificacion === null
        ? ''
        : String(estudiante.calificacion)
    );
    setComentario('');
    setMensaje('');
    setError('');
  };

  const guardar = async () => {
    if (!seleccionado || !datos || guardando) return;

    const valor = Number(nota);

    if (
      !nota.trim() ||
      !Number.isFinite(valor) ||
      valor < 0 ||
      valor > datos.tarea.calificacionMaxima
    ) {
      setError('Introduce una calificación válida');
      return;
    }

    if (!comentario.trim()) {
      setError('Escribe la retroalimentación del estudiante');
      return;
    }

    if (
      seleccionado.estado !== 'submitted' ||
      seleccionado.intento === null
    ) {
      setError('No existe una entrega activa para calificar');
      return;
    }

    setGuardando(true);
    setError('');
    setMensaje('');

    try {
      const respuesta = await fetch(
        `${ruta}/students/${seleccionado.id}/grade`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            calificacion: valor,
            comentario,
            intento: seleccionado.intento
          })
        }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok || !resultado.success) {
        throw new Error(
          resultado.error || 'No se pudo confirmar el guardado'
        );
      }

      setSeleccionado(null);
      await cargar();

      setMensaje(
        `Calificación registrada en Moodle: ${resultado.calificacion}/${resultado.calificacionMaxima}`
      );

    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Error guardando calificación'
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="rounded-2xl border border-sky-200 bg-sky-50/40 p-4 space-y-4">

      <button
        type="button"
        disabled={guardando}
        onClick={() => setAbierto(!abierto)}
        className="flex items-center gap-2 rounded-xl bg-[#22abe2] px-4 py-3 text-sm font-bold text-white"
      >
        <Users className="w-5 h-5" />
        {abierto ? 'Ocultar entregas' : 'Revisar entregas'}
      </button>

      {revision && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Revisar solicitud de cancelacion"
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-5"
          >
            <h3 className="text-xl font-bold text-center text-slate-900">
              {revision.aprobar
                ? '¿Autorizar cancelacion?'
                : '¿Rechazar solicitud?'}
            </h3>

            <p className="text-center font-semibold">
              {revision.nombre}
            </p>

            <p className="text-sm text-center text-slate-600">
              {revision.aprobar
                ? 'La entrega regresara a borrador. Los archivos se conservaran y el estudiante podra confirmar nuevamente su envio.'
                : 'La entrega permanecera registrada para su calificacion.'}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRevision(null)}
                className="rounded-xl border border-slate-300 p-3 font-bold text-slate-600"
              >
                Volver
              </button>

              <button
                type="button"
                disabled={guardando || loading}
                onClick={() => void revisarCancelacion()}
                className={`rounded-xl p-3 font-bold text-white ${
                  revision.aprobar
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {revision.aprobar ? 'Autorizar' : 'Rechazar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {abierto && (
        <>
          {loading && (
            <p className="flex items-center gap-2 text-sm">
              <Loader2 className="w-5 h-5 animate-spin" />
              Consultando Moodle...
            </p>
          )}

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          {mensaje && (
            <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
              {mensaje}
            </p>
          )}

          {errorCancelacion && (
            <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
              {errorCancelacion}
            </p>
          )}

          {datos && (
            <>
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-900">
                  {datos.tarea.nombre}
                </h3>

                <button
                  type="button"
                  disabled={guardando || loading}
                  onClick={() => void cargar()}
                  className="text-[#148ebf]"
                  title="Actualizar entregas"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  ['Estudiantes', datos.totalEstudiantes],
                  ['Entregados', datos.totalEntregados],
                  ['Calificados', datos.estudiantes.filter(
                    e => e.calificacion !== null
                  ).length]
                ].map(([titulo, cantidad]) => (
                  <div
                    key={titulo}
                    className="rounded-xl bg-white border border-slate-200 p-3"
                  >
                    <p className="text-xs text-slate-500">
                      {titulo}
                    </p>
                    <p className="text-xl font-black text-slate-900">
                      {cantidad}
                    </p>
                  </div>
                ))}
              </div>

              {datos.estudiantes.length === 0 && (
                <p className="text-sm text-slate-500">
                  No hay estudiantes disponibles.
                </p>
              )}

              {datos.estudiantes.map(estudiante => (
                <div
                  key={estudiante.id}
                  className="rounded-xl bg-white border border-slate-200 p-4 space-y-3"
                >
                  <div className="flex flex-wrap justify-between gap-2">
                    <div>
                      <p className="font-bold text-slate-900">
                        {estudiante.nombre}
                      </p>
                      <p className="text-xs text-slate-500">
                        {estudiante.estado === 'submitted'
                          ? 'Entrega realizada'
                          : estudiante.estado === 'draft'
                          ? 'Borrador'
                          : 'Sin entrega activa'}
                      </p>
                    </div>

                    <p className="font-black text-[#148ebf]">
                      {estudiante.calificacion === null
                        ? 'Sin calificar'
                        : `${estudiante.calificacion}/${datos.tarea.calificacionMaxima}`}
                    </p>
                  </div>

                  {solicitudes
                    .filter(s =>
                      s.userid === estudiante.id &&
                      s.status === 'pending'
                    )
                    .map(s => (
                      <div
                        key={s.requestid}
                        className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3"
                      >
                        <p className="font-bold text-amber-800">
                          Solicitud de cancelacion de envio
                        </p>

                        <p className="text-sm text-amber-700">
                          El estudiante solicita regresar su entrega
                          a borrador conservando sus archivos.
                        </p>

                        <p className="text-xs text-slate-500">
                          Solicitud #{s.requestid} - {
                            new Date(
                              s.timecreated * 1000
                            ).toLocaleString('es-MX')
                          }
                        </p>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            disabled={
                              guardando ||
                              loading ||
                              estudiante.estado !== 'submitted' ||
                              estudiante.calificacion !== null ||
                              estudiante.intento !== s.attemptnumber
                            }
                            onClick={() => {
                              setSeleccionado(null);
                              setRevision({
                                solicitud: s,
                                nombre: estudiante.nombre,
                                aprobar: true
                              });
                            }}
                            className="rounded-xl bg-green-600 text-white font-bold text-sm p-3 hover:bg-green-700 disabled:opacity-50"
                          >
                            Aceptar
                          </button>

                          <button
                            type="button"
                            disabled={guardando || loading}
                            onClick={() => {
                              setSeleccionado(null);
                              setRevision({
                                solicitud: s,
                                nombre: estudiante.nombre,
                                aprobar: false
                              });
                            }}
                            className="rounded-xl border border-red-500 text-red-600 font-bold text-sm p-3 hover:bg-red-50 disabled:opacity-50"
                          >
                            Rechazar
                          </button>
                        </div>
                      </div>
                    ))}

                  {estudiante.archivos.map(archivo => {
                    const url =
                      `${ruta}/students/${estudiante.id}/files/${archivo.indice}`;

                    return (
                      <div
                        key={archivo.indice}
                        className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 p-3"
                      >
                        <FileText className="w-5 h-5 text-red-500 shrink-0" />

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium break-all">
                            {archivo.nombre}
                          </p>
                          <p className="text-xs text-slate-500">
                            {(archivo.tamano / 1024).toFixed(1)} KB
                          </p>
                        </div>

                        {archivo.nombre.toLowerCase().endsWith('.pdf') && (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs font-bold text-[#148ebf]"
                          >
                            <Eye className="w-4 h-4" />
                            Ver
                          </a>
                        )}

                        <a
                          href={`${url}?download=1`}
                          className="flex items-center gap-1 text-xs font-bold text-[#148ebf]"
                        >
                          <Download className="w-4 h-4" />
                          Descargar
                        </a>
                      </div>
                    );
                  })}

                  {estudiante.estado === 'submitted' && (
                    <button
                      type="button"
                      disabled={guardando}
                      onClick={() => seleccionar(estudiante)}
                      className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white"
                    >
                      {estudiante.calificacion === null
                        ? 'Calificar'
                        : 'Editar calificación'}
                    </button>
                  )}

                  {seleccionado?.id === estudiante.id && (
                    <div className="border-t border-slate-200 pt-4 space-y-3">

                      <label className="block text-sm font-bold">
                        Calificación
                        <input
                          type="number"
                          min={0}
                          max={datos.tarea.calificacionMaxima}
                          step="0.01"
                          value={nota}
                          disabled={guardando}
                          onChange={e => setNota(e.target.value)}
                          className="mt-1 block w-full rounded-xl border border-slate-300 p-3"
                        />
                      </label>

                      <p className="text-xs text-slate-500">
                        Máximo: {datos.tarea.calificacionMaxima} puntos
                      </p>

                      <label className="block text-sm font-bold">
                        Nueva retroalimentación
                        <textarea
                          rows={4}
                          maxLength={10000}
                          value={comentario}
                          disabled={guardando}
                          onChange={e => setComentario(e.target.value)}
                          className="mt-1 block w-full rounded-xl border border-slate-300 p-3"
                          placeholder="Escribe tus observaciones..."
                        />
                      </label>

                      <p className="text-xs text-amber-700">
                        El comentario nuevo sustituirá la retroalimentación anterior.
                      </p>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={guardando}
                          onClick={() => void guardar()}
                          className="flex items-center gap-2 rounded-xl bg-[#22abe2] px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
                        >
                          {guardando
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Save className="w-4 h-4" />
                          }
                          {guardando
                            ? 'Guardando...'
                            : 'Guardar calificación'}
                        </button>

                        <button
                          type="button"
                          disabled={guardando}
                          onClick={() => setSeleccionado(null)}
                          className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
};
