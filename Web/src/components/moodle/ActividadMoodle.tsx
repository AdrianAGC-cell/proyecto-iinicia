import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { TareaMoodle } from './TareaMoodle';
import type { Tarea } from './TareaMoodle';
import { ProfesorMoodle } from './ProfesorMoodle';
import { CalificacionMoodle } from './CalificacionMoodle';

type Props = {
  courseId: number;
  tarea: Tarea;
};

type Permisos = {
  puedeCalificar: boolean;
  puedeEntregar: boolean;
};

export const ActividadMoodle: React.FC<Props> = ({
  courseId,
  tarea
}) => {

  const [permisos, setPermisos] =
    useState<Permisos | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {

    const controller = new AbortController();

    setLoading(true);
    setPermisos(null);
    setError('');

    const cargar = async () => {
      try {

        const respuesta = await fetch(
          `/api/auth/courses/${courseId}/assignments/${tarea.id}/permissions`,
          {
            credentials: 'include',
            signal: controller.signal
          }
        );

        const datos = await respuesta.json();

        if (!respuesta.ok || !datos.success) {
          throw new Error(
            datos.error || 'No se pudieron consultar los permisos'
          );
        }

        if (!controller.signal.aborted) {
          setPermisos({
            puedeCalificar: datos.puedeCalificar === true,
            puedeEntregar: datos.puedeEntregar === true
          });
        }

      } catch (e) {

        if (!controller.signal.aborted) {
          setError(
            e instanceof Error
              ? e.message
              : 'Error consultando Moodle'
          );
        }

      } finally {

        if (!controller.signal.aborted) {
          setLoading(false);
        }

      }
    };

    void cargar();

    return () => controller.abort();

  }, [courseId, tarea.id]);

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-xs text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        Consultando permisos...
      </p>
    );
  }

  if (error || !permisos) {
    return (
      <p role="alert" className="text-sm text-red-600">
        {error || 'Permisos no disponibles'}
      </p>
    );
  }

  return (
    <div className="space-y-4">

      {permisos.puedeCalificar && (
        <ProfesorMoodle
          courseId={courseId}
          assignmentId={tarea.id}
        />
      )}

      {permisos.puedeEntregar && (
        <>
          <TareaMoodle
            courseId={courseId}
            tarea={tarea}
          />

          <CalificacionMoodle
            courseId={courseId}
            assignmentId={tarea.id}
          />
        </>
      )}

      {!permisos.puedeCalificar &&
       !permisos.puedeEntregar && (
        <p className="text-sm text-slate-500">
          No tienes permisos para entregar o calificar esta actividad.
        </p>
      )}

    </div>
  );
};
