import { useEffect, useRef, useState } from 'react';
import { Pencil, X, ShieldCheck, FileText } from 'lucide-react';

type Props = {
  courseId: number;
  cmid: number;
  onClose: () => void;
  onSaved: () => void;
};

type Datos = {
  name: string;
  description: string;
  descriptionformat: number;
  availablefrom: number;
  duedate: number;
  cutoffdate: number;
  modified: number;
  attachments: {
    filename: string;
    filesize: number;
    mimetype: string;
  }[];
};

function fechaLocal(segundos: number) {
  if (!segundos) return '';
  const fecha = new Date(segundos * 1000);
  return new Date(
    fecha.getTime() - fecha.getTimezoneOffset() * 60000
  ).toISOString().slice(0, 16);
}

function segundos(fecha: string) {
  return fecha
    ? Math.floor(new Date(fecha).getTime() / 1000)
    : 0;
}

export const EditarAsignacion = ({
  courseId, cmid, onClose, onSaved
}: Props) => {
  const dialogo = useRef<HTMLDialogElement>(null);
  const [datos, setDatos] = useState<Datos | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [incierto, setIncierto] = useState(false);

  const ruta =
    `/api/auth/teacher/courses/${courseId}/modules/${cmid}/settings`;

  useEffect(() => {
    const elemento = dialogo.current;
    elemento?.showModal();
    return () => elemento?.close();
  }, []);

  useEffect(() => {
    const controlador = new AbortController();

    fetch(ruta, {
      credentials: 'include',
      signal: controlador.signal
    })
      .then(async respuesta => {
        const resultado = await respuesta.json();

        if (!respuesta.ok || resultado.success !== true) {
          throw new Error(resultado.error || 'No se pudo cargar');
        }

        setDatos(resultado);
      })
      .catch(e => {
        if (!controlador.signal.aborted) {
          setError(e.message);
        }
      })
      .finally(() => {
        if (!controlador.signal.aborted) {
          setCargando(false);
        }
      });

    return () => controlador.abort();
  }, [ruta]);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();

    if (!datos || guardando || incierto) return;

    setGuardando(true);
    setError('');

    try {
      const respuesta = await fetch(ruta, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: datos.name,
          description: datos.description,
          availablefrom: datos.availablefrom,
          duedate: datos.duedate,
          cutoffdate: datos.cutoffdate,
          modified: datos.modified
        })
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok || resultado.success !== true) {
        if (respuesta.status >= 500) setIncierto(true);

        setError(resultado.error || 'No se pudo guardar');
        return;
      }

      onSaved();

    } catch {
      setIncierto(true);
      setError(
        'No se pudo confirmar el cambio. Cierra y vuelve a consultar la asignación.'
      );
    } finally {
      setGuardando(false);
    }
  }

  const campo =
    'w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#148ebf]';

  return (
    <dialog
      ref={dialogo}
      aria-labelledby="titulo-editar-asignacion"
      onCancel={e => {
        e.preventDefault();
        if (!guardando) onClose();
      }}
      className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-0 shadow-2xl backdrop:bg-slate-950/60 backdrop:backdrop-blur-sm"
    >
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-4">
          <div className="bg-sky-50 text-[#148ebf] p-3 rounded-2xl">
            <Pencil className="w-6 h-6" />
          </div>

          <div className="flex-1">
            <h2 id="titulo-editar-asignacion"
              className="text-xl font-black text-slate-900">
              Editar asignación
            </h2>
            <p className="text-sm text-slate-500">
              Gestión académica IINICIA
            </p>
          </div>

          <button
            type="button"
            aria-label="Cerrar"
            disabled={guardando}
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div role="alert"
            className="bg-red-50 text-red-700 rounded-xl p-4 text-sm">
            {error}
          </div>
        )}

        {cargando && (
          <p className="text-sm text-slate-500">
            Consultando información de Moodle...
          </p>
        )}

        {datos && datos.descriptionformat !== 2 && (
          <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
            Esta actividad contiene instrucciones con formato
            avanzado. Debe editarse desde Moodle.
          </div>
        )}

        {datos && datos.descriptionformat === 2 && (
          <form onSubmit={guardar} className="space-y-4">

            <label className="block text-sm font-bold text-slate-700">
              Nombre de la asignación
              <input
                className={campo}
                required
                maxLength={200}
                value={datos.name}
                onChange={e => setDatos({
                  ...datos, name: e.target.value
                })}
              />
            </label>

            <label className="block text-sm font-bold text-slate-700">
              Instrucciones
              <textarea
                className={campo}
                rows={5}
                maxLength={10000}
                value={datos.description}
                onChange={e => setDatos({
                  ...datos, description: e.target.value
                })}
              />
            </label>

            {([
              ['availablefrom', 'Fecha de apertura'],
              ['duedate', 'Fecha de entrega'],
              ['cutoffdate', 'Fecha de cierre']
            ] as const).map(([clave, titulo]) => (
              <label key={clave}
                className="block text-sm font-bold text-slate-700">
                {titulo}
                <input
                  type="datetime-local"
                  className={campo}
                  value={fechaLocal(datos[clave])}
                  onChange={e => setDatos({
                    ...datos,
                    [clave]: segundos(e.target.value)
                  })}
                />
              </label>
            ))}

            <div className="space-y-2">
              <h3 className="font-bold text-sm">
                Documentos de instrucciones existentes
              </h3>

              {datos.attachments.length === 0 && (
                <p className="text-sm text-slate-500">
                  No hay documentos adjuntos.
                </p>
              )}

              {datos.attachments.map((archivo, i) => (
                <div key={i}
                  className="flex gap-3 items-center bg-slate-50 rounded-xl p-3">
                  <FileText className="w-5 h-5 text-[#148ebf]" />
                  <span className="text-sm break-all">
                    {archivo.filename}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-3 bg-sky-50 p-4 rounded-2xl">
              <ShieldCheck className="w-5 h-5 shrink-0 text-[#148ebf]" />
              <p className="text-sm text-slate-600">
                Esta edición no permite cambiar los tipos de
                entrega ni la calificación máxima.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={guardando}
                onClick={onClose}
                className="border rounded-xl px-5 py-3 text-sm font-bold"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={guardando || incierto}
                className="bg-[#148ebf] text-white rounded-xl px-5 py-3 text-sm font-bold disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
};
