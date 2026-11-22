
import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  MessageSquare,
  Video,
  Award,
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MOCK_STUDENT_COURSES } from '../data/mockData';
import { SafeImage } from '../components/common/SafeImage';

type MoodleCourse = {
  id: number;
  nombre: string;
  nombreCorto: string;
  idCategoria: number;
  visible: number;
  resumen: string;
};

type MoodleSection = {
  id: number;
  nombre: string;
  resumen: string;
  visible: number;
  actividades: {
    id: number;
    nombre: string;
    tipo: string;
    url?: string;
    visible: number;
    descripcion?: string;
  }[];
};

type MoodleModule = {
  title: string;
  description: string;
  type: string;
  icon: React.ReactNode;
  completed: boolean;
};

export const MoodlePreview: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const targetCourseId = (location.state as any)?.courseId;

  const [moodleCourses, setMoodleCourses] = useState<MoodleCourse[]>([]);
  const [moodleLoading, setMoodleLoading] = useState(true);
  const [moodleError, setMoodleError] = useState('');
  const [moodleSections, setMoodleSections] = useState<MoodleSection[]>([]);
  const [contentsLoading, setContentsLoading] = useState(true);
  const [contentsError, setContentsError] = useState('');

  useEffect(() => {
    let activo = true;

    const cargarCursos = async () => {
      try {
        const response = await fetch('/api/moodle/courses');
        const data = await response.json();

        if (!response.ok || !data.conectado) {
          throw new Error(
            data.error || 'No se pudieron cargar los cursos de Moodle.'
          );
        }

        if (activo) {
          setMoodleCourses(data.cursos || []);
          setMoodleError('');
        }
      } catch (error) {
        if (activo) {
          setMoodleError(
            error instanceof Error
              ? error.message
              : 'Error de conexión con Moodle.'
          );
        }
      } finally {
        if (activo) {
          setMoodleLoading(false);
        }
      }
    };

    cargarCursos();

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    let activo = true;

    const cargarContenidos = async () => {
      try {
        const courseId = Number(targetCourseId) || 2;
        const response = await fetch(
          `/api/moodle/courses/${courseId}/contents`
        );
        const data = await response.json();

        if (!response.ok || !data.conectado) {
          throw new Error(data.error || 'No se pudo cargar el contenido.');
        }

        if (activo) {
          setMoodleSections(data.secciones || []);
          setContentsError('');
        }
      } catch (error) {
        if (activo) {
          setContentsError(
            error instanceof Error
              ? error.message
              : 'Error al consultar el contenido de Moodle.'
          );
        }
      } finally {
        if (activo) setContentsLoading(false);
      }
    };

    cargarContenidos();

    return () => {
      activo = false;
    };
  }, [targetCourseId]);

  const currentCourse =
    MOCK_STUDENT_COURSES.find(
      c => String(c.moodleCourseId) === String(targetCourseId)
    ) || MOCK_STUDENT_COURSES[0];

  const cursoMoodle =
    moodleCourses.find(c => c.id === Number(targetCourseId)) ||
    moodleCourses[0];

  const nombreCurso =
    cursoMoodle?.nombre || currentCourse?.name || 'Curso de Moodle';

  const codigoCurso =
    cursoMoodle?.nombreCorto || currentCourse?.code || 'MOODLE';

  const resumenCurso = cursoMoodle?.resumen
    ? cursoMoodle.resumen.replace(/<[^>]*>/g, '').trim()
    : 'Consulta aquí la información de tu curso.';

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-600"
          >
            <ArrowLeft size={18} />
            Volver al inicio
          </Link>

          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <ShieldCheck size={18} className="text-green-600" />
            Iinicia Prueba
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-600">
            Plataforma de aprendizaje
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Mis cursos
          </h1>

          <p className="mt-2 text-slate-600">
            Consulta la información de tus cursos y accede a tus recursos de
            aprendizaje.
          </p>
        </div>

        {moodleLoading && (
          <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
            Cargando cursos desde Moodle...
          </div>
        )}

        {moodleError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-semibold">
              No fue posible cargar los cursos de Moodle.
            </p>
            <p className="mt-1">{moodleError}</p>
            <p className="mt-2">
              Verifica que el backend esté ejecutándose en el puerto 3001 y que
              el proxy de Vite esté configurado.
            </p>
          </div>
        )}

        {!moodleLoading && !moodleError && moodleCourses.length === 0 && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            La conexión se realizó, pero Moodle no devolvió cursos disponibles.
          </div>
        )}

        {cursoMoodle && (
          <section className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                    {codigoCurso}
                  </span>

                  <h2 className="mt-4 text-2xl font-bold sm:text-3xl">
                    {nombreCurso}
                  </h2>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
                    {resumenCurso}
                  </p>
                </div>

                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <Award size={30} />
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">ID del curso Moodle</p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {cursoMoodle.id}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Categoría</p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {cursoMoodle.idCategoria}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Estado</p>
                <p className="mt-1 flex items-center gap-2 text-xl font-bold text-slate-900">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      cursoMoodle.visible ? 'bg-green-500' : 'bg-slate-400'
                    }`}
                  />
                  {cursoMoodle.visible ? 'Visible' : 'Oculto'}
                </p>
              </div>
            </div>
          </section>
        )}

        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Contenido del curso
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Secciones y actividades consultadas directamente desde Moodle.
              </p>
            </div>
          </div>

          {contentsLoading && (
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
              Cargando secciones y actividades desde Moodle...
            </div>
          )}

          {contentsError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              No fue posible cargar el contenido: {contentsError}
            </div>
          )}

          {!contentsLoading && !contentsError && moodleSections.length === 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Moodle no devolvió secciones para este curso.
            </div>
          )}

          <div className="space-y-4">
            {moodleSections.map((seccion) => (
              <div
                key={seccion.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white"
              >
                <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-slate-900">
                      {seccion.nombre || `Sección ${seccion.id}`}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {seccion.actividades.length} actividad(es)
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs ${
                    seccion.visible
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {seccion.visible ? 'Visible' : 'Oculta'}
                  </span>
                </div>

                {seccion.resumen && (
                  <div
                    className="border-b border-slate-100 p-4 text-sm text-slate-600"
                    dangerouslySetInnerHTML={{ __html: seccion.resumen }}
                  />
                )}

                {seccion.actividades.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {seccion.actividades.map((actividad) => (
                      <div
                        key={actividad.id}
                        className="flex items-center gap-3 p-4"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                          {actividad.tipo === 'forum' ? (
                            <MessageSquare size={20} />
                          ) : actividad.tipo === 'url' || actividad.tipo === 'page' ? (
                            <FileText size={20} />
                          ) : (
                            <CheckCircle2 size={20} />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-900">
                            {actividad.nombre}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {actividad.tipo}
                            {!actividad.visible ? ' · Oculta' : ''}
                          </p>
                        </div>

                        {actividad.url && (
                          <a
                            href={actividad.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                          >
                            Abrir
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="p-4 text-sm text-slate-500">
                    Esta sección todavía no tiene actividades.
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">
              Aviso sobre el contenido
            </p>
            <p className="mt-1 text-sm leading-6 text-amber-800">
              La información del curso se consulta desde Moodle. Los módulos
              mostrados arriba son una vista de ejemplo y todavía no representan
              las actividades reales de Moodle.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-slate-900">
                ¿Necesitas acceder a Moodle?
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Abre la plataforma para consultar el contenido completo del
                curso.
              </p>
            </div>

            <a
              href="http://localhost:8000"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Abrir Moodle
              <ExternalLink size={16} />
            </a>
          </div>
        </section>
      </main>
    </div>
  );
};

export default MoodlePreview;
