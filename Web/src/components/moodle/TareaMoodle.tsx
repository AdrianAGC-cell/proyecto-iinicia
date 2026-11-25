import React, { useEffect, useState } from 'react';
import {
  FileText,
  Upload,
  Download,
  CheckCircle,
  Loader2,
  Eye,
  X,
  Undo2
} from 'lucide-react';

export type Tarea = {
  id: number;
  moduloId: number;
  nombre: string;
  descripcion: string;
  fechaLimite: number;
  requiereConfirmacion: boolean;
  limites?: {
    maxArchivos: number;
    maxBytes: number;
    formatos: string[];
  };
  archivos: Array<{
    indice: number;
    nombre: string;
    tipo: string;
    tamano: number;
  }>;
};

type Estado = {
  success: boolean;
  estado: string;
  puedeEditar: boolean;
  puedeEnviar: boolean;
  puedeDeshacer: boolean;
  archivosEntregados?: Array<{
    nombre: string;
    tamano: number;
  }>;
};

type Cancelacion = {
  compatible: boolean;
  pendiente: boolean;
  puedeSolicitar: boolean;
  solicitud: {
    requestid: number;
    status: string;
  } | null;
};

type Props = {
  courseId: number;
  tarea: Tarea;
};

export const TareaMoodle: React.FC<Props> = ({
  courseId,
  tarea
}) => {

  const [cancelacion, setCancelacion] =
    useState<Cancelacion | null>(null);

  const [errorCancelacion, setErrorCancelacion] =
    useState('');

  const [estado, setEstado] = useState<Estado | null>(null);
  const [archivos, setArchivos] = useState<File[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [confirmacion, setConfirmacion] =
    useState<'entregar' | 'deshacer' | 'cancelar' | null>(null);


  const [vistasPrevias, setVistasPrevias] =
    useState<string[]>([]);

  const limites = tarea.limites || {
    maxArchivos: 1,
    maxBytes: 10 * 1024 * 1024,
    formatos: ['.pdf']
  };

  const permiteVista = (nombre: string) =>
    /\.(pdf|png|jpg|jpeg|gif|webp)$/i.test(nombre);

  useEffect(() => {
    const urls = archivos.map(a => URL.createObjectURL(a));

    setVistasPrevias(urls);

    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [archivos]);

  const agregarArchivos = (seleccionados: File[]) => {
    setError('');
    setMensaje('');

    const nuevos = [...archivos];

    for (const archivo of seleccionados) {
      if (nuevos.some(a =>
        a.name.toLowerCase() === archivo.name.toLowerCase()
      )) {
        setError(`El archivo ${archivo.name} ya fue seleccionado.`);
        continue;
      }

      if (nuevos.length >= limites.maxArchivos) {
        setError(`Solo puedes agregar ${limites.maxArchivos} archivos.`);
        break;
      }

      if (archivo.size > limites.maxBytes) {
        setError(`El archivo ${archivo.name} supera el tamaño permitido.`);
        continue;
      }

      const formatos = limites.formatos.map(f => f.toLowerCase());

      if (
        formatos.length &&
        formatos.every(f => f.startsWith('.')) &&
        !formatos.some(f => archivo.name.toLowerCase().endsWith(f))
      ) {
        setError(`Formato no permitido: ${archivo.name}`);
        continue;
      }

      const total = nuevos.reduce((n, a) => n + a.size, 0);

      if (total + archivo.size > 50 * 1024 * 1024) {
        setError('La entrega no puede superar 50 MB en total.');
        continue;
      }

      nuevos.push(archivo);
    }

    setArchivos(nuevos);
  };

  const ruta =
    `/api/auth/courses/${courseId}/assignments/${tarea.id}`;

  const consultarEstado = async () => {
    const response = await fetch(`${ruta}/status`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('No se pudo consultar el estado.');
    }

    const data = await response.json();
    setEstado(data);
    setCancelacion(null);
    setErrorCancelacion('');

    if (tarea.requiereConfirmacion) {
      try {
        const respuesta = await fetch(`${ruta}/cancellation`, {
          credentials: 'include',
          cache: 'no-store'
        });

        const info = await respuesta.json();

        if (!respuesta.ok || info.success !== true) {
          throw new Error('No se pudo consultar la cancelacion.');
        }

        setCancelacion(info);

      } catch {
        setErrorCancelacion(
          'No se pudo consultar la cancelacion. Actualiza el estado.'
        );
      }
    }
  };

  useEffect(() => {
    setEstado(null);
    setArchivos([]);
    setMensaje('');
    setError('');

    consultarEstado().catch(err => {
      setError(err.message);
    });
  }, [ruta]);

  const entregar = async () => {

    if (!archivos.length || enviando) return;

    setError('');
    setMensaje('');

    setConfirmacion(null);

    setEnviando(true);

    try {
      const formulario = new FormData();
      archivos.forEach(a =>
        formulario.append('archivo', a)
      );

      const response = await fetch(`${ruta}/submit`, {
        method: 'POST',
        credentials: 'include',
        body: formulario
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || 'No se pudo verificar la entrega.'
        );
      }

      setMensaje(
        data.estado === 'draft'
          ? `Borrador guardado: ${data.archivos.length} archivo(s). Confirma el envio.`
          : `Entrega registrada en Moodle: ${data.archivos.length} archivo(s).`
      );

      setArchivos([]);

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error al entregar la actividad.'
      );
    } finally {
      try {
        await consultarEstado();
      } catch {
        setEstado(null);
        setError(prev =>
          prev || 'No se pudo actualizar el estado.'
        );
      }

      setEnviando(false);
    }
  };



  const solicitarCancelacion = async () => {
    if (
      enviando ||
      !cancelacion?.puedeSolicitar ||
      estado?.estado !== 'submitted'
    ) return;

    setConfirmacion(null);
    setEnviando(true);
    setError('');
    setMensaje('');

    try {
      const response = await fetch(`${ruta}/cancellation`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.success !== true) {
        throw new Error(
          data.error || 'No se pudo solicitar la cancelacion.'
        );
      }

      setMensaje(
        'Solicitud enviada al profesor. Tus archivos se conservan.'
      );

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error al solicitar la cancelacion.'
      );
    } finally {
      try {
        await consultarEstado();
      } catch {
        setEstado(null);
        setCancelacion(null);
        setError('No se pudo actualizar el estado.');
      }

      setEnviando(false);
    }
  };

  const confirmarEnvio = async () => {
    if (
      enviando ||
      !estado?.puedeEnviar ||
      estado.estado !== 'draft'
    ) return;

    setEnviando(true);
    setError('');
    setMensaje('');

    try {
      const response = await fetch(`${ruta}/confirm`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || 'No se pudo confirmar el envio.'
        );
      }

      setMensaje('Entrega confirmada correctamente en Moodle.');

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error al confirmar el envio.'
      );
    } finally {
      try {
        await consultarEstado();
      } catch {
        setEstado(null);
        setError(prev =>
          prev || 'No se pudo actualizar el estado.'
        );
      }

      setEnviando(false);
    }
  };

  const deshacerEntrega = async () => {
    if (enviando || !estado?.puedeDeshacer) return;

    setConfirmacion(null);

    setEnviando(true);
    setError('');
    setMensaje('');

    try {
      const response = await fetch(`${ruta}/undo`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || 'Moodle no permitió deshacer la entrega.'
        );
      }

      setArchivos([]);
      setMensaje('Entrega retirada correctamente.');

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error al deshacer la entrega.'
      );
    } finally {
      try {
        await consultarEstado();
      } catch {
        setEstado(null);
        setError(prev =>
          prev || 'No se pudo actualizar el estado.'
        );
      }

      setEnviando(false);
    }
  };

  const descripcion = new DOMParser()
    .parseFromString(tarea.descripcion || '', 'text/html')
    .body.textContent || '';

  return (
    <div className="w-full space-y-4 mt-3 border-t border-slate-200 pt-4">

      {!!estado?.archivosEntregados?.length && (
        <div className="space-y-2 rounded-xl bg-slate-50 p-4">
          <h4 className="font-bold text-sm">
            Archivos entregados
          </h4>

          {estado.archivosEntregados.map((a, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <FileText className="w-5 h-5 text-[#148ebf]" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold break-all">
                  {a.nombre}
                </p>
                <p className="text-xs text-slate-500">
                  {(a.tamano / 1024).toFixed(1)} KB
                </p>
              </div>


              {permiteVista(a.nombre) && (
              <a
                href={`${ruta}/submission-files/${i}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Visualizar archivo"
                className="flex items-center gap-2 p-2 rounded-lg text-[#148ebf] hover:bg-sky-100"
              >
                <Eye className="w-5 h-5" />
                <span>Ver</span>
              </a>
              )}


              <a
                href={`${ruta}/submission-files/${i}?download=1`}
                download={a.nombre}
                title="Descargar archivo"
                className="p-2 rounded-lg text-[#148ebf] hover:bg-sky-100"
              >
                <Download className="w-5 h-5" />
              </a>
            </div>
          ))}
        </div>
      )}


      {tarea.requiereConfirmacion &&
        estado?.estado === 'draft' &&
        estado.puedeEnviar &&
        !!estado.archivosEntregados?.length && (

        <button
          type="button"
          disabled={enviando}
          onClick={confirmarEnvio}
          className="w-full bg-[#148ebf] text-white rounded-xl p-3 font-bold hover:bg-sky-700 disabled:opacity-50"
        >
          {enviando ? 'Procesando...' : 'Confirmar envio'}
        </button>
      )}

      {tarea.requiereConfirmacion && estado && (
        <div className="space-y-3">

          {estado.estado === 'submitted' &&
            cancelacion?.pendiente && (
            <div role="status" className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-amber-800 text-sm">
              <p className="font-bold">
                Pendiente de autorizacion del profesor
              </p>
              <p className="mt-1">
                Tu entrega sigue registrada y tus archivos se conservan.
              </p>
            </div>
          )}

          {estado.estado === 'submitted' &&
            cancelacion?.puedeSolicitar && (
            <button
              type="button"
              disabled={enviando}
              onClick={() => setConfirmacion('cancelar')}
              className="w-full flex items-center justify-center gap-2 border border-red-500 text-red-600 rounded-xl p-3 font-bold hover:bg-red-50 disabled:opacity-50"
            >
              <Undo2 className="w-5 h-5" />
              Cancelar envio
            </button>
          )}

          {estado.estado === 'draft' &&
            cancelacion?.solicitud?.status === 'approved' && (
            <div role="status" className="rounded-xl bg-green-50 text-green-700 p-4 text-sm">
              <p className="font-bold">
                Cancelacion autorizada por el profesor
              </p>
              Tus archivos se conservaron. Puedes confirmar el envio nuevamente.
            </div>
          )}

          {estado.estado === 'submitted' &&
            cancelacion?.solicitud?.status === 'rejected' && (
            <p className="rounded-xl bg-red-50 text-red-700 p-3 text-sm">
              La ultima solicitud fue rechazada. Tu entrega sigue registrada.
            </p>
          )}

          {errorCancelacion && (
            <p role="alert" className="text-sm text-red-600">
              {errorCancelacion}
            </p>
          )}

          <button
            type="button"
            disabled={enviando}
            onClick={async () => {
              setEnviando(true);
              setError('');
              setMensaje('');
              try {
                await consultarEstado();
              } catch {
                setEstado(null);
                setCancelacion(null);
                setError('No se pudo actualizar el estado.');
              } finally {
                setEnviando(false);
              }
            }}
            className="text-sm font-semibold text-[#148ebf] hover:underline disabled:opacity-50"
          >
            Actualizar estado de entrega
          </button>

        </div>
      )}

      {estado?.puedeDeshacer &&
        !(tarea.requiereConfirmacion &&
          estado.estado === 'submitted') && (
        <button
          type="button"
          disabled={enviando}
          onClick={() => setConfirmacion('deshacer')}
          className="w-full border border-red-500 text-red-600 rounded-xl p-3 font-bold hover:bg-red-50 disabled:opacity-50"
        >
          {enviando ? 'Procesando...' : 'Deshacer entrega'}
        </button>
      )}


      <div>
        <h4 className="font-bold text-slate-800">
          Instrucciones
        </h4>

        <p className="text-sm text-slate-600 whitespace-pre-line mt-2">
          {descripcion || 'Sin instrucciones adicionales.'}
        </p>
      </div>

      {tarea.fechaLimite > 0 && (
        <p className="text-sm font-semibold text-slate-600">
          Fecha límite: {
            new Date(
              tarea.fechaLimite * 1000
            ).toLocaleString('es-MX')
          }
        </p>
      )}

      {tarea.archivos.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-bold text-sm">
            Archivos de la actividad
          </h4>

          {tarea.archivos
            .filter(a => a.nombre.toLowerCase().endsWith('.pdf'))
            .map(a => (
              <a
                key={a.indice}
                href={`${ruta}/files/${a.indice}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 text-[#148ebf] text-sm font-semibold"
              >
                <FileText className="w-5 h-5" />

                <span className="flex-1 break-all">
                  {a.nombre}
                </span>

                <Download className="w-5 h-5" />
              </a>
          ))}
        </div>
      )}

      <div className="rounded-xl bg-slate-50 p-4 space-y-2">

        <h4 className="font-bold text-sm">
          Estado de entrega
        </h4>

        {!estado && !error && (
          <p className="text-sm text-slate-500">
            Consultando Moodle...
          </p>
        )}

        {estado?.estado === 'submitted' && (
          <p className="flex items-center gap-2 text-green-700 font-semibold text-sm">
            <CheckCircle className="w-5 h-5" />
            Entregado para calificación
          </p>
        )}

        {estado && ['new', 'reopened'].includes(estado.estado) && (
          <p className="text-sm font-semibold text-amber-600">
            Pendiente de entregar
          </p>
        )}

        {estado?.estado === 'draft' && (
          <p className="text-sm text-amber-600">
            Borrador guardado. Falta confirmar la entrega.
          </p>
        )}

        {estado && !['new', 'reopened', 'submitted', 'draft'].includes(estado.estado) && (
          <p className="text-sm text-slate-600">
            Estado en Moodle: {estado.estado}
          </p>
        )}

        {estado && ['new', 'reopened'].includes(estado.estado) && !estado.puedeEditar && (
          <p className="text-sm text-slate-600">
            Moodle no permite realizar entregas actualmente.
          </p>
        )}

      </div>

      {estado && ['new', 'reopened'].includes(estado.estado) &&
        estado.puedeEditar && (

        <div className="space-y-3">


          <label className="block border-2 border-dashed border-sky-300 rounded-xl p-5 text-center cursor-pointer">

            <Upload className="w-7 h-7 mx-auto text-[#22abe2]" />

            <p className="text-sm font-bold mt-2">
              Agregar archivos
            </p>

            <p className="text-xs text-slate-500 mt-1">
              {archivos.length} de {limites.maxArchivos} archivos
            </p>

            <p className="text-xs text-slate-500">
              Máximo por archivo:
              {' '}{(limites.maxBytes / 1024 / 1024).toFixed(1)} MB
            </p>

            <p className="text-xs text-slate-500">
              Formatos: {limites.formatos.join(', ') || 'Todos los permitidos por Moodle'}
            </p>

            <input
              type="file"
              multiple
              accept={limites.formatos.every(f => f.startsWith('.'))
                ? limites.formatos.join(',')
                : undefined}
              className="sr-only"
              disabled={enviando || archivos.length >= limites.maxArchivos}
              onChange={e => {
                agregarArchivos(Array.from(e.target.files || []));
                e.target.value = '';
              }}
            />

          </label>

          {archivos.map((archivo, i) => (
            <div
              key={archivo.name}
              className="flex flex-wrap items-center gap-3 border border-sky-200 bg-sky-50 rounded-xl p-4"
            >

              <FileText className="w-9 h-9 text-[#148ebf]" />

              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm break-all">
                  {archivo.name}
                </p>

                <p className="text-xs text-slate-500">
                  {(archivo.size / 1024).toFixed(1)} KB
                </p>

                <p className="text-xs text-green-700 font-semibold mt-1">
                  Listo para entregar
                </p>
              </div>

              {vistasPrevias[i] && permiteVista(archivo.name) && (
                <a
                  href={vistasPrevias[i]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 text-[#148ebf] rounded-lg hover:bg-sky-100"
                >
                  <Eye className="w-5 h-5" />
                  Vista previa
                </a>
              )}

              <button
                type="button"
                disabled={enviando}
                onClick={() => setArchivos(prev =>
                  prev.filter((_, indice) => indice !== i)
                )}
                title="Quitar archivo"
                className="p-2 text-red-600 rounded-lg hover:bg-red-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}

          <button
            type="button"
            disabled={!archivos.length || enviando}
            onClick={() => setConfirmacion('entregar')}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#22abe2] text-white font-bold text-sm p-3 disabled:opacity-50"
          >
            {enviando ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Upload className="w-5 h-5" />
            )}

            {enviando
              ? 'Enviando a Moodle...'
              : tarea.requiereConfirmacion
                ? 'Guardar archivos'
                : 'Entregar actividad'}

          </button>
        </div>
      )}

      {tarea.requiereConfirmacion &&
        estado?.estado !== 'submitted' && (
        <p className="text-sm text-sky-700">
          Esta actividad requiere confirmar el envio
          despues de guardar los archivos.
        </p>
      )}

      {mensaje && (
        <div role="status" className="bg-green-50 text-green-700 rounded-xl p-3 text-sm">
          {mensaje}
        </div>
      )}

      {error && (
        <div role="alert" className="bg-red-50 text-red-700 rounded-xl p-3 text-sm">
          {error}
        </div>
      )}

      {confirmacion && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Confirmar operación"
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-5"
          >

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setConfirmacion(null)}
                aria-label="Cerrar"
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex justify-center">
              {confirmacion === 'entregar' ? (
                <div className="bg-sky-100 text-[#148ebf] rounded-full p-4">
                  <Upload className="w-8 h-8" />
                </div>
              ) : (
                <div className="bg-red-100 text-red-600 rounded-full p-4">
                  <Undo2 className="w-8 h-8" />
                </div>
              )}
            </div>

            <h3 className="text-xl font-bold text-center text-slate-900">
              {confirmacion === 'entregar'
                ? '¿Confirmar entrega?'
                : confirmacion === 'cancelar'
                  ? '¿Solicitar cancelacion?'
                  : '¿Deshacer entrega?'}
            </h3>

            <p className="text-sm text-center text-slate-600">
              {confirmacion === 'entregar'
                ? 'Tus archivos serán enviados al profesor para su revisión y calificación.'
                : confirmacion === 'cancelar'
                  ? 'Se solicitara autorizacion al profesor. Tus archivos no seran eliminados y tu entrega seguira registrada hasta recibir una respuesta.'
                  : 'Se retirarán los archivos de Moodle. Podrás realizar una nueva entrega si la actividad lo permite.'}
            </p>


            {confirmacion === 'entregar' && (
              <div className="bg-slate-50 rounded-xl p-3 space-y-2 max-h-48 overflow-y-auto">
                <p className="font-bold text-sm">
                  {archivos.length} archivo(s) seleccionados
                </p>

                {archivos.map(a => (
                  <div key={a.name} className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-[#148ebf]" />
                    <span className="text-sm break-all">
                      {a.name}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">

              <button
                type="button"
                onClick={() => setConfirmacion(null)}
                className="border border-slate-300 rounded-xl p-3 font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={enviando}
                onClick={() => {
                  if (confirmacion === 'entregar') {
                    void entregar();
                  } else if (confirmacion === 'cancelar') {
                    void solicitarCancelacion();
                  } else {
                    void deshacerEntrega();
                  }
                }}
                className={`rounded-xl p-3 font-bold text-white ${
                  confirmacion === 'entregar'
                    ? 'bg-[#148ebf] hover:bg-sky-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {confirmacion === 'entregar'
                  ? 'Confirmar entrega'
                  : confirmacion === 'cancelar'
                    ? 'Solicitar cancelacion'
                    : 'Deshacer entrega'}
              </button>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
