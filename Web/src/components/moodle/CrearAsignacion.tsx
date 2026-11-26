import React, { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';

type Props = {
  courseId: number;
  secciones: { id: number; numero: number; nombre: string }[];
  onCreated: () => void;
};

export const CrearAsignacion: React.FC<Props> = ({
  courseId, secciones, onCreated
}) => {
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [incierto, setIncierto] = useState(false);

  const campo = 'w-full border border-slate-300 rounded-xl p-3 text-sm';

  async function crear(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (guardando || incierto) return;

    const datos = new FormData(e.currentTarget);

    const fecha = (nombre: string) => {
      const valor = String(datos.get(nombre) || '');
      return valor
        ? Math.floor(new Date(valor).getTime() / 1000)
        : 0;
    };

    const tarea = {
      section: Number(datos.get('section')),
      name: String(datos.get('name')).trim(),
      description: String(datos.get('description')),
      availablefrom: fecha('availablefrom'),
      duedate: fecha('duedate'),
      cutoffdate: fecha('cutoffdate'),
      grade: Number(datos.get('grade')),
      maxfiles: Number(datos.get('maxfiles')),
      maxbytes: Number(datos.get('maxmb')) * 1024 * 1024,
      visible: datos.get('visible') === 'on'
    };

    setError('');
    setMensaje('');

    if (
      !tarea.name ||
      tarea.duedate <= tarea.availablefrom ||
      tarea.duedate <= Math.floor(Date.now() / 1000) ||
      (tarea.cutoffdate && tarea.cutoffdate < tarea.duedate)
    ) {
      setError('Revisa el nombre y las fechas de entrega.');
      return;
    }

    setGuardando(true);

    try {
      const respuesta = await fetch(
        `/api/auth/teacher/courses/${courseId}/assignments`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(tarea)
        }
      );

      const resultado = await respuesta.json();

      if (respuesta.status !== 201 || !resultado.success) {
        if (respuesta.status >= 500) setIncierto(true);

        throw new Error(
          resultado.error || 'No se pudo crear la asignación.'
        );
      }

      setMensaje('Asignación creada correctamente en Moodle.');
      setAbierto(false);
      onCreated();

    } catch (err) {
      if (err instanceof TypeError || err instanceof SyntaxError) {
        setIncierto(true);
      }

      setError(
        err instanceof Error
          ? err.message
          : 'Error creando la asignación.'
      );

    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">

      <button
        type="button"
        disabled={guardando}
        onClick={() => setAbierto(!abierto)}
        className="flex items-center gap-2 bg-[#148ebf] text-white font-bold rounded-xl px-5 py-3"
      >
        <Plus className="w-5 h-5" />
        {abierto ? 'Cerrar formulario' : 'Crear asignación'}
      </button>

      {mensaje && (
        <p role="status" className="text-green-700 bg-green-50 p-3 rounded-xl">
          {mensaje}
        </p>
      )}

      {error && (
        <p role="alert" className="text-red-700 bg-red-50 p-3 rounded-xl">
          {error}
        </p>
      )}

      {incierto && (
        <p className="text-amber-700">
          Consulta las actividades del curso antes de volver
          a crear la asignación. El resultado no pudo confirmarse.
        </p>
      )}

      {abierto && (
        <form onSubmit={crear} className="space-y-4">
          <fieldset disabled={guardando || incierto} className="space-y-4">

            <h3 className="text-lg font-bold">
              Nueva asignación
            </h3>

            <label className="block text-sm font-semibold">
              Sección del curso
              <select name="section" required className={campo}>
                {secciones.map(s => (
                  <option key={s.id} value={s.numero}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-semibold">
              Nombre de la asignación
              <input
                name="name"
                required
                maxLength={200}
                className={campo}
                placeholder="Ej. Práctica 5"
              />
            </label>

            <label className="block text-sm font-semibold">
              Instrucciones
              <textarea
                name="description"
                rows={5}
                maxLength={10000}
                required
                className={campo}
                placeholder="Describe la actividad y los requisitos."
              />
            </label>

            <div className="grid md:grid-cols-3 gap-4">

              <label className="text-sm font-semibold">
                Permitir entregas desde
                <input
                  name="availablefrom"
                  type="datetime-local"
                  className={campo}
                />
              </label>

              <label className="text-sm font-semibold">
                Fecha límite
                <input
                  name="duedate"
                  type="datetime-local"
                  required
                  className={campo}
                />
              </label>

              <label className="text-sm font-semibold">
                Fecha de cierre (opcional)
                <input
                  name="cutoffdate"
                  type="datetime-local"
                  className={campo}
                />
              </label>

            </div>

            <div className="grid md:grid-cols-3 gap-4">

              <label className="text-sm font-semibold">
                Calificación máxima
                <input
                  name="grade"
                  type="number"
                  min={1}
                  max={100}
                  defaultValue={100}
                  required
                  className={campo}
                />
              </label>

              <label className="text-sm font-semibold">
                Cantidad máxima de PDF
                <input
                  name="maxfiles"
                  type="number"
                  min={1}
                  max={10}
                  defaultValue={1}
                  required
                  className={campo}
                />
              </label>

              <label className="text-sm font-semibold">
                Tamaño máximo por archivo
                <select name="maxmb" className={campo}>
                  {[1, 2, 5, 10, 20].map(mb => (
                    <option key={mb} value={mb}>
                      {mb} MB
                    </option>
                  ))}
                </select>
              </label>

            </div>

            <div className="bg-slate-50 rounded-xl p-4 text-sm">
              <p>Formato permitido: PDF</p>
              <p>Entrega individual</p>
              <p>Confirmación de entrega obligatoria</p>
              <p>Retroalimentación del profesor habilitada</p>
              <p>Fechas según la hora local de tu dispositivo</p>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                name="visible"
                type="checkbox"
                defaultChecked
              />
              Visible para los estudiantes
            </label>

            <button
              type="submit"
              disabled={guardando || incierto || !secciones.length}
              className="bg-[#148ebf] text-white rounded-xl px-5 py-3 font-bold flex items-center gap-2 disabled:opacity-50"
            >
              {guardando && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {guardando ? 'Guardando...' : 'Guardar asignación'}
            </button>

          </fieldset>
        </form>
      )}
    </div>
  );
};
