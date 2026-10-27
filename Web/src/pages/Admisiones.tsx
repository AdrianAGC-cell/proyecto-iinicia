import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  Send, 
  FileText, 
  UserCheck, 
  Sparkles, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  GraduationCap, 
  ShieldCheck,
  Calendar,
  Database,
  Search,
  Loader2
} from 'lucide-react';
import { MOCK_PROGRAMS } from '../data/mockData';
import { supabase } from '../lib/supabase';

export const Admisiones: React.FC = () => {
  const [searchParams] = useSearchParams();
  const defaultProg = searchParams.get('program') || 'lic-ia-datos';

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    programId: defaultProg,
    previousSchool: '',
    averageGrade: '',
    acceptedTerms: true
  });

  const [submitting, setSubmitting] = useState(false);
  const [submittedFolio, setSubmittedFolio] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Live Supabase Lookup State
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupSearched, setLookupSearched] = useState(false);

  const steps = [
    {
      num: '01',
      title: 'Creación de Identidad I²NICIA',
      desc: 'El aspirante registra su correo y contraseña institucional. Se valida duplicidad y autenticidad sin otorgar acceso automático al LMS.'
    },
    {
      num: '02',
      title: 'Selección de Programa y Expediente',
      desc: 'Carga de documentación académica (certificado de bachillerato o licenciatura previa, identificación y promedio general).'
    },
    {
      num: '03',
      title: 'Dictamen y Autorización Académica',
      desc: 'El comité académico valida los requisitos y emite el dictamen de admisión oficial cambiando el estatus a admitido.'
    },
    {
      num: '04',
      title: 'Aprovisionamiento en Moodle LMS',
      desc: 'El backend I²NICIA crea o vincula idempotentemente la cuenta Moodle del alumno y la asigna a su cohorte oficial.'
    },
    {
      num: '05',
      title: 'Acceso a Campus Virtual (SSO)',
      desc: 'El estudiante visualiza sus materias autorizadas en Mi IINICIA e ingresa al LMS mediante Single Sign-On transparente.'
    }
  ];

  const faqs = [
    {
      q: '¿Qué validez oficial tienen los programas de I²NICIA?',
      a: 'Todos los programas cuentan con Reconocimiento de Validez Oficial de Estudios (RVOE) emitido por la Secretaría de Educación Pública (SEP Federal), lo que garantiza su legalidad y reconocimiento nacional e internacional.'
    },
    {
      q: '¿Cómo funciona la integración con Moodle LMS?',
      a: 'A diferencia de plataformas monolíticas de WordPress, nuestro backend Node.js se comunica directamente mediante APIs oficiales REST con Moodle. Al ser admitido, tu cuenta Moodle se sincroniza sin que tengas que gestionar una segunda clave.'
    },
    {
      q: '¿Cuáles son los requisitos de titulación?',
      a: 'Ofrecemos titulación directa por promedio de excelencia, examen general de egreso, proyecto integrador de innovación capstone o tesis guiada por investigadores del claustro.'
    },
    {
      q: '¿Existen becas disponibles para este ciclo?',
      a: 'Sí, contamos con Becas al Impulso Tecnológico del 40% al 60% para aspirantes con promedios superiores a 8.5 en su nivel de estudios previo.'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const generatedFolio = `SOL-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const prog = MOCK_PROGRAMS.find(p => p.id === formData.programId);
    const progTitle = prog ? prog.title : 'Programa Académico';

    try {
      await supabase.from('admission_applications').insert([
        {
          id: generatedFolio,
          full_name: formData.fullName,
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone || null,
          program_id: formData.programId,
          program_name: progTitle,
          previous_school: formData.previousSchool || 'Bachillerato General',
          average_grade: parseFloat(formData.averageGrade) || 9.0,
          status: 'EN REVISION',
          moodle_synced: false
        }
      ]);
    } catch (err) {
      console.warn('Could not insert application into Supabase:', err);
    }

    const savedApps = JSON.parse(localStorage.getItem('iinicia_apps') || '[]');
    savedApps.unshift({
      id: generatedFolio,
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      programId: formData.programId,
      programName: progTitle,
      previousSchool: formData.previousSchool,
      averageGrade: formData.averageGrade,
      status: 'EN REVISION',
      moodleSynced: false,
      date: new Date().toISOString().split('T')[0]
    });
    localStorage.setItem('iinicia_apps', JSON.stringify(savedApps));

    setSubmittedFolio(generatedFolio);
    setSubmitting(false);
  };

  const handleLookupSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupQuery.trim()) return;
    setLookupLoading(true);
    setLookupSearched(true);
    setLookupResult(null);

    try {
      const q = lookupQuery.trim();
      const { data, error } = await supabase
        .from('admission_applications')
        .select('*')
        .or(`id.eq.${q},email.ilike.${q}`)
        .maybeSingle();

      if (data && !error) {
        setLookupResult(data);
      }
    } catch (err) {
      console.warn('Lookup error:', err);
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div className="space-y-20 pb-24">
      {/* Banner */}
      <section className="bg-gradient-to-r from-[#05080f] via-[#09101d] to-[#05080f] text-white py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#22abe2] bg-[#22abe2]/10 px-3 py-1 rounded-full border border-[#22abe2]/20">
            Convocatoria 2026-2027
          </span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
            Proceso de Admisión e Inscripción
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Sigue los pasos institucionales para incorporarte a nuestra comunidad. Un proceso 100% digital, transparente y automatizado.
          </p>
        </div>
      </section>

      {/* 5-Step Admission Architecture Flow */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#22abe2]">
            Lineamientos de Admisión
          </span>
          <h2 className="text-3xl font-black text-slate-900">
            Flujo Oficial del Aspirante a Estudiante
          </h2>
          <p className="text-xs text-slate-500">
            Separación de identidad y autorización académica conforme a la arquitectura institucional.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {steps.map((st, i) => (
            <div
              key={i}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative flex flex-col justify-between card-hover-effect group"
            >
              <div>
                <span className="w-9 h-9 rounded-xl bg-[#22abe2]/10 text-[#22abe2] group-hover:bg-[#22abe2] group-hover:text-white transition-colors duration-200 font-black text-sm flex items-center justify-center mb-3">
                  {st.num}
                </span>
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm mb-2 group-hover:text-[#22abe2] transition-colors">{st.title}</h3>
                <p className="text-[11px] text-slate-600 leading-relaxed">{st.desc}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[10px] text-[#22abe2] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#22abe2] shrink-0" />
                <span>Paso {i + 1} de 5</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Application Form */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#22abe2] bg-[#22abe2]/10 px-3 py-1 rounded-full border border-[#22abe2]/20">
              Formulario Oficial de Solicitud
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Registra tu Solicitud de Admisión
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
              Ingresa tus datos verídicos para generar tu expediente digital y folio oficial único.
            </p>
          </div>

          {submittedFolio ? (
            <div className="bg-[#22abe2]/10 border border-[#22abe2]/30 rounded-3xl p-8 text-center space-y-4 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-[#22abe2]/20 text-[#22abe2] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900">
                ¡Solicitud Registrada con Éxito!
              </h3>
              <p className="text-xs text-slate-700">
                Tu expediente ha sido recibido y se encuentra en estado <strong className="bg-[#22abe2] text-white px-2 py-0.5 rounded">EN REVISIÓN</strong>.
              </p>
              <div className="p-4 bg-white rounded-2xl border border-slate-200 inline-block text-left text-xs font-mono shadow-xs">
                <p className="text-slate-400">Folio de Aspirante:</p>
                <p className="text-lg font-bold text-[#22abe2]">{submittedFolio}</p>
                <p className="text-slate-500 mt-1">Aspirante: <span className="text-slate-900 font-semibold">{formData.fullName}</span></p>
                <p className="text-slate-500">Correo: <span className="text-slate-900 font-semibold">{formData.email}</span></p>
              </div>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Un asesor académico evaluará tu promedio ({formData.averageGrade}) y te notificará por correo. También puedes ver esta solicitud reflejada en el Panel de Administración.
              </p>
              <div className="pt-2 flex justify-center gap-4">
                <button
                  onClick={() => {
                    setSubmittedFolio(null);
                    setFormData({
                      fullName: '',
                      email: '',
                      phone: '',
                      programId: 'lic-ia-datos',
                      previousSchool: '',
                      averageGrade: '',
                      acceptedTerms: true
                    });
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#22abe2] text-white text-xs font-bold hover:bg-[#1b9ad0] transition shadow-xs cursor-pointer"
                >
                  Registrar otra solicitud
                </button>
                <Link
                  to="/admin"
                  className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition flex items-center gap-1.5"
                >
                  <span>Ver en Panel de Control</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Mariana Ríos Cruz"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#22abe2] text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="ej. mariana.rios@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#22abe2] text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Teléfono Móvil (WhatsApp) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="ej. +52 55 4892 1102"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#22abe2] text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Programa Académico de Interés *
                  </label>
                  <select
                    value={formData.programId}
                    onChange={(e) => setFormData({ ...formData, programId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#22abe2] text-xs"
                  >
                    {MOCK_PROGRAMS.map((prog) => (
                      <option key={prog.id} value={prog.id}>
                        {prog.title} ({prog.degree})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Institución de Procedencia
                  </label>
                  <input
                    type="text"
                    placeholder="ej. Preparatoria Oficial / CCH"
                    value={formData.previousSchool}
                    onChange={(e) => setFormData({ ...formData, previousSchool: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#22abe2] text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Promedio General Anterior *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="6.0"
                    max="10.0"
                    required
                    placeholder="ej. 9.4"
                    value={formData.averageGrade}
                    onChange={(e) => setFormData({ ...formData, averageGrade: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#22abe2] text-xs"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.acceptedTerms}
                    onChange={(e) => setFormData({ ...formData, acceptedTerms: e.target.checked })}
                    className="mt-0.5 rounded text-[#22abe2] focus:ring-[#22abe2]"
                  />
                  <span>
                    He leído y acepto el <strong>Aviso de Privacidad</strong> para el tratamiento de datos académicos e identidad única I²NICIA.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-6 rounded-xl bg-[#22abe2] hover:bg-[#1b9ad0] text-white font-bold text-xs shadow-md shadow-[#22abe2]/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <span>Registrando expediente...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar Solicitud de Admisión Oficial</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Live Supabase Application Verifier */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-50 text-sky-700 rounded-full text-xs font-semibold mb-2">
                <Database className="w-3.5 h-3.5 text-[#22abe2]" />
                <span>Base de Datos Oficial Supabase</span>
              </div>
              <h3 className="text-xl font-black text-slate-900">
                Comprueba si tu Registro se Guardó en Supabase
              </h3>
              <p className="text-xs text-slate-500">
                Ingresa tu Folio Oficial (ej. SOL-2026-9040) o tu correo para consultar tu estatus en vivo.
              </p>
            </div>
          </div>

          <form onSubmit={handleLookupSupabase} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Ingresa Folio (SOL-2026-...) o tu correo electrónico"
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#22abe2] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={lookupLoading}
              className="px-6 py-2.5 rounded-xl bg-[#22abe2] hover:bg-[#1b9ad0] text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {lookupLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Buscando en BD...</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  <span>Consultar en Supabase</span>
                </>
              )}
            </button>
          </form>

          {lookupSearched && (
            <div className="pt-2">
              {lookupResult ? (
                <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ¡Registro localizado exitosamente en Supabase!
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {lookupResult.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-slate-700">
                    <div>
                      <p className="text-[10px] text-slate-400">Folio</p>
                      <p className="font-mono font-bold text-slate-900">{lookupResult.id}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Aspirante</p>
                      <p className="font-semibold text-slate-900">{lookupResult.full_name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Programa</p>
                      <p className="font-semibold text-slate-900 truncate">{lookupResult.program_name}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800">
                  No se encontró ningún expediente con ese folio o correo en la base de datos de Supabase. Asegúrate de haber completado y enviado el formulario arriba.
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* FAQs Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-black text-slate-900">Preguntas Frecuentes de Admisión</h3>
          <p className="text-xs text-slate-500">Respuestas rápidas sobre trámites, convalidación y acceso al campus.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-[#22abe2]/40 transition">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-4 text-left font-bold text-slate-900 text-xs sm:text-sm flex items-center justify-between hover:bg-slate-50 transition"
              >
                <span>{faq.q}</span>
                {openFaq === idx ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {openFaq === idx && (
                <div className="p-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
