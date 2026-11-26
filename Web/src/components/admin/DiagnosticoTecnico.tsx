import React, { useEffect, useState } from 'react';
import { Server, Database, RefreshCw } from 'lucide-react';

interface Diagnostico {
  backend: {
    conectado: boolean;
    uptime: number;
    versionNode: string;
  };
  supabase: {
    conectado: boolean;
    latencia: number;
  };
  fecha: string;
}

export const DiagnosticoTecnico: React.FC = () => {

  const [datos, setDatos] = useState<Diagnostico | null>(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function cargar() {
    setCargando(true);
    setError('');
    setDatos(null);

    try {
      const respuesta = await fetch(
        '/api/auth/admin/diagnostico',
        {
          credentials: 'include',
          cache: 'no-store'
        }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok || !resultado.success) {
        throw new Error(
          resultado.error || 'Diagnostico no disponible'
        );
      }

      setDatos(resultado);

    } catch (e: any) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void cargar();
  }, []);

  return (
    <section className="bg-white border rounded-2xl p-6 space-y-5">

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">
          Diagnóstico de infraestructura
        </h2>

        <button
          disabled={cargando}
          onClick={cargar}
          className="bg-sky-600 text-white px-4 py-2 rounded-lg"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {cargando && <p>Consultando servicios...</p>}

      {error && <p className="text-red-600">{error}</p>}

      {datos && (
        <>
          <div className="grid md:grid-cols-2 gap-4">

            <article className="border rounded-xl p-5">
              <Server className="text-sky-600 mb-3" />
              <h3 className="font-bold">Backend IINICIA</h3>
              <p className="text-green-600">Operativo</p>
              <p>Node.js {datos.backend.versionNode}</p>
              <p>
                Tiempo activo: {
                  Math.floor(datos.backend.uptime / 60)
                } minutos
              </p>
            </article>

            <article className="border rounded-xl p-5">
              <Database className="text-sky-600 mb-3" />
              <h3 className="font-bold">Supabase</h3>

              <p className={
                datos.supabase.conectado
                  ? 'text-green-600'
                  : 'text-red-600'
              }>
                {datos.supabase.conectado
                  ? 'Conectado'
                  : 'No disponible'}
              </p>

              <p>
                Tiempo de consulta: {
                  datos.supabase.latencia
                } ms
              </p>
            </article>

          </div>

          <p className="text-sm text-slate-500">
            Última consulta: {
              new Date(datos.fecha).toLocaleString()
            }
          </p>
        </>
      )}

    </section>
  );
};
