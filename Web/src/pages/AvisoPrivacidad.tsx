import React from 'react';
import { ShieldCheck, Lock, FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AvisoPrivacidad: React.FC = () => {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold text-[#22abe2] hover:underline">
        <ArrowLeft className="w-4 h-4" />
        <span>Regresar al portal principal</span>
      </Link>

      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl space-y-8">
        <div className="border-b border-slate-100 pb-6 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-50 text-sky-700 rounded-full text-xs font-bold border border-sky-100">
            <ShieldCheck className="w-4 h-4 text-[#22abe2]" />
            <span>Cumplimiento LFPDPPP • Protección de Datos Personales</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Aviso de Privacidad Integral
          </h1>
          <p className="text-xs text-slate-500">
            Última actualización: Noviembre de 2026 • Instituto de Innovación y Ciencias Aplicadas (I²NICIA)
          </p>
        </div>

        <section className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#22abe2]" />
            1. Identidad y Domicilio del Responsable
          </h2>
          <p>
            El Instituto de Innovación y Ciencias Aplicadas (I²NICIA), con domicilio legal en el Distrito de Innovación Tecnológica y portal web oficial <strong className="text-slate-900">https://iinicia.edu.mx</strong>, es responsable del tratamiento y salvaguarda de sus datos personales de conformidad con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).
          </p>
        </section>

        <section className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#22abe2]" />
            2. Datos Personales Recabados
          </h2>
          <p>Para cumplir con los procesos de admisión, matrícula escolar y acceso a nuestro ecosistema digital (Portal Web, Backend Express, Moodle LMS y Aplicación Android), recabamos:</p>
          <ul className="list-disc pl-6 space-y-1.5 text-xs text-slate-600">
            <li><strong>Identificación y contacto:</strong> Nombre completo, correo electrónico institucional, teléfono, matrícula oficial y fotografía de credencial.</li>
            <li><strong>Académicos y escolares:</strong> Historial educativo previo, promedio, dictamen de admisión, asignaturas inscritas, calificaciones y entregables en Moodle.</li>
            <li><strong>Técnicos de seguridad:</strong> Dirección IP, tokens JWT encriptados, identificadores de sesión de usuario y registros de auditoría de acceso al campus.</li>
          </ul>
        </section>

        <section className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-bold text-slate-900">
            3. Finalidades Primarias del Tratamiento
          </h2>
          <p>Los datos personales recabados se utilizarán estrictamente para:</p>
          <ul className="list-disc pl-6 space-y-1.5 text-xs text-slate-600">
            <li>Gestión de solicitudes de admisión y emisión de matrícula oficial ante la Secretaría de Educación Pública (SEP / RVOE).</li>
            <li>Aprovisionamiento automatizado de cuentas en el Campus Virtual Moodle LMS y autenticación mediante Single Sign-On (SSO).</li>
            <li>Seguimiento académico, emisión de constancias, boletas oficiales de calificaciones y credencial digital universitaria.</li>
            <li>Sincronización de avance académico con la aplicación móvil nativa Android para estudiantes de I²NICIA.</li>
          </ul>
        </section>

        <section className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-bold text-slate-900">
            4. Derechos ARCO y Mecanismos de Ejercicio
          </h2>
          <p>
            Usted tiene derecho a conocer qué datos tenemos de usted, para qué los usamos y las condiciones del uso que les damos (Acceso). Asimismo, es su derecho solicitar la corrección de su información (Rectificación), que la eliminemos de nuestros registros cuando considere que no está siendo utilizada adecuadamente (Cancelación), así como oponerse al uso de sus datos para fines específicos (Oposición).
          </p>
          <p className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            Para ejercer sus derechos ARCO, envíe una solicitud firmada a la Unidad de Privacidad y Seguridad Digital: <strong className="text-slate-900">privacidad@iinicia.edu.mx</strong>.
          </p>
        </section>
      </div>
    </div>
  );
};
