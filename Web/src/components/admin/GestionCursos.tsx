import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Plus,
  Pencil,
  Users,
  RefreshCw
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

interface Curso {
  id: number;
  nombre: string;
  nombreCorto: string;
  categoria: number;
  visible: boolean;
}

interface Categoria {
  id: number;
  nombre: string;
}

interface Participante {
  id: number;
  nombre: string;
  roles: string[];
}

const BASE = '/api/auth/admin';

async function api(
  ruta: string,
  metodo = 'GET',
  cuerpo?: object
) {
  const respuesta = await fetch(BASE + ruta, {
    method: metodo,
    credentials: 'include',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json'
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined
  });

  const datos = await respuesta.json();

  if (!respuesta.ok || !datos.success) {
    throw new Error(
      datos.error || 'No se pudo completar la operacion'
    );
  }

  return datos;
}

export const GestionCursos: React.FC = () => {

  const { user } = useAuth();

  const [cursos, setCursos] = useState<Curso[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [participantes, setParticipantes] = useState<Participante[]>([]);

  const [usuarioMatricula, setUsuarioMatricula] = useState('');

  const [nombre, setNombre] = useState('');
  const [clave, setClave] = useState('');
  const [categoria, setCategoria] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const [editando, setEditando] = useState<number | null>(null);
  const [nuevoNombre, setNuevoNombre] = useState('');

  const [cursoSeleccionado, setCursoSeleccionado] =
    useState<Curso | null>(null);

  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const puedeCrear =
    user?.role === 'superadmin' ||
    user?.role === 'admin_academico';

  async function cargar() {
    const [c, cat] = await Promise.all([
      api('/cursos'),
      api('/categorias')
    ]);

    setCursos(c.cursos);
    setCategorias(cat.categorias);
  }

  async function ejecutar(
    operacion: () => Promise<void>
  ) {
    setOcupado(true);
    setError('');
    setMensaje('');

    try {
      await operacion();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setOcupado(false);
    }
  }

  useEffect(() => {
    void ejecutar(cargar);
  }, [user?.id, user?.role]);

  async function crear(e: React.FormEvent) {
    e.preventDefault();

    await ejecutar(async () => {
      const resultado = await api(
        '/cursos',
        'POST',
        {
          nombre,
          clave,
          categoria: Number(categoria)
        }
      );

      setNombre('');
      setClave('');

      setMensaje(
        `Curso creado en Moodle. ID: ${resultado.curso.id}`
      );

      await cargar();
    });
  }

  async function editar(id: number) {

    await ejecutar(async () => {

      await api(
        `/cursos/${id}`,
        'PATCH',
        { nombre: nuevoNombre }
      );

      setEditando(null);
      setMensaje('Curso actualizado en Moodle');

      await cargar();
    });
  }

  async function verParticipantes(curso: Curso) {

    setCursoSeleccionado(null);
    setParticipantes([]);

    await ejecutar(async () => {

      const resultado = await api(
        `/cursos/${curso.id}/participantes`
      );

      setParticipantes(resultado.participantes);
      setCursoSeleccionado(curso);
    });
  }

  async function matricular(e: React.FormEvent) {
    e.preventDefault();

    if (!cursoSeleccionado) return;

    const curso = cursoSeleccionado;

    await ejecutar(async () => {

      await api(
        `/cursos/${curso.id}/matriculas`,
        'POST',
        {
          usuarioId: Number(usuarioMatricula)
        }
      );

      setUsuarioMatricula('');
      setMensaje('Estudiante matriculado en Moodle');

      const resultado = await api(
        `/cursos/${curso.id}/participantes`
      );

      setParticipantes(resultado.participantes);
    });
  }

  const filtrados = cursos.filter(c =>
    `${c.nombre} ${c.nombreCorto}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  const campo = 'border rounded-xl p-3 w-full';

  const boton =
    'bg-sky-600 text-white px-4 py-3 rounded-xl disabled:opacity-50';

  return (
    <section className="bg-white border rounded-3xl p-6 space-y-6">

      <div className="flex justify-between items-center gap-3">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BookOpen className="text-sky-600" />
          Gestión de cursos
        </h2>

        <button
          className={boton}
          disabled={ocupado}
          onClick={() => ejecutar(cargar)}
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {ocupado && (
        <p className="text-sky-600">
          Procesando solicitud...
        </p>
      )}

      {error && (
        <p className="bg-red-50 text-red-700 p-4 rounded-xl">
          {error}
        </p>
      )}

      {mensaje && (
        <p className="bg-green-50 text-green-700 p-4 rounded-xl">
          {mensaje}
        </p>
      )}

      {puedeCrear && (
        <form
          onSubmit={crear}
          className="bg-slate-50 rounded-2xl p-5 space-y-4"
        >
          <h3 className="font-bold flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Crear curso en Moodle
          </h3>

          <input
            className={campo}
            placeholder="Nombre completo del curso"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            maxLength={254}
            required
          />

          <input
            className={campo}
            placeholder="Clave única del curso"
            value={clave}
            onChange={e => setClave(e.target.value)}
            maxLength={100}
            required
          />

          <select
            className={campo}
            value={categoria}
            onChange={e => setCategoria(e.target.value)}
            required
          >
            <option value="">Seleccionar categoría</option>

            {categorias.map(c => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>

          <p className="text-sm text-slate-500">
            El curso se creará inicialmente oculto.
          </p>

          <button
            className={boton}
            disabled={ocupado}
            type="submit"
          >
            Crear curso
          </button>
        </form>
      )}

      <input
        className={campo}
        placeholder="Buscar curso por nombre o clave..."
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
      />

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3">Curso</th>
              <th className="p-3">Clave</th>
              <th className="p-3">Categoría</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {filtrados.map(c => (
              <tr key={c.id} className="border-b">
                <td className="p-3 font-semibold">
                  {c.nombre}
                </td>

                <td className="p-3">{c.nombreCorto}</td>

                <td className="p-3">
                  {categorias.find(
                    cat => cat.id === c.categoria
                  )?.nombre || c.categoria}
                </td>

                <td className="p-3">
                  {c.visible ? 'Visible' : 'Oculto'}
                </td>

                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      disabled={ocupado}
                      className="border rounded-lg p-2 flex gap-2"
                      onClick={() => {
                        setEditando(c.id);
                        setNuevoNombre(c.nombre);
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                      Editar
                    </button>

                    <button
                      disabled={ocupado}
                      className="border rounded-lg p-2 flex gap-2"
                      onClick={() => verParticipantes(c)}
                    >
                      <Users className="w-4 h-4" />
                      Participantes
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!ocupado && filtrados.length === 0 && (
          <p className="p-5 text-slate-500">
            No hay cursos disponibles.
          </p>
        )}
      </div>

      {editando !== null && (
        <form
          className="border rounded-2xl p-5 space-y-4"
          onSubmit={e => {
            e.preventDefault();
            void editar(editando);
          }}
        >
          <h3 className="font-bold">Editar nombre del curso</h3>

          <input
            className={campo}
            value={nuevoNombre}
            onChange={e => setNuevoNombre(e.target.value)}
            maxLength={254}
            required
          />

          <div className="flex gap-3">
            <button
              className={boton}
              disabled={ocupado}
            >
              Guardar cambios
            </button>

            <button
              type="button"
              className="border rounded-xl px-4"
              disabled={ocupado}
              onClick={() => setEditando(null)}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {cursoSeleccionado && (
        <section className="border rounded-2xl p-5 space-y-4">

          <div className="flex justify-between items-center">
            <h3 className="font-bold">
              Participantes: {cursoSeleccionado.nombre}
            </h3>

            <button
              className="text-sky-600"
              onClick={() => setCursoSeleccionado(null)}
            >
              Cerrar
            </button>
          </div>

          {puedeCrear && (
            <form
              onSubmit={matricular}
              className="bg-slate-50 rounded-xl p-4 space-y-3"
            >
              <h4 className="font-bold">
                Matricular estudiante
              </h4>

              <input
                type="number"
                min="1"
                step="1"
                required
                className={campo}
                placeholder="ID del usuario en Moodle"
                value={usuarioMatricula}
                onChange={e =>
                  setUsuarioMatricula(e.target.value)
                }
              />

              <button
                type="submit"
                disabled={ocupado}
                className={boton}
              >
                Matricular estudiante
              </button>
            </form>
          )}

          <p>Total: {participantes.length}</p>

          {participantes.map(p => (
            <div
              key={p.id}
              className="border-b py-3"
            >
              <p className="font-semibold">{p.nombre}</p>

              <p className="text-sm text-slate-500">
                {p.roles.join(', ')}
              </p>
            </div>
          ))}

          {participantes.length === 0 && (
            <p>No hay participantes matriculados.</p>
          )}
        </section>
      )}

    </section>
  );
};
