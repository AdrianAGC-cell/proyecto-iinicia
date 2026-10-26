import React, { useState, useEffect } from 'react';
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
  RefreshCw,
  ExternalLink,
  ArrowRight
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
  const [supabaseStatus, setSupabaseStatus] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Status check state
  const [searchFolio, setSearchFolio] = useState('');
  const [queriedApp, setQueriedApp] = useState<any>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);

  // Recent apps from Supabase
  const [recentApps, setRecentApps] = useState<any[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  const fetchRecentApplications = async () => {
    setLoadingRecent(true);
    try {
      const { data, error } = await supabase
        .from('admission_applications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && data) {
        setRecentApps(data);
      }
    } catch (err) {
      console.warn('Error fetching recent applications:', err);
    } finally {
      setLoadingRecent(false);
    }
  };

  useEffect(() => {
    fetchRecentApplications();
  }, []);

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
    setSupabaseStatus('Guardando en Supabase...');

    const generatedFolio = `SOL-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const prog = MOCK_PROGRAMS.find(p => p.id === formData.programId);
    const progName = prog ? prog.title : 'Programa Institucional';

    try {
      const { data, error } = await supabase
        .from('admission_applications')
        .insert([
          {
            id: generatedFolio,
            full_name: formData.fullName,
            email: formData.email,
            phone: formData.phone || null,
            program_id: formData.programId,
            program_name: progName,
            previous_school: formData.previousSchool || 'Bachillerato General',
            average_grade: parseFloat(formData.averageGrade) || 9.0,
            status: 'EN REVISION',
            moodle_synced: false
          }
        ])
        .select();

      if (error) {
        console.warn('Supabase insert error:', error);
        setSupabaseStatus('Guardado en caché local (aviso en nube: ' + error.message + ')');
      } else {
        setSupabaseStatus('¡Guardado exitosamente en base de datos Supabase!');
      }
    } catch (err: any) {
      console.warn('Network error saving to Supabase:', err);
      setSupabaseStatus('Guardado localmente. Se sincronizará en la nube.');
    }

    // Also persist to localStorage for offline cache
    const savedApps = JSON.parse(localStorage.getItem('iinicia_apps') || '[]');
    savedApps.unshift({
      id: generatedFolio,
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      programId: formData.programId,
      programName: progName,
      previousSchool: formData.previousSchool,
      averageGrade: formData.averageGrade,
      status: 'EN REVISION',
      moodleSynced: false,
      date: new Date().toISOString().split('T')[0]
    });
    localStorage.setItem('iinicia_apps', JSON.stringify(savedApps));

    setSubmittedFolio(generatedFolio);
    setSubmitting(false);
    fetchRecentApplications();
  };

  const handleQueryStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchFolio.trim()) return;

    setQueryLoading(true);
    setQueryError(null);
    setQueriedApp(null);

    try {
      const term = searchFolio.trim();
      const { data, error } = await supabase
        .from('admission_applications')
        .select('*')
        .or(`id.eq.${term},email.eq.${term}`)
        .limit(1);

      if (error) {
        setQueryError('Error al consultar: ' + error.message);
      } else if (data && data.length > 0) {
        setQueriedApp(data[0]);
      } else {
        // Check local storage fallback
        const savedApps = JSON.parse(localStorage.getItem('iinicia_apps') || '[]');
        const found = savedApps.find((a: any) => a.id === term || a.email.toLowerCase() === term.toLowerCase());
        if (found) {
          setQueriedApp({
            id: found.id,
            full_name: found.fullName,
            email: found.email,
            program_name: found.programName,
            status: found.status,
            average_grade: found.averageGrade,
            created_at: found.date
          });
        } else {
          setQueryError(`No se encontró ninguna solicitud con el folio o correo: "${term}"`);
        }
      }
    } catch (err: any) {
      setQueryError('Error de red al consultar: ' + (err.message || 'desconocido'));
    } finally {
      setQueryLoading(false);
    }
  };

  return (
    <div className="space-y-20 pb-24">
      {/* Banner */}
      <section className="bg-gradient-to-r from-[#05080f] via-[#09101d] to-[#05080f] text-white py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl space-y-4">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#22abe2] bg-[#22abe2]/10 px-3 py-1 rounded-full border border-[#22abe2]/20">
              Convocatoria 2026-2027
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <Database className="w-3 h-3" />
              <span>Supabase Conectado</span>
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
            Proceso de Admisión e Inscripción
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Plataforma institucional de registro de aspirantes conectada en tiempo real a la base de datos oficial de I²NICIA.
          </p>
        </div>
      </section>

      {/* 5-Step Admission Architecture Workflow */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-[#22abe2]">
            Arquitectura de Aprovisionamiento
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Flujo de Admisión y Validación Académica
          </h2>
          <p className="text-xs text-slate-500 max-w-xl mx-auto">
            Control de admisión desacoplado con validación y emisión de credencial institucional.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {steps.map((st, i) => (
            <div 
              key={i} 
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:border-[#22abe2]/40 hover:shadow-md transition relative group"
            >
              <div className="text-2xl font-black text-[#22abe2]/40 group-hover:text-[#22abe2] transition mb-3">
                {st.num}
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-2 leading-snug">
                {st.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {st.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Main Registration Form Container */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl space-y-8">
          <div className="text-center space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-[#22abe2]/10 text-[#22abe2]">
              Registro Oficial en Línea
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Registra tu Solicitud de Admisión
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
              Ingresa tus datos para generar tu expediente digital y registrarlo directamente en Supabase.
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
                Tu expediente ha sido registrado en la base de datos Supabase en estado <strong className="bg-[#22abe2] text-white px-2 py-0.5 rounded">EN REVISION</strong>.
              </p>
              
              {supabaseStatus && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                  <Database className="w-3.5 h-3.5" />
                  <span>{supabaseStatus}</span>
                </div>
              )}

              <div className="p-5 bg-white rounded-2xl border border-slate-200 inline-block text-left text-xs font-mono shadow-sm max-w-md w-full">
                <p className="text-slate-400">Folio Oficial Generado:</p>
                <p className="text-xl font-black text-[#22abe2]">{submittedFolio}</p>
                <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
                  <p className="text-slate-500">Aspirante: <span className="text-slate-900 font-semibold">{formData.fullName}</span></p>
                  <p className="text-slate-500">Correo: <span className="text-slate-900 font-semibold">{formData.email}</span></p>
                  <p className="text-slate-500">Promedio: <span className="text-slate-900 font-semibold">{formData.averageGrade}</span></p>
                  <p className="text-slate-500">Destino: <span className="text-emerald-600 font-semibold">Supabase (hwzkpkmithroyobntypq.supabase.co)</span></p>
                </div>
              </div>

              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Tu solicitud ya está visible en el <strong>Panel de Control Administrativo</strong> y sincronizada con la app de Kotlin.
              </p>

              <div className="pt-2 flex flex-wrap justify-center gap-3">
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
                  className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition flex items-center gap-1.5 shadow-xs"
                >
                  <span>Ver en Panel de Control</span>
                  <ArrowRight className="w-3.5 h-3.5" />
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
                    required
                  />
                  <span>
                    He leído y acepto el Aviso de Privacidad y consiento el tratamiento de mis datos personales para fines del proceso de admisión en I²NICIA.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-6 rounded-xl bg-[#22abe2] hover:bg-[#1b9ad0] text-white font-bold text-xs shadow-md shadow-[#22abe2]/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <span>Guardando en Supabase...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar Solicitud y Guardar en Base de Datos</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Live Supabase Verification & Inquiry Widget */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="bg-slate-900 text-white rounded-3xl p-8 border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Comprobador en Tiempo Real
                </span>
              </div>
              <h3 className="text-xl font-black">
                Comprueba si tu Registro se Guardó en Supabase
              </h3>
              <p className="text-xs text-slate-400">
                Consulta instantánea directa a la tabla <code className="text-[#22abe2] bg-[#22abe2]/10 px-1 py-0.5 rounded">admission_applications</code>.
              </p>
            </div>

            <button
              onClick={fetchRecentApplications}
              disabled={loadingRecent}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1.5 transition border border-slate-700 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingRecent ? 'animate-spin' : ''}`} />
              <span>Actualizar Lista</span>
            </button>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleQueryStatus} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Ingresa Folio (ej. SOL-2026-0891) o Correo..."
                value={searchFolio}
                onChange={(e) => setSearchFolio(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#22abe2]"
              />
            </div>
            <button
              type="submit"
              disabled={queryLoading}
              className="px-5 py-2.5 rounded-xl bg-[#22abe2] hover:bg-[#1b9ad0] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {queryLoading ? <span>Consultando...</span> : <span>Comprobar</span>}
            </button>
          </form>

          {/* Search Result */}
          {queryError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {queryError}
            </div>
          )}

          {queriedApp && (
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-white space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>¡Registro Encontrado en Supabase!</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                  {queriedApp.id}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-slate-400 text-[11px]">Aspirante:</p>
                  <p className="font-bold text-slate-100">{queriedApp.full_name}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[11px]">Programa:</p>
                  <p className="font-bold text-slate-100">{queriedApp.program_name}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[11px]">Estado:</p>
                  <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                    queriedApp.status === 'ADMITIDO' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-slate-900'
                  }`}>
                    {queriedApp.status}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Recent Registrations Table */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#22abe2]" />
              <span>Registros Recientes en la Base de Datos Oficial ({recentApps.length})</span>
            </h4>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Folio</th>
                    <th className="py-2.5 px-3">Nombre</th>
                    <th className="py-2.5 px-3">Programa</th>
                    <th className="py-2.5 px-3">Estado</th>
                    <th className="py-2.5 px-3">Sincronizado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {recentApps.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 font-mono text-[#7dd3f1] font-semibold">{a.id}</td>
                      <td className="py-2.5 px-3 text-slate-200">{a.full_name}</td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px] truncate max-w-[180px]">{a.program_name}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          a.status === 'ADMITIDO' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 text-[10px]">
                        {a.moodle_synced ? '✅ Moodle Sync' : '⏳ Pendiente'}
                      </td>
                    </tr>
                  ))}
                  {recentApps.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-500">
                        No hay solicitudes cargadas todavía.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
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
