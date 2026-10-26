import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle2, 
  FileText, 
  MessageSquare, 
  Video, 
  Award, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  UploadCloud,
  X,
  Play,
  Send,
  ThumbsUp,
  PlusCircle,
  Terminal,
  Download,
  AlertCircle,
  HelpCircle,
  BookOpen,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SafeImage } from '../components/common/SafeImage';
import { courseService } from '../lib/courseService';
import { Course, MoodleTask, ForumThread, CourseResource } from '../types';
import { MOCK_STUDENT_COURSES } from '../data/mockData';

export const MoodlePreview: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // State with resilient initial values
  const [courses, setCourses] = useState<Course[]>(MOCK_STUDENT_COURSES);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('c-01');

  const [activeTab, setActiveTab] = useState<'contenidos' | 'tareas' | 'foros' | 'calificaciones' | 'participantes'>('contenidos');
  
  // Data for current course
  const [tasks, setTasks] = useState<MoodleTask[]>([]);
  const [forums, setForums] = useState<ForumThread[]>([]);
  const [resources, setResources] = useState<CourseResource[]>([]);

  // Modals state
  const [activeTaskForSubmission, setActiveTaskForSubmission] = useState<MoodleTask | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFileName, setSubmissionFileName] = useState('');
  const [submittingTask, setSubmittingTask] = useState(false);

  const [newThreadModalOpen, setNewThreadModalOpen] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadCategory, setNewThreadCategory] = useState<'General' | 'Dudas' | 'Debate' | 'Avisos'>('Dudas');
  const [newThreadContent, setNewThreadContent] = useState('');

  const [expandedThreadId, setExpandedThreadId] = useState<string | null>(null);
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});

  const [activeVideoModal, setActiveVideoModal] = useState<CourseResource | null>(null);
  const [activeDocModal, setActiveDocModal] = useState<CourseResource | null>(null);
  const [activeLabModal, setActiveLabModal] = useState<CourseResource | null>(null);
  const [labConsoleOutput, setLabConsoleOutput] = useState<string[]>([]);
  const [runningLab, setRunningLab] = useState(false);

  // Load courses
  useEffect(() => {
    const loadAll = async () => {
      const allCourses = await courseService.getCourses();
      setCourses(allCourses);

      const targetId = (location.state as any)?.courseId;
      if (targetId) {
        const found = allCourses.find(c => c.id === targetId || String(c.moodleCourseId) === String(targetId));
        if (found) setSelectedCourseId(found.id);
      } else if (allCourses.length > 0) {
        setSelectedCourseId(allCourses[0].id);
      }
    };
    loadAll();
  }, [location.state]);

  // Load course details whenever selectedCourseId changes
  useEffect(() => {
    const loadCourseData = async () => {
      const [cTasks, cForums, cResources] = await Promise.all([
        courseService.getTasks(selectedCourseId),
        courseService.getForums(selectedCourseId),
        courseService.getResources(selectedCourseId)
      ]);
      setTasks(cTasks);
      setForums(cForums);
      setResources(cResources);
    };
    loadCourseData();
  }, [selectedCourseId]);

  const currentCourse = courses.find(c => c.id === selectedCourseId) || courses[0] || MOCK_STUDENT_COURSES[0];

  // Handler: Submit a task
  const handleConfirmTaskSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTaskForSubmission) return;
    setSubmittingTask(true);

    try {
      const updatedTask = await courseService.submitTask(
        selectedCourseId,
        activeTaskForSubmission.id,
        {
          text: submissionText,
          fileName: submissionFileName || 'solucion_practica.pdf'
        }
      );

      // Update local task state
      setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
      // Refresh course list to get updated progress percentage
      const updatedCourses = await courseService.getCourses();
      setCourses(updatedCourses);

      setActiveTaskForSubmission(null);
      setSubmissionText('');
      setSubmissionFileName('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingTask(false);
    }
  };

  // Handler: Create Forum Thread
  const handleCreateForumThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThreadTitle.trim() || !newThreadContent.trim()) return;

    const created = await courseService.createThread(selectedCourseId, {
      title: newThreadTitle,
      category: newThreadCategory,
      content: newThreadContent,
      authorName: user?.name || 'Valeria Morales Santillán',
      authorEmail: user?.email || 'valeria.morales@iinicia.edu.mx',
      authorRole: user?.role || 'estudiante',
      authorAvatar: user?.avatar
    });

    setForums([created, ...forums]);
    setNewThreadModalOpen(false);
    setNewThreadTitle('');
    setNewThreadContent('');
    setExpandedThreadId(created.id);
  };

  // Handler: Post Reply to Forum Thread
  const handlePostReply = async (threadId: string) => {
    const text = replyTextMap[threadId];
    if (!text || !text.trim()) return;

    const reply = await courseService.addReply(selectedCourseId, threadId, {
      content: text,
      authorName: user?.name || 'Valeria Morales Santillán',
      authorEmail: user?.email || 'valeria.morales@iinicia.edu.mx',
      authorRole: user?.role || 'estudiante',
      authorAvatar: user?.avatar
    });

    setForums(prev => prev.map(f => {
      if (f.id === threadId) {
        return {
          ...f,
          views: f.views + 1,
          replies: [...f.replies, reply]
        };
      }
      return f;
    }));

    setReplyTextMap({ ...replyTextMap, [threadId]: '' });
  };

  // Handler: Like a reply
  const handleLikeReply = async (threadId: string, replyId: string) => {
    const newLikes = await courseService.toggleLikeReply(threadId, replyId);
    setForums(prev => prev.map(f => {
      if (f.id === threadId) {
        return {
          ...f,
          replies: f.replies.map(r => r.id === replyId ? { ...r, likes: newLikes } : r)
        };
      }
      return f;
    }));
  };

  // Handler: Run Virtual GPU Lab code
  const handleRunLabCode = () => {
    setRunningLab(true);
    setLabConsoleOutput(['Iniciando clúster de cómputo GPU NVIDIA Tesla T4...', 'Conectando con entorno PyTorch 2.4.0 + CUDA 12.2...']);
    setTimeout(() => {
      setLabConsoleOutput(prev => [
        ...prev,
        'Cargando dataset CIFAR-10 en VRAM (50,000 imágenes de entrenamiento)...',
        'Epoch 1/5 | Loss: 1.4820 | Acc: 47.3% | GradScaler: activo',
        'Epoch 2/5 | Loss: 1.0210 | Acc: 64.8% | LR: 0.003',
        'Epoch 3/5 | Loss: 0.7650 | Acc: 74.2% | Optimizador: AdamW',
        'Epoch 4/5 | Loss: 0.5420 | Acc: 81.6% | Dropout p=0.25',
        'Epoch 5/5 | Loss: 0.3890 | Acc: 87.4% | Validación superada (Umbral > 85%)',
        '✓ Modelo compilado y guardado en: /models/checkpoint_cifar10_best.pt',
        'Estado del proceso: EXITOSO (GPU Memory util: 2.4 GB / 16.0 GB)'
      ]);
      setRunningLab(false);
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-24">
      {/* 1. Moodle Live SSO Header */}
      <div className="bg-[#05080f] text-slate-300 text-xs py-2 px-4 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#22abe2] animate-pulse"></span>
          <span className="font-mono text-[#22abe2] font-bold">aula.iinicia.org</span>
          <span className="text-slate-400 hidden sm:inline">• Campus Virtual Oficial Moodle 4.x (Edwiser RemUI Homologado)</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-[11px] hidden md:inline">
            SSO OIDC Activo: <strong className="text-white">{user?.email || 'estudiante@iinicia.edu.mx'}</strong>
          </span>
          <Link
            to="/mi-iinicia"
            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#22abe2] hover:bg-[#1b9ad0] text-white font-bold text-xs transition shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a Mi IINICIA</span>
          </Link>
        </div>
      </div>

      {/* 2. Top Bar & Course Selector */}
      <header className="bg-white border-b border-slate-200 shadow-xs px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/logo-iinicia.png"
                alt="I²NICIA"
                className="h-10 w-auto object-contain"
              />
              <div>
                <span className="text-xs font-black text-slate-900 block leading-tight">
                  CAMPUS VIRTUAL
                </span>
                <span className="text-[10px] text-[#22abe2] font-bold tracking-wider uppercase block">
                  I²NICIA LMS
                </span>
              </div>
            </Link>

            <span className="hidden sm:inline-block h-6 w-px bg-slate-200 mx-2"></span>

            {/* Course Switcher Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 md:pb-0">
              {courses.map(course => (
                <button
                  key={course.id}
                  onClick={() => setSelectedCourseId(course.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    selectedCourseId === course.id
                      ? 'bg-[#22abe2] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span className="font-mono mr-1">{course.code}</span>
                  <span className="hidden lg:inline">{course.name.split(' ')[0]}...</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
            <div className="text-right hidden sm:block">
              <p className="font-bold text-slate-900">{user?.name || 'Valeria Morales Santillán'}</p>
              <p className="text-[10px] text-slate-500 font-mono">Matrícula: {user?.matricula || 'IIN-2024-8842'}</p>
            </div>
            <SafeImage
              src={user?.avatar}
              alt={user?.name || 'Estudiante'}
              isAvatar={true}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-[#22abe2]"
            />
          </div>
        </div>
      </header>

      {/* 3. Course Banner */}
      {currentCourse && (
        <div className="bg-gradient-to-r from-[#05080f] via-[#09101d] to-[#05080f] text-white py-8 px-4 sm:px-8 border-b border-slate-800 shadow-md">
          <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 font-semibold">
              <span>Mis Asignaturas</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#22abe2]" />
              <span>Semestre 2026-II</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#22abe2]" />
              <span className="text-[#22abe2] font-mono font-bold bg-[#22abe2]/15 px-2 py-0.5 rounded">
                {currentCourse.code}
              </span>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1 max-w-3xl">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {currentCourse.name}
                </h1>
                <p className="text-xs text-slate-300 flex items-center gap-2">
                  <span>Catedrático: <strong className="text-white">{currentCourse.professor}</strong></span>
                  <span>•</span>
                  <span>Moodle ID #{currentCourse.moodleCourseId}</span>
                  <span>•</span>
                  <span className="text-[#7dd3f1] font-semibold">{tasks.length} Tareas oficiales</span>
                </p>
              </div>

              {/* Progress Summary Card */}
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 w-full md:w-64 space-y-2 shrink-0">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-300 uppercase text-[10px]">Avance del Curso</span>
                  <span className="text-[#22abe2] font-black">{currentCourse.progress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden">
                  <div
                    className="h-full bg-[#22abe2] rounded-full transition-all duration-500"
                    style={{ width: `${currentCourse.progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-300">
                  <span>{tasks.filter(t => t.status !== 'Pendiente').length} de {tasks.length} tareas</span>
                  <span className="text-emerald-400 font-semibold">Kardex: 9.6 / 10</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Classroom Navigation Bar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 sticky top-11 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center gap-2 sm:gap-4 overflow-x-auto py-2">
          <button
            onClick={() => setActiveTab('contenidos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'contenidos'
                ? 'bg-[#22abe2] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Contenidos & Unidades</span>
          </button>

          <button
            onClick={() => setActiveTab('tareas')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'tareas'
                ? 'bg-[#22abe2] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Tareas & Entregas</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-mono">
              {tasks.filter(t => t.status === 'Pendiente').length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('foros')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'foros'
                ? 'bg-[#22abe2] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Foros de Discusión</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-800 font-mono">
              {forums.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('calificaciones')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'calificaciones'
                ? 'bg-[#22abe2] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Calificaciones & Rúbricas</span>
          </button>

          <button
            onClick={() => setActiveTab('participantes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'participantes'
                ? 'bg-[#22abe2] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Claustro & Cohorte</span>
          </button>
        </div>
      </div>

      {/* 5. Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-8">
        {/* TAB 1: CONTENIDOS Y UNIDADES */}
        {activeTab === 'contenidos' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-6">
              {/* Unit 0: Bloque General */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#148ebf] bg-[#22abe2]/15 px-2 py-0.5 rounded">
                      Bloque General
                    </span>
                    <h3 className="text-base font-black text-slate-900 mt-1">
                      Presentación, Normas y Recursos del Curso
                    </h3>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 p-2">
                  {resources.filter(r => r.unit === 'Bloque General').map(res => (
                    <div
                      key={res.id}
                      onClick={() => {
                        if (res.type === 'pdf') setActiveDocModal(res);
                        else if (res.type === 'video') setActiveVideoModal(res);
                        else if (res.type === 'lab') setActiveLabModal(res);
                      }}
                      className="p-4 flex items-center justify-between hover:bg-slate-50 rounded-2xl transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-[#22abe2]/10 text-[#22abe2] flex items-center justify-center shrink-0 group-hover:bg-[#22abe2] group-hover:text-white transition">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#22abe2] transition">
                            {res.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {res.description}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#22abe2] group-hover:translate-x-1 transition flex items-center gap-1">
                        <span>Ver Documento</span>
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  ))}

                  {/* Direct access to general forum */}
                  <div
                    onClick={() => setActiveTab('foros')}
                    className="p-4 flex items-center justify-between hover:bg-slate-50 rounded-2xl transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0 group-hover:bg-violet-600 group-hover:text-white transition">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-violet-600 transition">
                          Foro Oficial de Dudas con el Claustro y Compañeros
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {forums.length} temas abiertos con respuestas del profesor.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-violet-600 group-hover:translate-x-1 transition flex items-center gap-1">
                      <span>Ir al Foro</span>
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Unit 1 */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      Unidad 1
                    </span>
                    <h3 className="text-base font-black text-slate-900 mt-1">
                      Fundamentos y Arquitecturas Centrales
                    </h3>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 p-2">
                  {resources.filter(r => r.unit === 'Unidad 1').map(res => (
                    <div
                      key={res.id}
                      onClick={() => {
                        if (res.type === 'video') setActiveVideoModal(res);
                        else if (res.type === 'pdf') setActiveDocModal(res);
                      }}
                      className="p-4 flex items-center justify-between hover:bg-slate-50 rounded-2xl transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-[#22abe2]/10 text-[#22abe2] flex items-center justify-center shrink-0 group-hover:bg-[#22abe2] group-hover:text-white transition">
                          {res.type === 'video' ? <Video className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#22abe2] transition">
                            {res.title}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                            {res.duration && <span>Duración: {res.duration}</span>}
                            {res.date && <span>• Fecha: {res.date}</span>}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#22abe2] flex items-center gap-1">
                        <span>{res.type === 'video' ? 'Reproducir' : 'Leer'}</span>
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  ))}

                  {/* Tasks in this unit */}
                  {tasks.slice(0, 2).map(task => (
                    <div
                      key={task.id}
                      onClick={() => {
                        setActiveTab('tareas');
                        setActiveTaskForSubmission(task);
                      }}
                      className="p-4 flex items-center justify-between hover:bg-slate-50 rounded-2xl transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition">
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-amber-700 transition">
                            {task.title}
                          </h4>
                          <p className="text-[11px] text-amber-600 font-semibold mt-0.5">
                            Vence: {task.dueDate}
                          </p>
                        </div>
                      </div>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        task.status === 'Calificado' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : task.status === 'Entregado'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {task.status} {task.grade ? `(${task.grade})` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Unit 2: Interactive Lab */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-violet-800 bg-violet-100 px-2 py-0.5 rounded">
                      Unidad 2
                    </span>
                    <h3 className="text-base font-black text-slate-900 mt-1">
                      Laboratorio Virtual y Prácticas Computacionales
                    </h3>
                  </div>
                </div>

                <div className="p-4">
                  <div
                    onClick={() => setActiveLabModal({
                      id: 'R-LAB',
                      courseId: selectedCourseId,
                      unit: 'Unidad 2',
                      title: 'Simulador de Código PyTorch en GPU Tesla T4 (Cloud Sandbox)',
                      type: 'lab',
                      description: 'Ejecuta modelos y observa las curvas de loss y accuracy en vivo.'
                    })}
                    className="p-5 bg-gradient-to-r from-slate-900 to-[#05080f] rounded-2xl text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:ring-2 hover:ring-[#22abe2] transition shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-[#22abe2]/20 border border-[#22abe2]/40 rounded-xl text-[#22abe2]">
                        <Terminal className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-[#22abe2] uppercase font-bold tracking-wider">
                          Consola Activa en la Nube
                        </span>
                        <h4 className="text-sm sm:text-base font-bold">
                          Laboratorio Interactivo PyTorch / GPU T4
                        </h4>
                        <p className="text-xs text-slate-300">
                          Prueba algoritmos de optimización y convolución con aceleración por hardware.
                        </p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-[#22abe2] hover:bg-[#1b9ad0] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0">
                      <Play className="w-3.5 h-3.5" />
                      <span>Abrir Simulador GPU</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar LMS */}
            <div className="space-y-6">
              {/* Teacher Info */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Docente Titular
                </span>
                <div className="flex items-center gap-3">
                  <SafeImage
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
                    alt={currentCourse.professor}
                    isAvatar={true}
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-[#22abe2]/30 shadow-xs"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900">{currentCourse.professor}</p>
                    <p className="text-[10px] text-slate-500">Claustro Académico IINICIA</p>
                    <span className="inline-block mt-1 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                      En Línea
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('foros');
                    setNewThreadModalOpen(true);
                    setNewThreadCategory('Dudas');
                    setNewThreadTitle(`Pregunta para el ${currentCourse.professor}: `);
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#22abe2]/10 hover:bg-[#22abe2]/20 text-[#22abe2] font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Preguntar en el Foro del Curso</span>
                </button>
              </div>

              {/* Tasks Quick Widget */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Tareas Pendientes
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    {tasks.filter(t => t.status === 'Pendiente').length}
                  </span>
                </div>
                <div className="space-y-2">
                  {tasks.filter(t => t.status === 'Pendiente').map(t => (
                    <div
                      key={t.id}
                      onClick={() => {
                        setActiveTab('tareas');
                        setActiveTaskForSubmission(t);
                      }}
                      className="p-3 bg-slate-50 hover:bg-[#22abe2]/10 rounded-2xl border border-slate-200/80 transition cursor-pointer text-xs"
                    >
                      <p className="font-bold text-slate-900 line-clamp-1">{t.title}</p>
                      <p className="text-[11px] text-amber-600 mt-0.5 font-medium">Vence: {t.dueDate}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Single Sign-On Badge */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 space-y-2 text-xs text-emerald-900">
                <div className="flex items-center gap-2 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Sesión Segura OIDC Activa</span>
                </div>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  Has accedido con tu cuenta única IINICIA. Tu sesión académica se sincroniza automáticamente con la app de Android.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TAREAS Y ENTREGAS */}
        {activeTab === 'tareas' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Tareas y Evaluaciones Oficiales
                </h2>
                <p className="text-xs text-slate-500">
                  Entrega tus evidencias de laboratorio y proyectos. Los dictámenes y calificaciones quedan registrados en Moodle.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 font-bold">
                  {tasks.filter(t => t.status === 'Calificado').length} Calificadas
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-800 font-bold">
                  {tasks.filter(t => t.status === 'Pendiente').length} Pendientes
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {tasks.map(task => (
                <div
                  key={task.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 hover:border-[#22abe2]/50 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-2xl ${
                        task.status === 'Calificado' 
                          ? 'bg-emerald-100 text-emerald-600' 
                          : task.status === 'Entregado'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-amber-100 text-amber-600'
                      }`}>
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                          Tarea ID #{task.id}
                        </span>
                        <h3 className="text-base font-bold text-slate-900">
                          {task.title}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        task.status === 'Calificado' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : task.status === 'Entregado'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {task.status}
                      </span>
                      {task.grade && (
                        <span className="text-sm font-black text-emerald-600 font-mono">
                          {task.grade}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {task.description}
                  </p>

                  {/* Rubric section if available */}
                  {task.rubric && (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                      <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                        Rúbrica de Evaluación
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {task.rubric.map((r, rIdx) => (
                          <div key={rIdx} className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs">
                            <p className="font-semibold text-slate-800">{r.criteria}</p>
                            <p className="text-[11px] font-black text-[#22abe2]">{r.points} pts</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Submission Info / Feedback */}
                  {task.status !== 'Pendiente' && (
                    <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-emerald-900 font-bold">
                        <span>Archivo entregado: {task.fileName || 'solucion.pdf'}</span>
                        <span className="text-[11px] text-emerald-700">{task.submissionDate}</span>
                      </div>
                      {task.submissionText && (
                        <p className="text-slate-700 italic bg-white p-3 rounded-xl border border-emerald-100">
                          "{task.submissionText}"
                        </p>
                      )}
                      {task.feedback && (
                        <div className="pt-2 border-t border-emerald-200 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-emerald-900">Retroalimentación del Docente:</span>
                            <p className="text-emerald-800 mt-0.5">{task.feedback}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-2">
                    {task.status === 'Pendiente' ? (
                      <button
                        onClick={() => setActiveTaskForSubmission(task)}
                        className="px-5 py-2.5 rounded-xl bg-[#22abe2] hover:bg-[#1b9ad0] text-white font-bold text-xs transition shadow-md flex items-center gap-1.5 cursor-pointer"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>Subir Solución / Entregar Tarea</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setActiveTaskForSubmission(task)}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Ver o Modificar Entrega</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: FOROS DE DISCUSIÓN */}
        {activeTab === 'foros' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Foro Académico de Discusión
                </h2>
                <p className="text-xs text-slate-500">
                  Interactúa con el claustro docente e intercambia dudas y soluciones con tus compañeros de clase.
                </p>
              </div>
              <button
                onClick={() => setNewThreadModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-[#22abe2] hover:bg-[#1b9ad0] text-white font-bold text-xs transition shadow-md flex items-center gap-2 cursor-pointer shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Nuevo Tema de Debate</span>
              </button>
            </div>

            <div className="space-y-4">
              {forums.map(thread => {
                const isExpanded = expandedThreadId === thread.id;
                return (
                  <div
                    key={thread.id}
                    className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden transition"
                  >
                    <div className="p-6 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <SafeImage
                            src={thread.authorAvatar}
                            alt={thread.authorName}
                            isAvatar={true}
                            className="w-10 h-10 rounded-2xl object-cover ring-2 ring-[#22abe2]/30"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                {thread.authorName}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                thread.authorRole === 'profesor'
                                  ? 'bg-violet-100 text-violet-800'
                                  : 'bg-[#22abe2]/15 text-[#148ebf]'
                              }`}>
                                {thread.authorRole === 'profesor' ? 'Docente Titular' : 'Estudiante'}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400">{thread.createdAt}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                            {thread.category}
                          </span>
                          {thread.pinned && (
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                              Fijado
                            </span>
                          )}
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-slate-900">
                        {thread.title}
                      </h3>

                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                        {thread.content}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                        <span>{thread.views} lecturas • {thread.replies.length} respuestas</span>
                        <button
                          onClick={() => setExpandedThreadId(isExpanded ? null : thread.id)}
                          className="font-bold text-[#22abe2] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>{isExpanded ? 'Ocultar Respuestas' : 'Ver Respuestas & Comentar'}</span>
                          <ChevronRight className={`w-3.5 h-3.5 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Replies Drawer */}
                    {isExpanded && (
                      <div className="bg-slate-50 p-6 border-t border-slate-200 space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Respuestas ({thread.replies.length})
                        </h4>

                        <div className="space-y-3">
                          {thread.replies.map(reply => (
                            <div
                              key={reply.id}
                              className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <SafeImage
                                    src={reply.authorAvatar}
                                    alt={reply.authorName}
                                    isAvatar={true}
                                    className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-300"
                                  />
                                  <div>
                                    <span className="font-bold text-xs text-slate-900">{reply.authorName}</span>
                                    <span className="text-[10px] text-slate-400 ml-2">{reply.createdAt}</span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleLikeReply(thread.id, reply.id)}
                                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-[#22abe2] transition px-2 py-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                                >
                                  <ThumbsUp className="w-3.5 h-3.5" />
                                  <span className="font-bold text-[11px]">{reply.likes}</span>
                                </button>
                              </div>
                              <p className="text-xs text-slate-700 pl-9 leading-relaxed">
                                {reply.content}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Reply Form */}
                        <div className="pt-2 flex gap-3">
                          <input
                            type="text"
                            placeholder="Escribe una respuesta académica..."
                            value={replyTextMap[thread.id] || ''}
                            onChange={(e) => setReplyTextMap({ ...replyTextMap, [thread.id]: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handlePostReply(thread.id);
                            }}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#22abe2]"
                          />
                          <button
                            onClick={() => handlePostReply(thread.id)}
                            className="px-4 py-2.5 rounded-xl bg-[#22abe2] hover:bg-[#1b9ad0] text-white font-bold text-xs transition shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Responder</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: CALIFICACIONES Y KARDEX */}
        {activeTab === 'calificaciones' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Libro de Calificaciones Oficial (Moodle Gradebook)
                </h2>
                <p className="text-xs text-slate-500">
                  Desglose ponderado de tareas, foros y proyectos evaluados según los criterios RVOE SEP.
                </p>
              </div>
              <div className="p-3 bg-[#22abe2]/10 border border-[#22abe2]/20 rounded-2xl flex items-center gap-3">
                <Award className="w-6 h-6 text-[#22abe2]" />
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Promedio Parcial</span>
                  <p className="text-xl font-black text-slate-900">9.6 / 10</p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Elemento de Calificación</th>
                    <th className="py-3 px-4">Ponderación</th>
                    <th className="py-3 px-4">Rango</th>
                    <th className="py-3 px-4">Calificación</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4">Retroalimentación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tasks.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{t.title}</td>
                      <td className="py-3.5 px-4 font-mono">25%</td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">0 - 100</td>
                      <td className="py-3.5 px-4 font-bold text-[#22abe2] font-mono">
                        {t.grade || (t.status === 'Entregado' ? 'En revisión' : '-')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.status === 'Calificado' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : t.status === 'Entregado'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                        {t.feedback || 'Sin observaciones'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: PARTICIPANTES */}
        {activeTab === 'participantes' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-lg font-black text-slate-900">
              Cohorte y Claustro Académico ({currentCourse.name})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl border border-[#22abe2]/40 bg-[#22abe2]/5 flex items-center gap-3">
                <SafeImage
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
                  alt={currentCourse.professor}
                  isAvatar={true}
                  className="w-12 h-12 rounded-2xl object-cover ring-2 ring-[#22abe2]"
                />
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-violet-100 text-violet-800">Profesor Titular</span>
                  <p className="font-bold text-slate-900 text-xs sm:text-sm mt-1">{currentCourse.professor}</p>
                  <p className="text-[11px] text-slate-500">mendez.alejandro@iinicia.edu.mx</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 bg-white flex items-center gap-3">
                <SafeImage
                  src={user?.avatar}
                  alt={user?.name || 'Estudiante'}
                  isAvatar={true}
                  className="w-12 h-12 rounded-2xl object-cover ring-2 ring-emerald-500"
                />
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Tú (Estudiante)</span>
                  <p className="font-bold text-slate-900 text-xs sm:text-sm mt-1">{user?.name || 'Valeria Morales Santillán'}</p>
                  <p className="text-[11px] text-slate-500">{user?.email}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 bg-white flex items-center gap-3">
                <SafeImage
                  src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80"
                  alt="Carlos Mendoza"
                  isAvatar={true}
                  className="w-12 h-12 rounded-2xl object-cover ring-1 ring-slate-200"
                />
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">Estudiante</span>
                  <p className="font-bold text-slate-900 text-xs sm:text-sm mt-1">Carlos Eduardo Mendoza</p>
                  <p className="text-[11px] text-slate-500">carlos.mendoza@outlook.com</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: SUBMIT TASK */}
      {activeTaskForSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden transform transition-all">
            <div className="bg-[#05080f] p-6 text-white flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#22abe2]/20 border border-[#22abe2]/40 rounded-xl text-[#22abe2]">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#22abe2]">
                    Entrega de Actividad Moodle LMS
                  </span>
                  <h3 className="text-base font-bold">{activeTaskForSubmission.title}</h3>
                </div>
              </div>
              <button
                onClick={() => setActiveTaskForSubmission(null)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmTaskSubmission} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-slate-700 space-y-1">
                <p className="font-bold text-slate-900">Instrucciones:</p>
                <p>{activeTaskForSubmission.description}</p>
                <p className="text-amber-700 font-semibold pt-1">Fecha límite: {activeTaskForSubmission.dueDate}</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase text-[11px] mb-1">
                  Archivo de Evidencia (PDF, ZIP, Jupyter Notebook) *
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center hover:border-[#22abe2] transition bg-slate-50/50">
                  <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">Arrastra tu archivo aquí o haz clic para simular carga</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Tamaño máximo: 50 MB</p>
                  <input
                    type="text"
                    placeholder="ej. laboratorio_cifar10_valeria.ipynb"
                    value={submissionFileName}
                    onChange={(e) => setSubmissionFileName(e.target.value)}
                    className="mt-3 w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase text-[11px] mb-1">
                  Notas de entrega o enlace a repositorio (GitHub / GitLab / Colab)
                </label>
                <textarea
                  rows={3}
                  placeholder="Detalla tu metodología, hiperparámetros o enlace a repositorio..."
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#22abe2]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTaskForSubmission(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingTask}
                  className="px-5 py-2.5 rounded-xl bg-[#22abe2] hover:bg-[#1b9ad0] text-white font-bold transition shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{submittingTask ? 'Guardando en Moodle...' : 'Confirmar y Enviar Tarea'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: NEW FORUM THREAD */}
      {newThreadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="bg-[#05080f] p-6 text-white flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#22abe2]/20 border border-[#22abe2]/40 rounded-xl text-[#22abe2]">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#22abe2]">
                    Foro de {currentCourse.name}
                  </span>
                  <h3 className="text-base font-bold">Publicar Nuevo Tema de Debate</h3>
                </div>
              </div>
              <button
                onClick={() => setNewThreadModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateForumThread} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase text-[11px] mb-1">
                  Categoría del Tema
                </label>
                <select
                  value={newThreadCategory}
                  onChange={(e) => setNewThreadCategory(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Dudas">Dudas Técnicas de Laboratorio</option>
                  <option value="Debate">Debate Teórico y Estado del Arte</option>
                  <option value="General">General / Comunidad</option>
                  <option value="Avisos">Avisos del Claustro</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase text-[11px] mb-1">
                  Título de la Pregunta o Debate *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Duda con backward pass en redes neuronales convolucionales"
                  value={newThreadTitle}
                  onChange={(e) => setNewThreadTitle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#22abe2]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase text-[11px] mb-1">
                  Descripción Detallada *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe el contexto, error o pregunta para que tus compañeros y docente puedan responderte con precisión..."
                  value={newThreadContent}
                  onChange={(e) => setNewThreadContent(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#22abe2]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setNewThreadModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#22abe2] hover:bg-[#1b9ad0] text-white font-bold transition shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Publicar en Moodle</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: VIDEO LECTURE */}
      {activeVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-800 overflow-hidden text-white">
            <div className="p-4 bg-black/40 flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-[#22abe2]" />
                <span className="font-bold text-xs truncate max-w-md">{activeVideoModal.title}</span>
              </div>
              <button
                onClick={() => setActiveVideoModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player Simulation Screen */}
            <div className="relative aspect-video bg-black flex items-center justify-center group">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-[#22abe2] text-white flex items-center justify-center mx-auto shadow-lg shadow-[#22abe2]/40 group-hover:scale-110 transition cursor-pointer">
                  <Play className="w-8 h-8 ml-1" />
                </div>
                <p className="text-xs text-slate-300 font-mono">
                  Streaming 1080p • {activeVideoModal.duration || '48 min'} • Servidor CDN IINICIA
                </p>
              </div>
            </div>

            <div className="p-5 space-y-2 text-xs">
              <p className="font-bold text-white text-sm">Resumen de la Clase Magistral:</p>
              <p className="text-slate-300 leading-relaxed">
                {activeVideoModal.description || 'Contenido oficial grabado del claustro docente.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: DOCUMENT VIEWER */}
      {activeDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden">
            <div className="bg-[#05080f] p-6 text-white flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-[#22abe2]" />
                <h3 className="text-sm sm:text-base font-bold truncate max-w-sm">{activeDocModal.title}</h3>
              </div>
              <button
                onClick={() => setActiveDocModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <p className="font-bold text-slate-900">Documento Académico Oficial:</p>
                <p className="text-slate-600 leading-relaxed">{activeDocModal.description}</p>
                <p className="text-[11px] text-slate-400 font-mono">Fecha de publicación: {activeDocModal.date || 'Octubre 2026'}</p>
              </div>

              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-blue-900">Formato PDF Oficial (RVOE SEP)</p>
                  <p className="text-[10px] text-blue-700">Listo para consulta y almacenamiento sin conexión</p>
                </div>
                <button
                  onClick={() => alert(`Descargando copia autorizada: ${activeDocModal.title}.pdf`)}
                  className="px-3.5 py-2 bg-[#22abe2] hover:bg-[#1b9ad0] text-white rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: INTERACTIVE GPU LAB SANDBOX */}
      {activeLabModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#05080f] rounded-3xl shadow-2xl max-w-3xl w-full border border-slate-800 overflow-hidden text-white font-mono text-xs">
            <div className="p-4 bg-black/50 flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-[#22abe2]" />
                <span className="font-bold text-xs text-[#22abe2]">GPU Sandbox: NVIDIA Tesla T4 (PyTorch 2.4 + CUDA 12.2)</span>
              </div>
              <button
                onClick={() => setActiveLabModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated Code Editor */}
            <div className="p-5 space-y-4">
              <div className="bg-black/70 p-4 rounded-2xl border border-slate-800 text-slate-300 space-y-1">
                <p className="text-emerald-400"># Laboratorio Oficial IINICIA - CIFAR-10 CNN</p>
                <p><span className="text-[#22abe2]">import</span> torch</p>
                <p><span className="text-[#22abe2]">import</span> torch.nn <span className="text-[#22abe2]">as</span> nn</p>
                <p>device = torch.device(<span className="text-amber-400">"cuda"</span> <span className="text-[#22abe2]">if</span> torch.cuda.is_available() <span className="text-[#22abe2]">else</span> <span className="text-amber-400">"cpu"</span>)</p>
                <p>model = ResNet18(num_classes=10).to(device)</p>
                <p>scaler = torch.cuda.amp.GradScaler()</p>
                <p className="text-slate-500"># Entrenando con optimizador AdamW...</p>
              </div>

              {/* Console Output */}
              <div className="bg-black p-4 rounded-2xl border border-slate-800 min-h-36 max-h-56 overflow-y-auto space-y-1 text-[11px]">
                <p className="text-slate-400">[Consola de Salida - Listo para ejecución]</p>
                {labConsoleOutput.map((line, idx) => (
                  <p key={idx} className={line.startsWith('✓') ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                    {line}
                  </p>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                <span className="text-[11px] text-slate-400">Ambiente virtual conectado a IINICIA Cloud</span>
                <button
                  onClick={handleRunLabCode}
                  disabled={runningLab}
                  className="px-5 py-2.5 rounded-xl bg-[#22abe2] hover:bg-[#1b9ad0] text-white font-bold transition shadow-lg shadow-[#22abe2]/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-4 h-4" />
                  <span>{runningLab ? 'Compilando y Entrenando...' : 'Ejecutar en GPU'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
