import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  ArrowLeft, 
  Briefcase, 
  Target, 
  ChevronDown, 
  ChevronUp, 
  GraduationCap
} from 'lucide-react';
import { MOCK_PROGRAMS } from '../data/mockData';
import { SafeImage } from '../components/common/SafeImage';

export const DetallePrograma: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const program = MOCK_PROGRAMS.find((p) => p.id === id) || MOCK_PROGRAMS[0];

  const [openSemester, setOpenSemester] = useState<number | null>(0);

  const toggleSemester = (idx: number) => {
    setOpenSemester(openSemester === idx ? null : idx);
  };

  return (
    <div className="space-y-12 pb-24">
      {/* Top Breadcrumb & Hero */}
      <section className="bg-gradient-to-r from-[#05080f] via-[#09101d] to-[#05080f] text-white py-12 lg:py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <Link
            to="/oferta-academica"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#22abe2] hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la Oferta Académica</span>
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#22abe2] text-white text-xs font-bold uppercase tracking-wider">
                  {program.degree}
                </span>
                <span className="px-3 py-1 rounded-full bg-[#22abe2]/20 text-[#7dd3f1] border border-[#22abe2]/30 text-xs font-medium">
                  {program.area}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {program.rvoe}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                {program.title}
              </h1>

              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                {program.description}
              </p>

              <div className="pt-2 flex flex-wrap gap-4 text-xs font-medium text-slate-300">
                <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
                  <Clock className="w-4 h-4 text-[#22abe2]" />
                  <span>Duración: {program.duration}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
                  <BookOpen className="w-4 h-4 text-[#22abe2]" />
                  <span>Créditos: {program.credits} RVOE</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
                  <GraduationCap className="w-4 h-4 text-[#22abe2]" />
                  <span>Modalidad: {program.modality}</span>
                </div>
              </div>
            </div>

            {/* Quick Application Card with Program Image */}
            <div className="bg-white rounded-3xl p-6 text-slate-900 shadow-2xl border border-slate-200 space-y-4 hover:border-[#22abe2]/60 transition-all duration-300 card-hover-effect">
              <div className="relative h-44 rounded-2xl overflow-hidden shadow-inner group">
                <SafeImage
                  src={program.image}
                  alt={program.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2.5 left-2.5 bg-[#22abe2] text-white text-[10px] font-extrabold px-2.5 py-1 rounded-md shadow-xs">
                  {program.degree}
                </div>
              </div>

              <div>
                <h3 className="font-black text-base text-slate-900">
                  Inscripciones 2026-2027
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Asegura tu lugar con becas por desempeño académico del 40% al 60%.
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-[#22abe2] shrink-0" />
                  <span>Proceso de admisión 100% digital</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-[#22abe2] shrink-0" />
                  <span>Sincronización automática con Moodle LMS</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-[#22abe2] shrink-0" />
                  <span>Mentorías con ingenieros de la industria</span>
                </div>
              </div>

              <Link
                to={`/admisiones?program=${program.id}`}
                className="w-full block text-center py-3 px-4 rounded-xl bg-gradient-to-r from-[#22abe2] to-[#148ebf] hover:from-[#1b9ad0] hover:to-[#0f729b] text-white font-bold text-xs shadow-md shadow-[#22abe2]/20 hover:shadow-lg hover:shadow-[#22abe2]/30 transition-all duration-200 transform hover:-translate-y-0.5"
              >
                Postularme a este Programa
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content: Objectives, FieldWork, Syllabus */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column: Syllabus */}
          <div className="lg:col-span-2 space-y-8">
            {/* Objectives & Field */}
            <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-[#22abe2]" />
                  <span>Objetivo del Programa</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {program.objectives}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-2">
                  <Briefcase className="w-5 h-5 text-[#22abe2]" />
                  <span>Campo Laboral y Oportunidades</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {program.fieldWork}
                </p>
              </div>
            </div>

            {/* Interactive Syllabus Accordion */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Malla Curricular y Plan de Estudios
                </h3>
                <p className="text-xs text-slate-500">
                  Estructurado por periodos académicos progresivos.
                </p>
              </div>

              <div className="space-y-3">
                {program.syllabus.map((period, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs transition hover:border-[#22abe2]/40"
                  >
                    <button
                      onClick={() => toggleSemester(idx)}
                      className="w-full flex items-center justify-between p-4 text-left font-bold text-slate-800 hover:bg-slate-50 transition"
                    >
                      <span className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-[#22abe2]/10 text-[#22abe2] text-xs flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-slate-900">{period.semester}</span>
                      </span>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>{period.courses.length} materias</span>
                        {openSemester === idx ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </button>

                    {openSemester === idx && (
                      <div className="p-4 pt-1 bg-slate-50/70 border-t border-slate-100 animate-fadeIn">
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {period.courses.map((courseName, cIdx) => (
                            <li
                              key={cIdx}
                              className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200/80 text-slate-700 font-medium"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#22abe2] shrink-0" />
                              <span>{courseName}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar: Program Details */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                Ficha Técnica Oficial
              </h4>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block">Nivel Académico:</span>
                  <span className="font-bold text-slate-800">{program.degree}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Área de Especialidad:</span>
                  <span className="font-bold text-slate-800">{program.area}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Acuerdo RVOE SEP:</span>
                  <span className="font-bold text-[#148ebf] font-mono">{program.rvoe}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">LMS y Aula Virtual:</span>
                  <span className="font-bold text-slate-900">Moodle 4.x + SSO Keycloak</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Próximo Inicio:</span>
                  <span className="font-bold text-slate-800">Convocatoria 2026-2027</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-2">
                <Link
                  to={`/admisiones?program=${program.id}`}
                  className="w-full block text-center py-2.5 px-4 rounded-xl bg-[#22abe2] hover:bg-[#1b9ad0] text-white font-bold text-xs transition shadow-xs"
                >
                  Iniciar Solicitud
                </Link>
                <Link
                  to="/contacto"
                  className="w-full block text-center py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                >
                  Consultar con Asesoría
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
