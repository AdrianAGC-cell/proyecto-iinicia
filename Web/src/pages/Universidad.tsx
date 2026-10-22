import React from 'react';
import { 
  Target, 
  Eye, 
  Award, 
  Users, 
  BookOpen, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles 
} from 'lucide-react';
import { SafeImage } from '../components/common/SafeImage';

export const Universidad: React.FC = () => {
  const authorities = [
    {
      name: 'Dr. Guillermo Santibáñez',
      role: 'Rector Institucional',
      degree: 'Ph.D. en Ciencias de la Computación (MIT)',
      bio: 'Más de 20 años de experiencia liderando iniciativas de innovación tecnológica y transformación educativa en Iberoamérica.',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80'
    },
    {
      name: 'Dra. Sofía Alarcón Ruiz',
      role: 'Vicerrectora Académica',
      degree: 'Doctora en Inteligencia Artificial y Datos',
      bio: 'Investigadora en redes neuronales profundas y asesora técnica para la regulación de algoritmos en la educación.',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80'
    },
    {
      name: 'Ing. Roberto Peña Guzmán',
      role: 'Director de Infraestructura y Tecnología',
      degree: 'M.Sc. en Arquitectura de Software y Cloud',
      bio: 'Líder en la migración del ecosistema universitario a React, Node.js y Moodle con Single Sign-On centralizado.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'
    },
    {
      name: 'Mtra. Camila Morales',
      role: 'Directora de Experiencia Estudiantil',
      degree: 'Maestra en Pedagogía Digital',
      bio: 'Especialista en tutorías sincrónicas, bienestar estudiantil y seguimiento de retención académica.',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80'
    }
  ];

  const pillars = [
    {
      title: 'Aprendizaje Activo y Basado en Retos',
      desc: 'No memorizas conceptos: resuelves problemas reales con datasets corporativos, entornos de programación en la nube y evaluación continua.'
    },
    {
      title: 'Claustro de Practicantes de la Industria',
      desc: 'Nuestros docentes trabajan activamente en multinacionales, laboratorios de IA y startups de alto impacto.'
    },
    {
      title: 'Plataforma Tecnológica Integrada',
      desc: 'Un entorno digital desacoplado donde tu identidad, tus materias en Moodle y tus trámites escolares conviven en perfecta sincronía.'
    },
    {
      title: 'Acompañamiento Personalizado 24/7',
      desc: 'Tutores académicos y soporte técnico siempre disponibles para asegurar que alcances tus metas de titulación.'
    }
  ];

  return (
    <div className="space-y-20 pb-20">
      {/* Banner Superior */}
      <section className="bg-gradient-to-b from-[#05080f] via-[#09101d] to-[#05080f] text-white py-16 sm:py-24 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#22abe2] bg-[#22abe2]/10 px-3 py-1 rounded-full border border-[#22abe2]/20">
            Nuestra Institución
          </span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
            Formando el Talento que Transforma el Mundo
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            El Instituto de Innovación y Ciencias Aplicadas (<strong className="text-white">I²NICIA</strong>) nació para derribar las barreras geográficas y ofrecer educación superior de la más alta calidad con pertinencia tecnológica real.
          </p>
        </div>
      </section>

      {/* Misión, Visión y Valores */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden hover:border-[#22abe2]/40 transition">
            <div className="w-12 h-12 rounded-2xl bg-[#22abe2]/10 text-[#22abe2] flex items-center justify-center mb-6">
              <Target className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-3">Nuestra Misión</h2>
            <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">
              Formar profesionistas, investigadores y líderes éticos en disciplinas tecnológicas y ciencias aplicadas, a través de un modelo educativo flexible, riguroso y soportado por una infraestructura digital moderna que maximiza la empleabilidad y el impacto positivo en la sociedad.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden hover:border-[#22abe2]/40 transition">
            <div className="w-12 h-12 rounded-2xl bg-[#22abe2]/10 text-[#22abe2] flex items-center justify-center mb-6">
              <Eye className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-3">Nuestra Visión</h2>
            <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">
              Consolidarnos para 2030 como la institución universitaria líder en Iberoamérica en educación tecnológica y ciencias aplicadas, reconocida por la excelencia de sus egresados, la solidez de su ecosistema Moodle desacoplado y sus alianzas con centros globales de innovación.
            </p>
          </div>
        </div>
      </section>

      {/* Modelo Educativo */}
      <section className="bg-slate-100/70 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#22abe2]">
              Metodología Pedagógica
            </span>
            <h2 className="text-3xl font-black text-slate-900">
              El Modelo Educativo I²NICIA
            </h2>
            <p className="text-xs text-slate-600">
              Diseñado para conectar de inmediato el conocimiento teórico con las herramientas que usan las empresas de tecnología hoy.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map((p, i) => (
              <div 
                key={i} 
                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:shadow-[#22abe2]/10 hover:border-[#22abe2]/50 group"
              >
                <span className="w-9 h-9 rounded-xl bg-[#22abe2]/10 text-[#22abe2] group-hover:bg-[#22abe2] group-hover:text-white font-black text-xs flex items-center justify-center mb-4 transition-colors duration-200">
                  0{i + 1}
                </span>
                <h3 className="font-bold text-slate-900 text-sm mb-2 group-hover:text-[#22abe2] transition-colors">{p.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Autoridades Institucionales */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#22abe2]">
            Liderazgo Académico
          </span>
          <h2 className="text-3xl font-black text-slate-900">
            Autoridades y Claustro
          </h2>
          <p className="text-xs text-slate-500">
            Comprometidos con el rigor académico, la integridad institucional y el bienestar estudiantil.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {authorities.map((person, idx) => (
            <div 
              key={idx} 
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-[#22abe2]/10 hover:border-[#22abe2]/50 text-center space-y-4 group"
            >
              <div className="relative w-24 h-24 mx-auto">
                <SafeImage
                  src={person.avatar}
                  alt={person.name}
                  isAvatar={true}
                  className="w-24 h-24 rounded-2xl mx-auto object-cover ring-4 ring-[#22abe2]/20 group-hover:ring-[#22abe2] group-hover:scale-105 transition-all duration-300 shadow-md"
                />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-[#22abe2] transition-colors">{person.name}</h3>
                <p className="text-xs font-bold text-[#22abe2] mt-0.5">{person.role}</p>
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{person.degree}</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
                {person.bio}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
