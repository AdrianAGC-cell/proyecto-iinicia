import React, { useEffect, useState } from 'react';
import {
  Award,
  MessageSquare,
  RefreshCw,
  Loader2
} from 'lucide-react';

type Props = {
  courseId: number;
  assignmentId: number;
};

type Nota = {
  graderaw?: number | null;
  gradeformatted?: string;
  grademax?: number;
  percentageformatted?: string;
  feedback?: string;
  feedbackformat?: number;
  itemmodule?: string;
  iteminstance?: number;
  itemnumber?: number;
  gradeishidden?: boolean;
};

export const CalificacionMoodle: React.FC<Props> = ({
  courseId,
  assignmentId
}) => {

  const [nota, setNota] = useState<Nota | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actualizacion, setActualizacion] = useState(0);

  useEffect(() => {

    const controller = new AbortController();

    setLoading(true);
    setError('');
    setNota(null);

    const cargar = async () => {
      try {

        const respuesta = await fetch(
          `/api/auth/courses/${courseId}/grades`,
          {
            credentials: 'include',
            cache: 'no-store',
            signal: controller.signal
          }
        );

        const datos = await respuesta.json();

        if (
          !respuesta.ok ||
          !datos.success ||
          !Array.isArray(datos.usergrades)
        ) {
          throw new Error(
            'No se pudieron consultar las calificaciones'
          );
        }

        const registro = datos.usergrades
          .flatMap((u: any) => u.gradeitems || [])
          .find((g: Nota) =>
            g.itemmodule === 'assign' &&
            Number(g.iteminstance) === assignmentId &&
            Number(g.itemnumber) === 0 &&
            g.gradeishidden !== true
          );

        if (!controller.signal.aborted) {
          setNota(registro || null);
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

  }, [courseId, assignmentId, actualizacion]);

  const calificada =
    nota?.gradeishidden !== true &&
    typeof nota?.graderaw === 'number' &&
    Number.isFinite(nota.graderaw) &&
    nota.graderaw >= 0;

  const comentario = calificada && nota?.feedback
    ? nota.feedbackformat === 2
      ? nota.feedback
      : new DOMParser()
          .parseFromString(nota.feedback, 'text/html')
          .body.textContent || ''
    : '';

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">

      <div className="flex items-center justify-between">

        <h4 className="font-bold text-slate-900 flex items-center gap-2">
          <Award className="w-5 h-5 text-[#22abe2]" />
          Calificación de la actividad
        </h4>

        <button
          type="button"
          title="Actualizar calificación"
          aria-label="Actualizar calificación"
          disabled={loading}
          onClick={() => setActualizacion(v => v + 1)}
          className="text-[#148ebf] p-2 rounded-lg hover:bg-slate-200"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>

      </div>

      {loading && (
        <p className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Consultando calificación...
        </p>
      )}

      {!loading && error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {!loading && !error && !calificada && (
        <p className="text-sm font-semibold text-amber-700">
          Sin calificación publicada
        </p>
      )}

      {!loading && !error && calificada && nota && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">

          <p className="text-xs text-slate-500">
            Calificación obtenida
          </p>

          <div className="flex items-baseline gap-2 mt-1">

            <span className="text-3xl font-black text-[#148ebf]">
              {nota.gradeformatted ?? nota.graderaw}
            </span>

            {nota.grademax != null && (
              <span className="text-sm text-slate-500">
                / {nota.grademax} puntos
              </span>
            )}

          </div>

          {nota.percentageformatted && (
            <p className="text-sm text-slate-600 mt-2">
              Porcentaje: {nota.percentageformatted}
            </p>
          )}

        </div>
      )}

      {!loading && !error && calificada && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">

          <h5 className="flex items-center gap-2 font-bold text-sm text-slate-900">
            <MessageSquare className="w-4 h-4 text-[#22abe2]" />
            Retroalimentación del profesor
          </h5>

          <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">
            {comentario.trim() || 'Sin comentarios publicados.'}
          </p>

        </div>
      )}

    </div>
  );
};
