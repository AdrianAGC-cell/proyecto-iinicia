import React, { useEffect, useState } from 'react';

interface Ticket {
  id: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  resolution: string | null;
  created_at: string;
}

const base = '/api/auth/soporte';

async function api(ruta: string, metodo = 'GET', cuerpo?: object) {
  const respuesta = await fetch(base + ruta, {
    method: metodo,
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined
  });

  const datos = await respuesta.json();

  if (!respuesta.ok || !datos.success) {
    throw new Error(datos.error || 'Error de comunicacion');
  }

  return datos;
}

export const GestionSoporte: React.FC<{
  administrar?: boolean
}> = ({ administrar = false }) => {

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [asunto, setAsunto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('MOODLE');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const ruta = administrar ? '/tickets' : '/mis-tickets';

  async function cargar() {
    try {
      setError('');
      const datos = await api(ruta);
      setTickets(datos.tickets);
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => {
    setTickets([]);
    void cargar();
  }, [administrar]);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    setError('');
    setMensaje('');

    try {
      await api('/mis-tickets', 'POST', {
        asunto, descripcion, categoria
      });

      setAsunto('');
      setDescripcion('');
      setMensaje('Incidencia registrada correctamente');
      await cargar();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setOcupado(false);
    }
  }

  async function actualizar(
    ticket: Ticket,
    estado: string,
    prioridad: string,
    resolucion: string
  ) {
    setOcupado(true);
    setError('');
    setMensaje('');

    try {
      await api('/tickets/' + ticket.id, 'PATCH', {
        estado, prioridad, resolucion
      });

      setMensaje('Incidencia actualizada correctamente');
      await cargar();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <section className="bg-white border rounded-2xl p-6 space-y-5">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">
          {administrar ? 'Gestión de incidencias' : 'Mis incidencias'}
        </h2>
        <button onClick={cargar}
          className="bg-sky-600 text-white px-4 py-2 rounded-lg">
          Actualizar
        </button>
      </div>

      {error && <p className="text-red-700 bg-red-50 p-3 rounded-lg">{error}</p>}
      {mensaje && <p className="text-green-700 bg-green-50 p-3 rounded-lg">{mensaje}</p>}

      {!administrar && (
        <form onSubmit={crear} className="space-y-3">
          <input required minLength={5} maxLength={200}
            placeholder="Asunto de la incidencia"
            value={asunto}
            onChange={e => setAsunto(e.target.value)}
            className="border rounded-lg p-3 w-full" />

          <select value={categoria}
            onChange={e => setCategoria(e.target.value)}
            className="border rounded-lg p-3 w-full">
            {['ACCESO', 'MOODLE', 'PLATAFORMA', 'OTRO'].map(c =>
              <option key={c}>{c}</option>
            )}
          </select>

          <textarea required minLength={10} maxLength={5000}
            placeholder="Describe el problema. No incluyas contraseñas."
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            className="border rounded-lg p-3 w-full" />

          <button disabled={ocupado}
            className="bg-sky-600 text-white rounded-lg px-5 py-3">
            Reportar incidencia
          </button>
        </form>
      )}

      {!tickets.length && !error && (
        <p className="text-slate-500">No hay incidencias registradas.</p>
      )}

      {tickets.map(t => (
        <article key={t.id} className="border rounded-xl p-4 space-y-3">
          <div className="flex justify-between gap-3">
            <h3 className="font-bold">{t.subject}</h3>
            <span className="bg-slate-100 rounded-lg px-3 py-1 text-xs">
              {t.status}
            </span>
          </div>

          <p className="text-sm text-slate-600">{t.description}</p>
          <p className="text-xs text-slate-500">
            {t.category} · Prioridad {t.priority} ·
            {' '}{new Date(t.created_at).toLocaleString()}
          </p>

          {t.resolution && (
            <p className="bg-green-50 p-3 rounded-lg text-sm">
              Solución: {t.resolution}
            </p>
          )}

          {administrar && t.status !== 'CERRADO' && (
            <form key={t.status + t.priority}
              className="space-y-2"
              onSubmit={e => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                void actualizar(
                  t,
                  String(f.get('estado')),
                  String(f.get('prioridad')),
                  String(f.get('resolucion') || '')
                );
              }}>

              <select name="estado" className="border p-2 rounded-lg">
                {t.status === 'ABIERTO' && <option>EN PROCESO</option>}
                {t.status === 'EN PROCESO' && <option>RESUELTO</option>}
                {t.status === 'RESUELTO' && <option>CERRADO</option>}
              </select>

              <select name="prioridad" defaultValue={t.priority}
                className="border p-2 rounded-lg ml-2">
                {['BAJA', 'MEDIA', 'ALTA'].map(p =>
                  <option key={p}>{p}</option>
                )}
              </select>

              {t.status === 'EN PROCESO' && (
                <textarea name="resolucion" required minLength={5}
                  maxLength={5000} placeholder="Describe la solución"
                  className="border rounded-lg p-2 w-full" />
              )}

              <button disabled={ocupado}
                className="bg-sky-600 text-white px-4 py-2 rounded-lg">
                Guardar cambios
              </button>
            </form>
          )}
        </article>
      ))}
    </section>
  );
};
