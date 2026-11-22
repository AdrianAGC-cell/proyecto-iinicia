import React from 'react';
import { Award, ShieldAlert, BookOpen, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TerminosServicio: React.FC = () => {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold text-[#22abe2] hover:underline">
        <ArrowLeft className="w-4 h-4" />
        <span>Regresar al portal principal</span>
      </Link>

      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl space-y-8">
        <div className="border-b border-slate-100 pb-6 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-50 text-sky-700 rounded-full text-xs font-bold border border-sky-100">
            <Award className="w-4 h-4 text-[#22abe2]" />
            <span>Reglamento General de la Plataforma Digital Universitaria</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Términos y Condiciones de Servicio
          </h1>
          <p className="text-xs text-slate-500">
            Ciclo Académico 2026-2027 • Instituto de Innovación y Ciencias Aplicadas (I²NICIA)
          </p>
        </div>

        <section className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#22abe2]" />
            1. Objeto y Ámbito de Aplicación
          </h2>
          <p>
            Los presentes Términos y Condiciones regulan el acceso y uso de la plataforma digital del Instituto de Innovación y Ciencias Aplicadas (I²NICIA), la cual comprende el portal institucional web, los servicios backend de gestión, el sistema de gestión de aprendizaje Moodle LMS y la aplicación móvil oficial para Android.
          </p>
        </section>

        <section className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#22abe2]" />
            2. Uso de la Identidad Digital Institucional y SSO
          </h2>
          <p>
            El usuario (Aspirante, Estudiante, Profesor, Coordinador o Administrador) es titular de una única identidad digital. La contraseña y las credenciales son estrictamente personales e intransferibles. Queda prohibido compartir tokens de acceso, sesiones o intentar vulnerar los controles de autenticación o inscripción.
          </p>
        </section>

        <section className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-bold text-slate-900">
            3. Integridad Académica en Moodle y Aplicación Android
          </h2>
          <p>
            Todos los entregables, códigos fuente, cuestionarios y participaciones en foros deben reflejar la autoría genuina del estudiante. El uso de herramientas de Inteligencia Artificial generativa deberá citarse y utilizarse conforme a los lineamientos éticos de cada unidad curricular autorizados por el claustro docente.
          </p>
        </section>

        <section className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-bold text-slate-900">
            4. Disponibilidad y Mantenimiento de Servicios
          </h2>
          <p>
            I²NICIA garantiza esfuerzos comercial y técnicamente razonables para mantener el Campus Virtual disponible 24/7. Las ventanas de mantenimiento programado en servidores y contenedores Moodle/Docker serán notificadas previamente a través del portal y de las notificaciones push en la app móvil.
          </p>
        </section>
      </div>
    </div>
  );
};
