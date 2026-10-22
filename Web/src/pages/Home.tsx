import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  BookOpen, 
  Users, 
  Award, 
  Laptop, 
  ShieldCheck, 
  Calendar, 
  Search, 
  ExternalLink,
  GraduationCap,
  Clock,
  Briefcase,
  Zap
} from 'lucide-react';
import { MOCK_PROGRAMS, MOCK_NEWS } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { SafeImage } from '../components/common/SafeImage';

export const Home: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { triggerMoodleSSO } = useAuth();
  const navigate = useNavigate();

  const quickSearchTags = [
    'Inteligencia Artificial',
    'Arquitectura Cloud',
    'Negocios Digitales',
    'Ciberseguridad'
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/oferta-academica?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/oferta-academica');
    }
  };

  const handleTagClick = (tag: string) => {
    navigate(`/oferta-academica?q=${encodeURIComponent(tag)}`);
  };

  const featuredPrograms = MOCK_PROGRAMS.filter(p => p.featured);

  return (
    <div className="space-y-20 pb-20 overflow-hidden">
      {/* =========================================================================
          HERO SECTION (CABEZA DE LA PÁGINA)
         ========================================================================= */}
      <section className="relative pt-10 pb-24 lg:pt-16 lg:pb-32 bg-gradient-to-b from-[#030611] via-[#071021] to-[#040814] text-white overflow-hidden border-b border-slate-800/80">
        {/* Background Ambient Glowing Orbs */}
        <div className="absolute top-[-10%] left-[-5%] w-[550px] h-[550px] bg-[#22abe2]/15 rounded-full blur-[140px] pointer-events-none animate-pulse-glow" />
        <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-[#148ebf]/15 rounded-full blur-[150px] pointer-events-none animate-pulse-glow" style={{ animationDelay: '2.5s' }} />
        <div className="absolute inset-0 bg-tech-grid opacity-35 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Hero Copy & Actions */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Tagline Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#22abe2]/10 border border-[#22abe2]/30 text-[#7dd3f1] text-xs font-semibold backdrop-blur-md shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22abe2] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22abe2]"></span>
                </span>
                <span>Plataforma Oficial Universitaria • React + Moodle LMS</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12]">
                Lidera el futuro en{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#22abe2] via-[#7dd3f1] to-white">
                  Inteligencia Artificial
                </span>{' '}
                y Ciencias Aplicadas
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal max-w-2xl mx-auto lg:mx-0">
                Bienvenido a <strong className="text-white font-semibold">I²NICIA</strong> (Instituto de Innovación y Ciencias Aplicadas). Programas académicos con validez oficial RVOE SEP Federal, campus virtual 24/7 y Single Sign-On unificado.
              </p>

              {/* Interactive Search Bar */}
              <div className="space-y-3 pt-1 max-w-xl mx-auto lg:mx-0">
                <form onSubmit={handleSearchSubmit} className="relative flex items-center group">
                  <Search className="absolute left-4 w-5 h-5 text-slate-400 group-focus-within:text-[#22abe2] transition-colors pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="¿Qué deseas estudiar? (ej. Inteligencia Artificial, Software, Negocios...)"
                    className="w-full pl-12 pr-32 py-4 rounded-2xl bg-white/[0.07] hover:bg-white/[0.11] focus:bg-white/[0.15] text-white placeholder-slate-400 border border-white/20 focus:border-[#22abe2] focus:outline-none focus:ring-4 focus:ring-[#22abe2]/20 transition-all duration-200 backdrop-blur-xl text-sm shadow-2xl"
                  />
                  <button
                    type="submit"
                    className="absolute right-2.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#22abe2] to-[#148ebf] hover:from-[#1b9ad0] hover:to-[#0f729b] text-white font-bold text-xs tracking-wide transition-all duration-200 shadow-md shadow-[#22abe2]/25 hover:shadow-lg hover:shadow-[#22abe2]/40 hover:-translate-y-0.5 cursor-pointer"
                  >
                    Buscar
                  </button>
                </form>

                {/* Quick Search Tag Chips */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 text-xs">
                  <span className="text-slate-400 text-[11px] font-medium">Búsquedas rápidas:</span>
                  {quickSearchTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagClick(tag)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#22abe2]/20 text-slate-300 hover:text-white border border-white/10 hover:border-[#22abe2]/50 text-[11px] font-medium transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                    >
                      ✦ {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* CTA Action Buttons */}
              <div className="pt-3 flex flex-wrap items-center justify-center lg:justify-start gap-3.5">
                <Link
                  to="/oferta-academica"
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#22abe2] to-[#148ebf] hover:from-[#1b9ad0] hover:to-[#0f729b] text-white font-bold text-sm shadow-xl shadow-[#22abe2]/30 transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-[#22abe2]/40 flex items-center gap-2 group"
                >
                  <span>Explorar Carreras</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/admisiones"
                  className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 hover:border-white/40 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <span>Iniciar Admisión 2026</span>
                </Link>
                <button
                  onClick={() => triggerMoodleSSO()}
                  className="px-5 py-3.5 rounded-xl bg-white/5 hover:bg-[#22abe2]/15 text-[#7dd3f1] hover:text-white font-bold text-sm border border-[#22abe2]/40 hover:border-[#22abe2] backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer shadow-sm group"
                >
                  <span>Entrar a Mi Campus LMS</span>
                  <ExternalLink className="w-4 h-4 text-[#22abe2] group-hover:rotate-12 transition-transform" />
                </button>
              </div>

              {/* Trust Badges Bar */}
              <div className="pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#22abe2] shrink-0" />
                  <span className="text-[11px] text-slate-300 font-medium">RVOE SEP Federal</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#22abe2] shrink-0" />
                  <span className="text-[11px] text-slate-300 font-medium">Single Sign-On OIDC</span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#22abe2] shrink-0" />
                  <span className="text-[11px] text-slate-300 font-medium">Moodle 4.x Oficial</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#22abe2] shrink-0" />
                  <span className="text-[11px] text-slate-300 font-medium">98.4% Empleabilidad</span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive "Campus Virtual en Vivo" Showcase Card */}
            <div className="lg:col-span-5 relative mt-6 lg:mt-0">
              {/* Outer Card with Floating Animation */}
              <div className="relative mx-auto max-w-md lg:max-w-none rounded-3xl p-6 bg-gradient-to-b from-white/[0.12] to-white/[0.04] backdrop-blur-2xl border border-white/20 shadow-2xl shadow-cyan-950/60 transition-all duration-500 hover:border-[#22abe2]/60 animate-float-slow group">
                
                {/* Header of Showcase Card */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                    <div>
                      <p className="text-xs font-black text-white tracking-wide">Campus Virtual I²NICIA</p>
                      <p className="text-[10px] text-emerald-400 font-medium">● Sistema LMS 100% Operativo</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#22abe2]/20 text-[#7dd3f1] border border-[#22abe2]/30">
                    SSO Activo
                  </span>
                </div>

                {/* Simulated Student Portal Header inside Showcase */}
                <div className="flex items-center gap-3.5 bg-white/5 p-3.5 rounded-2xl border border-white/10 mb-4">
                  <SafeImage
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
                    alt="Valeria Morales"
                    isAvatar={true}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-[#22abe2]"
                  />
                  <div className="space-y-0.5">
                    <p className="text-xs font-black text-white">Valeria Morales Santillán</p>
                    <p className="text-[11px] text-[#7dd3f1] font-medium">Lic. en IA y Ciencia de Datos</p>
                    <p className="text-[10px] text-slate-400 font-mono">Matrícula: IIN-2024-8842 • 4to Sem.</p>
                  </div>
                </div>

                {/* Course Card in Live LMS */}
                <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-700/80 space-y-3 shadow-inner">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-[#22abe2] font-bold">IA-401 • PyTorch Lab</span>
                    <span className="text-slate-400">Calificación: 9.6</span>
                  </div>
                  <h4 className="text-xs font-bold text-white line-clamp-1">
                    Redes Neuronales y Deep Learning con PyTorch
                  </h4>
                  
                  {/* Progress bar with smooth animation */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Avance de la materia</span>
                      <span className="font-bold text-white">78%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#22abe2] to-[#7dd3f1] rounded-full w-[78%] transition-all duration-500" />
                    </div>
                  </div>

                  {/* Deadline Notification */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px]">
                    <span className="text-amber-300 flex items-center gap-1 font-semibold">
                      <Clock className="w-3 h-3" />
                      <span>Entrega: Hoy 23:59</span>
                    </span>
                    <button
                      onClick={() => triggerMoodleSSO()}
                      className="text-[#22abe2] hover:text-white font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>Abrir en Moodle</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Quick Link Button to Moodle */}
                <div className="mt-4 pt-2">
                  <button
                    onClick={() => triggerMoodleSSO()}
                    className="w-full py-3 rounded-xl bg-[#22abe2] hover:bg-[#1b9ad0] text-white font-bold text-xs shadow-md shadow-[#22abe2]/20 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer hover:shadow-lg hover:shadow-[#22abe2]/30 hover:-translate-y-0.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Navegar a Aula Moodle (Single Sign-On)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Floating Micro-Badge Top Right */}
                <div className="absolute -top-4 -right-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-lg border border-emerald-300/40 flex items-center gap-1.5 animate-bounce" style={{ animationDuration: '3s' }}>
                  <Award className="w-3.5 h-3.5" />
                  <span>Beca 60% Otorgada</span>
                </div>

                {/* Floating Micro-Badge Bottom Left */}
                <div className="absolute -bottom-4 -left-4 bg-slate-900/95 text-white text-[10px] font-semibold px-3 py-1.5 rounded-xl shadow-xl border border-slate-700/80 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#22abe2]" />
                  <span>Identidad OIDC Keycloak</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          METRICS / STATS SECTION (CON DISEÑO ELEVADO Y HOVER LIFT)
         ========================================================================= */}
      <section className="-mt-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="space-y-1 text-center card-hover-effect p-3 rounded-2xl group">
            <div className="w-10 h-10 rounded-xl bg-[#22abe2]/10 text-[#22abe2] flex items-center justify-center mx-auto mb-2 group-hover:bg-[#22abe2] group-hover:text-white transition-colors duration-200">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-3xl sm:text-4xl font-black text-[#22abe2]">12,000+</p>
            <p className="text-xs sm:text-sm font-bold text-slate-800">Estudiantes Activos</p>
            <p className="text-[11px] text-slate-400">En México y Latinoamérica</p>
          </div>

          <div className="space-y-1 text-center card-hover-effect p-3 rounded-2xl group border-l-0 sm:border-l border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto mb-2 group-hover:bg-[#22abe2] group-hover:text-white transition-colors duration-200">
              <Briefcase className="w-5 h-5" />
            </div>
            <p className="text-3xl sm:text-4xl font-black text-slate-900">98.4%</p>
            <p className="text-xs sm:text-sm font-bold text-slate-800">Índice de Empleabilidad</p>
            <p className="text-[11px] text-slate-400">A los 6 meses de egreso</p>
          </div>

          <div className="space-y-1 text-center card-hover-effect p-3 rounded-2xl group border-l-0 lg:border-l border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-[#22abe2]/10 text-[#22abe2] flex items-center justify-center mx-auto mb-2 group-hover:bg-[#22abe2] group-hover:text-white transition-colors duration-200">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <p className="text-3xl sm:text-4xl font-black text-[#22abe2]">100%</p>
            <p className="text-xs sm:text-sm font-bold text-slate-800">RVOE SEP Federal</p>
            <p className="text-[11px] text-slate-400">Validez oficial garantizada</p>
          </div>

          <div className="space-y-1 text-center card-hover-effect p-3 rounded-2xl group border-l border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto mb-2 group-hover:bg-[#22abe2] group-hover:text-white transition-colors duration-200">
              <Clock className="w-5 h-5" />
            </div>
            <p className="text-3xl sm:text-4xl font-black text-slate-900">24/7</p>
            <p className="text-xs sm:text-sm font-bold text-slate-800">Campus Virtual Moodle</p>
            <p className="text-[11px] text-slate-400">SSO con alta disponibilidad</p>
          </div>

        </div>
      </section>

      {/* =========================================================================
          VALUE PROP & DESACOPLADA ARCHITECTURE
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#22abe2] bg-[#22abe2]/10 px-3.5 py-1 rounded-full border border-[#22abe2]/20">
            Evolución Tecnológica Universitaria
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Una plataforma diseñada para aprender sin fricción
          </h2>
          <p className="text-sm text-slate-600">
            Superando la arquitectura monolítica de WordPress hacia una experiencia desacoplada, segura e integrada con Moodle LMS oficial.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 card-hover-effect group relative overflow-hidden">
            <div className="w-14 h-14 rounded-2xl bg-[#22abe2]/10 border border-[#22abe2]/20 flex items-center justify-center text-[#22abe2] mb-6 group-hover:scale-110 group-hover:bg-[#22abe2] group-hover:text-white transition-all duration-300 shadow-sm">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2.5 group-hover:text-[#22abe2] transition-colors">
              Una Sola Identidad (SSO)
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Un único inicio de sesión centralizado con Keycloak OIDC. Entra a tu portal web, consulta tus materias y navega a Moodle sin volver a escribir tu contraseña.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 card-hover-effect group relative overflow-hidden">
            <div className="w-14 h-14 rounded-2xl bg-[#22abe2]/10 border border-[#22abe2]/20 flex items-center justify-center text-[#22abe2] mb-6 group-hover:scale-110 group-hover:bg-[#22abe2] group-hover:text-white transition-all duration-300 shadow-sm">
              <Laptop className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2.5 group-hover:text-[#22abe2] transition-colors">
              React de Alta Velocidad
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Carga instantánea de planes de estudio, admisiones digitales y seguimiento de calificaciones con una interfaz accesible bajo lineamientos WCAG 2.2 AA.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 card-hover-effect group relative overflow-hidden">
            <div className="w-14 h-14 rounded-2xl bg-[#22abe2]/10 border border-[#22abe2]/20 flex items-center justify-center text-[#22abe2] mb-6 group-hover:scale-110 group-hover:bg-[#22abe2] group-hover:text-white transition-all duration-300 shadow-sm">
              <Award className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2.5 group-hover:text-[#22abe2] transition-colors">
              Moodle LMS Institucional
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              El motor académico número uno a nivel mundial, personalizado con la identidad visual I²NICIA para tareas, foros, laboratorios y exámenes seguros.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FEATURED PROGRAMS SECTION
         ========================================================================= */}
      <section className="bg-slate-100/80 py-16 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#22abe2] bg-[#22abe2]/10 px-3.5 py-1 rounded-full border border-[#22abe2]/20">
                Oferta de Vanguardia
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2.5">
                Programas Académicos Destacados
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm mt-1">
                Planes de estudio con validez oficial RVOE SEP actualizados al 2026.
              </p>
            </div>
            <Link
              to="/oferta-academica"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#22abe2] hover:text-[#1b9ad0] transition group"
            >
              <span>Ver todas las carreras ({MOCK_PROGRAMS.length})</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredPrograms.map((program) => (
              <div
                key={program.id}
                className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200 flex flex-col justify-between card-hover-effect group"
              >
                <div>
                  {/* Card Header Image with SafeImage and zoom on hover */}
                  <div className="relative h-52 overflow-hidden bg-slate-900">
                    <SafeImage
                      src={program.image}
                      alt={program.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute top-3 left-3 bg-[#22abe2] text-white text-[11px] font-extrabold px-3 py-1 rounded-lg shadow-md">
                      {program.degree}
                    </div>
                    <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-md text-white text-[11px] font-medium px-2.5 py-1 rounded-lg border border-white/10">
                      {program.modality}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 space-y-3">
                    <span className="text-[11px] font-extrabold text-[#22abe2] uppercase tracking-wider">
                      {program.area}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-[#22abe2] transition-colors">
                      {program.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {program.description}
                    </p>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-6 pt-0">
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Duración</p>
                      <p className="text-xs font-bold text-slate-800">{program.duration}</p>
                    </div>
                    <Link
                      to={`/carrera/${program.id}`}
                      className="px-4 py-2 rounded-xl bg-[#22abe2]/10 text-[#148ebf] hover:bg-[#22abe2] hover:text-white text-xs font-bold transition-all duration-200 flex items-center gap-1.5 group/btn"
                    >
                      <span>Ver plan</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          ADMISSION BANNER SECTION
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#030611] via-[#071021] to-[#030611] rounded-3xl p-8 sm:p-14 text-white relative overflow-hidden shadow-2xl border border-slate-800 group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#22abe2]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-tech-dots opacity-20 pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#22abe2] bg-[#22abe2]/15 px-3 py-1 rounded-full border border-[#22abe2]/30">
              Proceso 100% Digital
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              Inicia tu proceso de admisión hoy en menos de 5 minutos
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Sin filas ni trámites burocráticos. Nuestro sistema valida automáticamente tu expediente, genera tu perfil institucional y te matricula en el aula virtual de inducción en Moodle.
            </p>
            <div className="pt-4 flex flex-wrap gap-4">
              <Link
                to="/admisiones"
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#22abe2] to-[#148ebf] hover:from-[#1b9ad0] hover:to-[#0f729b] text-white font-bold text-sm shadow-xl shadow-[#22abe2]/25 transition-all duration-200 transform hover:-translate-y-0.5"
              >
                Comenzar Solicitud de Admisión
              </Link>
              <Link
                to="/contacto"
                className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition-all duration-200 hover:-translate-y-0.5"
              >
                Hablar con un Asesor
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          NEWS & PRESS SECTION (CON IMÁGENES CORREGIDAS Y ZOOM HOVER)
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#22abe2] bg-[#22abe2]/10 px-3.5 py-1 rounded-full border border-[#22abe2]/20">
              Actualidad Institucional
            </span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mt-2.5">
              Noticias y Comunicados
            </h2>
          </div>
          <Link
            to="/noticias"
            className="text-xs font-bold text-[#22abe2] hover:text-[#1b9ad0] transition inline-flex items-center gap-1 group"
          >
            <span>Ver todas las publicaciones</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {MOCK_NEWS.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm card-hover-effect flex flex-col justify-between group"
            >
              <div>
                <div className="h-48 overflow-hidden relative bg-slate-900">
                  <SafeImage
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  />
                  <span className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg border border-white/10">
                    {item.category}
                  </span>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-[#22abe2]" />
                    <span>{item.date}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-[#22abe2] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {item.summary}
                  </p>
                </div>
              </div>
              <div className="p-6 pt-0">
                <div className="pt-4 border-t border-slate-100">
                  <Link
                    to="/noticias"
                    className="text-xs font-bold text-[#22abe2] hover:text-[#1b9ad0] inline-flex items-center gap-1 group/btn"
                  >
                    <span>Leer comunicado completo</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
