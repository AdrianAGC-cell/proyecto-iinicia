import React, { useEffect, useState } from 'react';

interface Programa {
  id: string;
  title: string;
  is_active: boolean;
}

interface Curso {
  id: number;
  nombre: string;
}

interface Asociacion {
  program_id: string;
  moodle_course_id: number;
  is_active: boolean;
}

async function consultar(ruta: string, cuerpo?: object) {
  const respuesta = await fetch('/api/auth/admin/' + ruta, {
    credentials: 'include',
    cache: 'no-store',
    method: cuerpo ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json' },
    ...(cuerpo ? { body: JSON.stringify(cuerpo) } : {})
  });

  const datos = await respuesta.json();

  if (!respuesta.ok || !datos.success) {
    throw new Error(datos.error || 'Operacion no disponible');
  }

  return datos;
}

export const GestionProgramas: React.FC = () => {

  const [programas, setProgramas] = useState<Programa[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [asociaciones, setAsociaciones] =
    useState<Asociacion[]>([]);

  const [programaId, setProgramaId] = useState('');
  const [cursoId, setCursoId] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [ocupado, setOcupado] = useState(false);

  async function cargar() {
    const [datos, listado] = await Promise.all([
      consultar('programas-cursos'),
      consultar('cursos')
    ]);

    setProgramas(datos.programas);
    setAsociaciones(datos.asociaciones);
    setCursos(listado.cursos);
  }

  useEffect(() => {
    cargar().catch(e => setError(e.message));
  }, []);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();

    if (ocupado || !programaId || !cursoId) return;

    setOcupado(true);
    setError('');
    setMensaje('');

    try {
      await consultar('programas-cursos', {
        programaId,
        cursoId: Number(cursoId)
      });

      await cargar();
      setMensaje('Curso asociado correctamente');

    } catch (e: any) {
      setError(e.message);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <section className="bg-white border rounded-2xl p-6 space-y-5">

      <h2 className="text-xl font-bold">
        Programas y cursos institucionales
      </h2>

      <p className="text-sm text-slate-500">
        Define los cursos autorizados para cada programa académico.
      </p>

      {error && <p className="text-red-600">{error}</p>}
      {mensaje && <p className="text-green-600">{mensaje}</p>}

      <form onSubmit={guardar}
        className="grid md:grid-cols-3 gap-3">

        <select required
          className="border rounded-lg p-3"
          value={programaId}
          onChange={e => setProgramaId(e.target.value)}>

          <option value="">Selecciona un programa</option>

          {programas.filter(p => p.is_active).map(p => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>

        <select required
          className="border rounded-lg p-3"
          value={cursoId}
          onChange={e => setCursoId(e.target.value)}>

          <option value="">Selecciona un curso Moodle</option>

          {cursos.map(c => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>

        <button disabled={ocupado || !programaId || !cursoId}
          className="bg-sky-600 text-white rounded-lg p-3 disabled:opacity-50">

          {ocupado ? 'Guardando...' : 'Asociar curso'}
        </button>

      </form>

      <div className="space-y-2">

        {asociaciones.length === 0 && (
          <p className="text-slate-500">
            No hay asociaciones registradas.
          </p>
        )}

        {asociaciones.map(a => (
          <div
            key={`${a.program_id}-${a.moodle_course_id}`}
            className="border rounded-xl p-4">

            <p className="font-bold">
              {programas.find(p => p.id === a.program_id)?.title
                || a.program_id}
            </p>

            <p className="text-sm text-slate-600">
              {cursos.find(c => c.id === a.moodle_course_id)?.nombre
                || `Curso Moodle ${a.moodle_course_id}`}
            </p>

            <p className="text-xs text-slate-500">
              {a.is_active ? 'Asociación activa' : 'Inactiva'}
            </p>

          </div>
        ))}

      </div>
    </section>
  );
};
