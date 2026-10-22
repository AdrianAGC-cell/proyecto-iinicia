import React, { useState } from 'react';
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

export const MoodlePreview: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const targetCourseId = (location.state as any)?.courseId;

  const currentCourse = MOCK_STUDENT_COURSES.find(c => c.moodleCourseId === targetCourseId) || MOCK_STUDENT_COURSES[0];

  const modules = [
    {
      week: 'Bloque General',
      title: 'Presentación, Normas y Recursos del Curso',
      items: [
        { type: 'pdf', title: 'Syllabus Oficial y Rúbricas de Evaluación (RVOE SEP)', icon: FileText, date: '15 Oct' },
        { type: 'forum', title: 'Foro de Presentación y Dudas con el Claustro', icon: MessageSquare, replies: 28 },
        { type: 'link', title: 'Acceso a Laboratorio Virtual GPU (Google Cloud / Colab Pro)', icon: ExternalLink, date: 'Permanente' }
      ]
    },
    {
      week: 'Unidad 1',
      title: 'Fundamentos de Aprendizaje Profundo y Tensores en PyTorch',
      items: [
        { type: 'video', title: 'Clase Magistral: De la Neurona Biológica al Perceptrón Multicapa', icon: Video, duration: '45 min' },
        { type: 'pdf', title: 'Lectura Obligatoria: Arquitectura de Redes Feed-Forward', icon: FileText, date: '18 Oct' },
        { type: 'assignment', title: 'Tarea Práctica 1: Implementación de Descenso de Gradiente desde cero', icon: Award, deadline: '24 Oct 2026, 23:59', status: 'Pendiente de Calificación' }
      ]
    },
    {
      week: 'Unidad 2',
      title: 'Redes Convolucionales (CNN) y Visión Computacional',
      items: [
        { type: 'video', title: 'Clase Magistral: Filtros, Pooling y Transfer Learning', icon: Video, duration: '52 min' },
        { type: 'assignment', title: 'Laboratorio Evaluatorio 2: Clasificación de Imágenes con ResNet-50', icon: Award, deadline: '05 Nov 2026', status: 'Abierto' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-20">
      {/* Simulation Banner */}
      <div className="bg-[#05080f] text-slate-300 text-xs py-2 px-4 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#22abe2] animate-pulse"></span>
          <span className="font-mono text-[#22abe2] font-bold">aula.iinicia.org</span>
          <span className="hidden sm:inline text-slate-400">• Entorno Moodle 4.x con tema universitario oficial</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400 hidden sm:inline">SSO activo: {user?.email}</span>
          <Link
            to="/mi-iinicia"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#22abe2] hover:bg-[#1b9ad0] text-white font-bold text-xs transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a Mi IINICIA</span>
          </Link>
        </div>
      </div>

      {/* Moodle Header with Official Logo */}
      <header className="bg-white border-b border-slate-200 shadow-xs px-4 sm:px-8 py-3 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo-iinicia.png"
              alt="I²NICIA"
              className="h-10 w-auto object-contain"
            />
            <span className="text-xs font-bold text-[#148ebf] bg-[#22abe2]/10 px-2.5 py-1 rounded-md border border-[#22abe2]/20">
              Campus Virtual
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
            <span className="hidden md:inline text-slate-500">
              Bienvenida(o), <strong className="text-slate-800">{user?.name}</strong>
            </span>
            <SafeImage
              src={user?.avatar}
              alt={user?.name || 'Estudiante'}
              isAvatar={true}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-[#22abe2]"
            />
          </div>
        </div>
      </header>

      {/* Course Banner */}
      <div className="bg-gradient-to-r from-[#05080f] via-[#09101d] to-[#05080f] text-white py-8 px-4 sm:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
            <span>Mis Cursos</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#22abe2]" />
            <span>Otoño 2026</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#22abe2]" />
            <span className="text-[#22abe2] font-mono">{currentCourse.code}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {currentCourse.name}
          </h1>
          <p className="text-xs text-slate-300">
            Docente Titular: <strong className="text-white">{currentCourse.professor}</strong> • Cohorte 2026-A • {currentCourse.progress}% completado
          </p>
        </div>
      </div>

      {/* Main LMS Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left / Main Modules Column */}
        <div className="lg:col-span-3 space-y-6">
          {modules.map((mod, modIdx) => (
            <div key={modIdx} className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#148ebf] bg-[#22abe2]/15 px-2 py-0.5 rounded">
                    {mod.week}
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 mt-1">
                    {mod.title}
                  </h3>
                </div>
              </div>

              <div className="divide-y divide-slate-100 p-2">
                {mod.items.map((item, itemIdx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={itemIdx}
                      className="p-4 flex items-center justify-between hover:bg-slate-50/80 rounded-2xl transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-[#22abe2]/10 text-[#22abe2] flex items-center justify-center shrink-0 group-hover:bg-[#22abe2] group-hover:text-white transition">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-[#22abe2] transition">
                            {item.title}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            {item.date && <span>Publicado: {item.date}</span>}
                            {item.duration && <span>Duración: {item.duration}</span>}
                            {item.deadline && <span className="text-amber-600 font-semibold">Entrega: {item.deadline}</span>}
                            {item.replies && <span>{item.replies} intervenciones</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.status ? (
                          <span className="text-[10px] font-bold px-2 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            {item.status}
                          </span>
                        ) : (
                          <CheckCircle2 className="w-5 h-5 text-[#22abe2]" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Right Sidebar: LMS Widgets */}
        <div className="space-y-6">
          {/* Progress Widget */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Finalización de Actividades
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Progreso total:</span>
                <span>{currentCourse.progress}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-[#22abe2] rounded-full"
                  style={{ width: `${currentCourse.progress}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-slate-500">
                Has completado 12 de 15 actividades obligatorias.
              </p>
            </div>
          </div>

          {/* Teacher Box */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Profesor Titular
            </h4>
            <div className="flex items-center gap-3">
              <SafeImage
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
                alt={currentCourse.professor}
                isAvatar={true}
                className="w-12 h-12 rounded-xl object-cover ring-2 ring-[#22abe2]/30 shadow-xs"
              />
              <div>
                <p className="text-xs font-bold text-slate-900">{currentCourse.professor}</p>
                <p className="text-[10px] text-slate-500">Catedrático e Investigador</p>
              </div>
            </div>
            <button
              onClick={() => alert(`Abriendo mensajería instantánea con el profesor ${currentCourse.professor}`)}
              className="w-full py-2 rounded-xl bg-[#22abe2]/10 text-[#22abe2] hover:bg-[#22abe2]/20 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Enviar Mensaje Privado</span>
            </button>
          </div>

          {/* Quick SSO Security Indicator */}
          <div className="bg-[#22abe2]/10 border border-[#22abe2]/30 rounded-3xl p-5 space-y-2 text-xs text-slate-800">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-[#22abe2]" />
              <span>Sesión Autenticada vía OIDC</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-600">
              Tu token fue verificado contra el proveedor de identidad de I²NICIA. No se requirió una contraseña local de Moodle.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
