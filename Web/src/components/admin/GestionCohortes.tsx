import React, { useEffect, useState } from 'react';
import { Users, RefreshCw } from 'lucide-react';

interface Cohorte {
  id: number;
  nombre: string;
  clave: string;
}

async function api(
  ruta: string,
  metodo = 'GET',
  cuerpo?: object
) {
  const respuesta = await fetch(
    '/api/auth/admin/cohortes' + ruta,
    {
      method: metodo,
      credentials: 'include',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json'
      },
      body: cuerpo
        ? JSON.stringify(cuerpo)
        : undefined
    }
  );

  const datos = await respuesta.json();

  if (!respuesta.ok || !datos.success) {
    throw new Error(datos.error || 'Operacion rechazada');
  }

  return datos;
}

export const GestionCohortes: React.FC = () => {

  const [cohortes, setCohortes] = useState<Cohorte[]>([]);
  const [nombre, setNombre] = useState('');
  const [clave, setClave] = useState('');
  const [usuarioId, setUsuarioId] = useState('');

  const [seleccionada, setSeleccionada] =
    useState<Cohorte | null>(null);

  const [integrantes, setIntegrantes] =
    useState<number[]>([]);

  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const campo = 'border rounded-xl p-3 w-full';

  const boton =
    'bg-sky-600 text-white px-4 py-3 rounded-xl disabled:opacity-50';

  async function cargar() {
    const datos = await api('');
    setCohortes(datos.cohortes);
  }

  async function ejecutar(fn: () => Promise<void>) {
    setOcupado(true);
    setError('');
    setMensaje('');

    try {
      await fn();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setOcupado(false);
    }
  }

  useEffect(() => {
    void ejecutar(cargar);
  }, []);

  async function crear(e: React.FormEvent) {
    e.preventDefault();

    await ejecutar(async () => {
      await api('', 'POST', { nombre, clave });

      setNombre('');
      setClave('');
      setMensaje('Cohorte creada en Moodle');

      await cargar();
    });
  }

  async function consultar(c: Cohorte) {
    setSeleccionada(null);
    setIntegrantes([]);

    await ejecutar(async () => {
      const datos = await api(`/${c.id}/integrantes`);

      setIntegrantes(datos.integrantes);
      setSeleccionada(c);
    });
  }

  async function agregar(e: React.FormEvent) {
    e.preventDefault();

    if (!seleccionada) return;

    await ejecutar(async () => {

      const datos = await api(
        `/${seleccionada.id}/integrantes`,
        'POST',
        { usuarioId: Number(usuarioId) }
      );

      setIntegrantes(datos.integrantes);
      setUsuarioId('');
      setMensaje('Integrante agregado correctamente');
    });
  }

  return (
    <section className="bg-white border rounded-3xl p-6 space-y-6">

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex gap-2">
          <Users className="text-sky-600" />
          Gestión de cohortes
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
        <p className="text-sky-600">Procesando...</p>
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

      <form
        onSubmit={crear}
        className="bg-slate-50 rounded-2xl p-5 space-y-3"
      >
        <h3 className="font-bold">Crear cohorte</h3>

        <input
          className={campo}
          placeholder="Nombre de la cohorte"
          value={nombre}
          maxLength={254}
          required
          onChange={e => setNombre(e.target.value)}
        />

        <input
          className={campo}
          placeholder="Clave de la cohorte"
          value={clave}
          maxLength={100}
          required
          onChange={e => setClave(e.target.value)}
        />

        <button className={boton} disabled={ocupado}>
          Crear cohorte
        </button>
      </form>

      {cohortes.map(c => (
        <div
          key={c.id}
          className="border rounded-xl p-4 flex justify-between items-center gap-3"
        >
          <div>
            <p className="font-bold">{c.nombre}</p>
            <p className="text-sm text-slate-500">
              {c.clave} | ID: {c.id}
            </p>
          </div>

          <button
            className="border rounded-xl p-3"
            disabled={ocupado}
            onClick={() => consultar(c)}
          >
            Integrantes
          </button>
        </div>
      ))}

      {!ocupado && cohortes.length === 0 && (
        <p className="text-slate-500">
          No hay cohortes disponibles.
        </p>
      )}

      {seleccionada && (
        <section className="border rounded-2xl p-5 space-y-4">

          <h3 className="font-bold">
            Integrantes de {seleccionada.nombre}
          </h3>

          <p>Total: {integrantes.length}</p>

          <form
            onSubmit={agregar}
            className="space-y-3"
          >
            <input
              className={campo}
              type="number"
              min="1"
              step="1"
              required
              placeholder="ID del usuario Moodle"
              value={usuarioId}
              onChange={e => setUsuarioId(e.target.value)}
            />

            <button
              className={boton}
              disabled={ocupado}
            >
              Agregar integrante
            </button>
          </form>

          {integrantes.map(id => (
            <p key={id} className="border-b py-2">
              Usuario Moodle #{id}
            </p>
          ))}

          <button
            className="text-sky-600"
            onClick={() => setSeleccionada(null)}
          >
            Cerrar integrantes
          </button>
        </section>
      )}
    </section>
  );
};
