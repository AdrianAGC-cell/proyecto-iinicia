import { useAuth } from '../context/AuthContext';
import { CrearAsignacion } from '../components/moodle/CrearAsignacion';
import React, { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, FileText, Loader2 } from 'lucide-react';

import { ActividadMoodle } from '../components/moodle/ActividadMoodle';
import type { Tarea } from '../components/moodle/TareaMoodle';

type Actividad = {
  id: number;
  nombre: string;
  tipo: string;
  descripcion?: string;
  contents?: Array<{
    filename: string;
    mimetype: string;
  }>;
};

type Seccion = {
  id: number;
  numero: number;
  nombre: string;
  actividades: Actividad[];
};

type Props = {
  courseId: number;
  courseName: string;
  onBack: () => void;
};

export const AulaVirtual: React.FC<Props> = ({
  courseId,
  courseName,
  onBack
}) => {
  const { user } = useAuth();
  const [revision, setRevision] = useState(0);

  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [errorTareas, setErrorTareas] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    const cargar = async () => {
      setLoading(true);
      setError('');
      setSecciones([]);
      setTareas([]);
      setErrorTareas('');

      try {
        const response = await fetch(
          `/api/auth/courses/${courseId}/contents`,
          {
            credentials: 'include',
            signal: controller.signal
          }
        );

        if (!response.ok) {
          throw new Error(
            response.status === 401
              ? 'Tu sesión de Moodle no está activa. Inicia sesión con tu cuenta de Moodle en Iinicia.'
              : response.status === 403
                ? 'No tienes acceso a este curso.'
                : 'No se pudieron cargar los contenidos.'
          );
        }

        const data = await response.json();

        if (!data.conectado || !Array.isArray(data.secciones)) {
          throw new Error('Respuesta inesperada del servidor.');
        }

        setSecciones(data.secciones);

        try {
          const respuestaTareas = await fetch(
            `/api/auth/courses/${courseId}/assignments`,
            {
              credentials: 'include',
              signal: controller.signal
            }
          );

          if (!respuestaTareas.ok) {
            throw new Error('No se pudieron consultar las tareas.');
          }

          const datosTareas = await respuestaTareas.json();

          if (!datosTareas.success || !Array.isArray(datosTareas.tareas)) {
            throw new Error('Respuesta de tareas inválida.');
          }

          setTareas(datosTareas.tareas);

        } catch (err) {
          if (!controller.signal.aborted) {
            setErrorTareas('No se pudieron cargar las entregas de Moodle.');
          }
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error ? err.message : 'Error al consultar Moodle.'
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    cargar();

    return () => controller.abort();
  }, [courseId, revision]);

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-bold text-[#148ebf]"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a mis cursos
      </button>

      <div className="bg-white rounded-3xl border border-slate-200 p-6">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-[#22abe2]" />
          {courseName}
        </h2>
        <p className="text-sm text-slate-500 mt-2">
          Aula virtual integrada con Moodle
        </p>
      </div>

      {user?.role === 'profesor' &&
        !loading && !error && secciones.length > 0 && (
          <CrearAsignacion
            key={courseId}
            courseId={courseId}
            secciones={secciones}
            onCreated={() => setRevision(n => n + 1)}
          />
      )}

      {loading && (
        <p className="flex items-center gap-2 text-slate-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          Cargando contenidos...
        </p>
      )}

      {error && (
        <div role="alert" className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && secciones.length === 0 && (
        <p>Este curso todavía no tiene contenidos visibles.</p>
      )}

      {errorTareas && (
        <div role="alert" className="bg-amber-50 text-amber-700 rounded-xl p-4 text-sm">
          {errorTareas}
        </div>
      )}

      {!loading && !error && secciones.map(seccion => (
        <section
          key={seccion.id}
          className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4"
        >
          <h3 className="font-bold text-lg text-slate-900">
            {seccion.nombre}
          </h3>

          {seccion.actividades.length === 0 && (
            <p className="text-sm text-slate-500">
              No hay actividades disponibles.
            </p>
          )}

          {seccion.actividades.map(actividad => {
            const tarea = tareas.find(
              t => t.moduloId === actividad.id
            );

            const tienePdf =
              actividad.tipo === 'resource' &&
              actividad.contents?.some(
                archivo =>
                  archivo.filename?.toLowerCase().endsWith('.pdf')
              );

            return (
              <div
                key={actividad.id}
                className="border border-slate-100 rounded-xl p-4 flex flex-col gap-3"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-[#22abe2]" />
                  <div>
                    <p className="font-semibold text-slate-900">
                      {actividad.nombre}
                    </p>
                    <p className="text-xs text-slate-500">
                      Tipo: {actividad.tipo}
                    </p>
                  </div>
                </div>

                {actividad.tipo === 'assign' && tarea && (
                  <ActividadMoodle
                    key={`${courseId}-${tarea.id}`}
                    courseId={courseId}
                    tarea={tarea}
                  />
                )}

                {tienePdf && (
                  <a
                    href={`/api/auth/courses/${courseId}/resources/${actividad.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-[#22abe2] text-white text-xs font-bold text-center"
                  >
                    Abrir PDF
                  </a>
                )}
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
};
