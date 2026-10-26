import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  ExternalLink, 
  BookOpen, 
  Clock, 
  Calendar, 
  Award, 
  CheckCircle2, 
  CreditCard, 
  FileText, 
  Layers, 
  ArrowRight,
  Library,
  Download,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SafeImage } from '../components/common/SafeImage';
import { courseService } from '../lib/courseService';
import { Course, MoodleTask } from '../types';

export const MiIinicia: React.FC = () => {
  const { user, triggerMoodleSSO } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'cursos' | 'entregas' | 'calificaciones' | 'tramites'>('cursos');
  const [idCardOpen, setIdCardOpen] = useState(false);
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [tasks, setTasks] = useState<MoodleTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [fetchedCourses, fetchedTasks] = await Promise.all([
        courseService.getCourses(),
        courseService.getTasks()
      ]);
      setCourses(fetchedCourses);
      setTasks(fetchedTasks);
      setLoading(false);
    };
    fetchData();
  }, []);

  const pendingTasks = tasks.filter(t => t.status === 'Pendiente');
  const completedTasks = tasks.filter(t => t.status !== 'Pendiente');

  // Calculate GPA
  const averageGrade = courses.length > 0 
    ? (courses.reduce((acc, c) => acc + (c.grade || 9.0), 0) / courses.length).toFixed(1)
    : '9.6';

  const handleOpenCourseInLMS = (courseId: string) => {
    navigate('/moodle-preview', { state: { courseId } });
  };

  return (
    <div className="space-y-8 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
      {/* Student Welcome Header Card */}
      <div className="bg-gradient-to-r from-[#05080f] via-[#09101d] to-[#05080f] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#22abe2]/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <SafeImage
              src={user?.avatar}
              alt={user?.name || 'Estudiante'}
              isAvatar={true}
              className="w-20 h-20 rounded-2xl object-cover ring-4 ring-[#22abe2]/30 shadow-md shrink-0"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#22abe2]/20 text-[#7dd3f1] border border-[#22abe2]/30">
                  Estudiante Regular • {user?.semester || 4}to Semestre
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Matrícula: {user?.matricula || 'IIN-2024-8842'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                {user?.name || 'Valeria Morales Santillán'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300">
                {user?.programName || 'Licenciatura en Inteligencia Artificial y Ciencia de Datos'}
              </p>
            </div>
          </div>

          {/* Quick SSO Action to Moodle */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => triggerMoodleSSO()}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#22abe2] hover:bg-[#1b9ad0] text-white font-bold text-xs shadow-lg shadow-[#22abe2]/20 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>Entrar a Mi Campus Virtual (Moodle)</span>
              <ExternalLink className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={() => setIdCardOpen(!idCardOpen)}
              className="w-full sm:w-auto px-4 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <CreditCard className="w-4 h-4 text-[#7dd3f1]" />
              <span>{idCardOpen ? 'Ocultar Credencial' : 'Credencial Digital'}</span>
            </button>
          </div>
        </div>

        {/* Academic KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          <div>
            <p className="text-[11px] text-slate-400 uppercase font-semibold">Promedio Ponderado</p>
            <p className="text-2xl font-black text-white">{averageGrade} / 10</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase font-semibold">Materias Cursadas</p>
            <p className="text-2xl font-black text-white">18 de 32</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase font-semibold">Tareas Pendientes</p>
            <p className="text-2xl font-black text-amber-400">{pendingTasks.length}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase font-semibold">Moodle SSO Sync</p>
            <p className="text-2xl font-black text-[#22abe2] flex items-center gap-1.5">
              <CheckCircle2 className="w-5 h-5 text-[#22abe2]" />
              <span>Activo</span>
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Digital Student ID Card Modal */}
      {idCardOpen && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl max-w-xl mx-auto animate-fadeIn relative overflow-hidden">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Credencial Oficial de Alumno</span>
            <span className="text-xs font-bold text-[#148ebf] bg-[#22abe2]/10 px-2 py-0.5 rounded">Vigencia: 2026-2027</span>
          </div>

          <div className="bg-[#05080f] p-6 rounded-2xl text-white flex flex-col sm:flex-row items-center gap-6 shadow-inner border border-slate-800">
            <SafeImage
              src={user?.avatar}
              alt={user?.name || 'Estudiante'}
              isAvatar={true}
              className="w-24 h-24 rounded-2xl object-cover ring-2 ring-[#22abe2]"
            />
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-base font-black">{user?.name}</h4>
              <p className="text-xs text-[#22abe2] font-mono">Matrícula: {user?.matricula || 'IIN-2024-8842'}</p>
              <p className="text-xs text-slate-300">{user?.programName}</p>
              <div className="pt-2 text-[10px] text-slate-400 flex items-center gap-1 justify-center sm:justify-start">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Código QR de Validación Institucional (SEP / RVOE)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('cursos')}
          className={`px-4 py-2.5 rounded-xl transition cursor-pointer ${
            activeTab === 'cursos'
              ? 'bg-[#22abe2] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Mis Cursos Autorizados ({courses.length})
        </button>
        <button
          onClick={() => setActiveTab('entregas')}
          className={`px-4 py-2.5 rounded-xl transition cursor-pointer ${
            activeTab === 'entregas'
              ? 'bg-[#22abe2] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Próximas Entregas ({pendingTasks.length})
        </button>
        <button
          onClick={() => setActiveTab('calificaciones')}
          className={`px-4 py-2.5 rounded-xl transition cursor-pointer ${
            activeTab === 'calificaciones'
              ? 'bg-[#22abe2] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Calificaciones y Avance
        </button>
        <button
          onClick={() => setActiveTab('tramites')}
          className={`px-4 py-2.5 rounded-xl transition cursor-pointer ${
            activeTab === 'tramites'
              ? 'bg-[#22abe2] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Servicios y Trámites
        </button>
      </div>

      {/* TAB CONTENT: CURSOS */}
      {activeTab === 'cursos' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900">
              Periodo Académico Actual: Otoño 2026
            </h2>
            <span className="text-xs text-slate-500 hidden sm:inline">
              Sincronizado con Moodle Web Services & Supabase
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-[#22abe2]/50 transition group"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-mono font-bold text-[#148ebf] bg-[#22abe2]/10 px-2.5 py-1 rounded-md">
                      {course.code}
                    </span>
                    <span className="text-slate-500 font-medium">
                      Moodle ID: #{course.moodleCourseId}
                    </span>
                  </div>

                  <h3 className="font-black text-base text-slate-900 leading-snug">
                    {course.name}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1">
                    Titular: <span className="font-semibold text-slate-800">{course.professor}</span>
                  </p>

                  {/* Progress bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600 font-medium">Progreso del curso:</span>
                      <span className="font-bold text-slate-900">{course.progress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-[#22abe2] rounded-full transition-all duration-500"
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-slate-500 block">Promedio parcial:</span>
                    <span className="font-black text-[#22abe2] text-sm">{course.grade} / 10</span>
                  </div>

                  <button
                    onClick={() => handleOpenCourseInLMS(course.id)}
                    className="px-4 py-2 rounded-xl bg-[#22abe2] hover:bg-[#1b9ad0] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span>Ir al aula virtual</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: ENTREGAS */}
      {activeTab === 'entregas' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-900">Todas las Actividades y Tareas en Moodle</h3>
            <span className="text-xs text-slate-500">{tasks.length} tareas totales</span>
          </div>

          <div className="space-y-3">
            {tasks.map((task) => {
              const matchedCourse = courses.find(c => c.id === task.courseId);
              return (
                <div
                  key={task.id}
                  className="p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#22abe2]">
                        {matchedCourse ? matchedCourse.code : 'ASIGNATURA'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                        task.status === 'Calificado' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : task.status === 'Entregado'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {task.status} {task.grade ? `(${task.grade})` : ''}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs sm:text-sm text-slate-900">{task.title}</h4>
                    
                    <div className="flex items-center gap-2 text-xs">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className={task.status === 'Pendiente' ? 'text-amber-700 font-semibold' : 'text-slate-500'}>
                        Fecha límite: {task.dueDate}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenCourseInLMS(task.courseId)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-[#22abe2] text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <span>{task.status === 'Pendiente' ? 'Entregar en Moodle' : 'Ver entrega'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: CALIFICACIONES */}
      {activeTab === 'calificaciones' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Kardex Académico Oficial</h3>
              <p className="text-xs text-slate-500">Registro histórico validado bajo normas de acreditación SEP / RVOE.</p>
            </div>
            <button
              onClick={() => alert('Generando boleta oficial firmada digitalmente con sello SEP/RVOE en PDF...')}
              className="px-4 py-2 rounded-xl bg-[#22abe2]/10 text-[#22abe2] text-xs font-bold hover:bg-[#22abe2]/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Boleta (PDF)</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Clave</th>
                  <th className="py-3 px-4">Asignatura</th>
                  <th className="py-3 px-4">Profesor</th>
                  <th className="py-3 px-4">Créditos</th>
                  <th className="py-3 px-4">Calificación</th>
                  <th className="py-3 px-4">Estatus</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">{c.code}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                    <td className="py-3 px-4 text-slate-600">{c.professor}</td>
                    <td className="py-3 px-4 text-slate-600">8 Créditos</td>
                    <td className="py-3 px-4 font-black text-[#22abe2]">{c.grade || 9.5}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#22abe2]/15 text-[#148ebf]">
                        Acreditado
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenCourseInLMS(c.id)}
                        className="text-[#22abe2] hover:underline font-bold"
                      >
                        Ver detalles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: TRAMITES */}
      {activeTab === 'tramites' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3 hover:border-[#22abe2]/50 transition">
            <FileText className="w-8 h-8 text-[#22abe2]" />
            <h4 className="font-bold text-slate-900 text-sm">Constancia de Estudios Oficial</h4>
            <p className="text-xs text-slate-500">Documento membretado con código QR para trámites de visa, empleo o beca.</p>
            <button
              onClick={() => alert('Constancia generada exitosamente en formato digital.')}
              className="w-full py-2 rounded-xl bg-[#22abe2]/10 text-[#22abe2] text-xs font-bold hover:bg-[#22abe2]/20 transition cursor-pointer"
            >
              Solicitar Constancia
            </button>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3 hover:border-[#22abe2]/50 transition">
            <Library className="w-8 h-8 text-[#22abe2]" />
            <h4 className="font-bold text-slate-900 text-sm">Biblioteca Virtual e Investigación</h4>
            <p className="text-xs text-slate-500">Acceso a más de 500,000 papers académicos, libros electrónicos y repositorios técnicos.</p>
            <button
              onClick={() => alert('Accediendo a la red de bibliotecas digitales asociadas a I²NICIA...')}
              className="w-full py-2 rounded-xl bg-[#22abe2]/10 text-[#22abe2] text-xs font-bold hover:bg-[#22abe2]/20 transition cursor-pointer"
            >
              Abrir Biblioteca Digital
            </button>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3 hover:border-[#22abe2]/50 transition">
            <CreditCard className="w-8 h-8 text-[#22abe2]" />
            <h4 className="font-bold text-slate-900 text-sm">Finanzas y Colegiaturas</h4>
            <p className="text-xs text-slate-500">Consulta de recibos fiscales CFDI, facturación en línea y pagos automatizados.</p>
            <button
              onClick={() => alert('Tu colegiatura se encuentra al corriente para este semestre.')}
              className="w-full py-2 rounded-xl bg-[#22abe2]/10 text-[#22abe2] text-xs font-bold hover:bg-[#22abe2]/20 transition cursor-pointer"
            >
              Ver Finanzas Escolares
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
