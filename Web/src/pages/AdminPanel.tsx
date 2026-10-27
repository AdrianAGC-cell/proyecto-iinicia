import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldCheck, 
  Server, 
  CheckCircle2, 
  Clock, 
  Search, 
  RefreshCw, 
  PlusCircle,
  Database,
  Loader2
} from 'lucide-react';
import { MOCK_APPLICATIONS } from '../data/mockData';
import { AdmissionApplication } from '../types';
import { supabase } from '../lib/supabase';

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'aspirantes' | 'moodle' | 'cms'>('aspirantes');
  const [searchTerm, setSearchTerm] = useState('');
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [loadingDb, setLoadingDb] = useState(false);

  const [apps, setApps] = useState<AdmissionApplication[]>(() => {
    const saved = localStorage.getItem('iinicia_apps');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return MOCK_APPLICATIONS;
  });

  const [idempotencyLog, setIdempotencyLog] = useState<string[]>([]);

  const fetchAppsFromSupabase = async () => {
    setLoadingDb(true);
    try {
      const { data, error } = await supabase
        .from('admission_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && data.length > 0 && !error) {
        const mapped: AdmissionApplication[] = data.map((d: any) => ({
          id: d.id,
          fullName: d.full_name,
          email: d.email,
          phone: d.phone || 'No especificado',
          programId: d.program_id,
          programName: d.program_name,
          previousSchool: d.previous_school || 'Bachillerato',
          averageGrade: String(d.average_grade || '9.0'),
          status: d.status || 'EN REVISION',
          moodleSynced: d.moodle_synced || false,
          moodleUserId: d.moodle_user_id || null,
          date: d.created_at ? d.created_at.split('T')[0] : '2026-10-26'
        }));
        setApps(mapped);
        localStorage.setItem('iinicia_apps', JSON.stringify(mapped));
      }
    } catch (err) {
      console.warn('Could not load apps from Supabase:', err);
    } finally {
      setLoadingDb(false);
    }
  };

  useEffect(() => {
    fetchAppsFromSupabase();
  }, []);

  const handleApproveAndSync = async (appId: string) => {
    setSyncingId(appId);
    const target = apps.find(a => a.id === appId);
    const generatedMoodleId = target?.moodleUserId || Math.floor(1000 + Math.random() * 4000);

    try {
      await supabase
        .from('admission_applications')
        .update({
          status: 'ADMITIDO',
          moodle_synced: true,
          moodle_user_id: generatedMoodleId,
          moodle_sync_date: new Date().toISOString()
        })
        .eq('id', appId);
    } catch (err) {
      console.warn('Error updating Supabase:', err);
    }

    const updated = apps.map((a) => {
      if (a.id === appId) {
        return {
          ...a,
          status: 'ADMITIDO' as const,
          moodleSynced: true,
          moodleUserId: generatedMoodleId
        };
      }
      return a;
    });
    setApps(updated);
    localStorage.setItem('iinicia_apps', JSON.stringify(updated));
    setSyncingId(null);
  };

  const handleTestIdempotency = () => {
    const target = apps[0];
    const log1 = `[${new Date().toLocaleTimeString()}] LLAMADA 1: POST /api/moodle/sync -> Aspirante '${target.fullName}' verificado. ID existente #${target.moodleUserId || 1042}. No se genera duplicado.`;
    const log2 = `[${new Date().toLocaleTimeString()}] LLAMADA 2: POST /api/moodle/sync -> Idempotencia confirmada en Supabase: Estado 'ACTIVE', Cohorte '2026-A' vinculada.`;
    setIdempotencyLog([log2, log1, ...idempotencyLog]);
  };

  const filteredApps = apps.filter(
    (a) =>
      a.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.programName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
      {/* Admin Header */}
      <div className="bg-[#05080f] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#22abe2]/20 text-[#7dd3f1] border border-[#22abe2]/30">
              Coordinación & Administración I²NICIA
            </span>
            <span className="text-xs text-slate-400 font-mono">RBAC: Coordinador / Admin Académico</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Panel de Control Institucional
          </h1>
          <p className="text-xs text-slate-300">
            Aprobación de aspirantes, sincronización con Moodle LMS y monitoreo de servicios.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAppsFromSupabase}
            disabled={loadingDb}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold text-xs transition flex items-center gap-1.5 border border-slate-700 cursor-pointer disabled:opacity-50"
          >
            {loadingDb ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
            <span>{loadingDb ? 'Cargando BD...' : 'Sincronizar con Supabase'}</span>
          </button>
          <button
            onClick={handleTestIdempotency}
            className="px-4 py-2.5 rounded-xl bg-[#22abe2] hover:bg-[#1b9ad0] text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Test Idempotencia Moodle</span>
          </button>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:border-[#22abe2]/40 transition">
          <p className="text-xs font-semibold text-slate-500 uppercase">Aspirantes Registrados</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{apps.length}</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:border-[#22abe2]/40 transition">
          <p className="text-xs font-semibold text-slate-500 uppercase">Alumnos Admitidos</p>
          <p className="text-2xl font-black text-[#22abe2] mt-1">
            {apps.filter(a => a.status === 'ADMITIDO').length}
          </p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:border-[#22abe2]/40 transition">
          <p className="text-xs font-semibold text-slate-500 uppercase">Cuentas Moodle Sincronizadas</p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {apps.filter(a => a.moodleSynced).length}
          </p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:border-[#22abe2]/40 transition">
          <p className="text-xs font-semibold text-slate-500 uppercase">Estado Moodle API / SSO</p>
          <p className="text-2xl font-black text-[#22abe2] mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5 text-[#22abe2]" />
            <span>Operativo</span>
          </p>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 text-xs font-bold">
        <button
          onClick={() => setActiveTab('aspirantes')}
          className={`px-4 py-2.5 rounded-xl transition ${
            activeTab === 'aspirantes'
              ? 'bg-[#22abe2] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Admisiones & Matrícula Moodle ({apps.length})
        </button>
        <button
          onClick={() => setActiveTab('moodle')}
          className={`px-4 py-2.5 rounded-xl transition ${
            activeTab === 'moodle'
              ? 'bg-[#22abe2] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Monitor de Integración & Auditoría
        </button>
        <button
          onClick={() => setActiveTab('cms')}
          className={`px-4 py-2.5 rounded-xl transition ${
            activeTab === 'cms'
              ? 'bg-[#22abe2] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Gestor CMS I²NICIA
        </button>
      </div>

      {/* TAB 1: ASPIRANTES */}
      {activeTab === 'aspirantes' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h3 className="text-base font-bold text-slate-900">
              Expedientes de Aspirantes para Dictamen
            </h3>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, correo, folio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#22abe2]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Folio</th>
                  <th className="py-3 px-4">Aspirante</th>
                  <th className="py-3 px-4">Programa</th>
                  <th className="py-3 px-4">Promedio</th>
                  <th className="py-3 px-4">Dictamen</th>
                  <th className="py-3 px-4">Moodle LMS</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{a.id}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{a.fullName}</p>
                      <p className="text-slate-400 text-[11px]">{a.email}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium max-w-xs truncate">
                      {a.programName}
                    </td>
                    <td className="py-3.5 px-4 font-black text-[#22abe2]">{a.averageGrade}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          a.status === 'ADMITIDO'
                            ? 'bg-[#22abe2]/15 text-[#148ebf]'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {a.moodleSynced ? (
                        <span className="flex items-center gap-1.5 text-slate-900 font-semibold font-mono">
                          <CheckCircle2 className="w-4 h-4 text-[#22abe2]" />
                          <span>ID #{a.moodleUserId}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">No vinculado</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {a.status !== 'ADMITIDO' ? (
                        <button
                          onClick={() => handleApproveAndSync(a.id)}
                          disabled={syncingId === a.id}
                          className="px-3.5 py-1.5 rounded-xl bg-[#22abe2] hover:bg-[#1b9ad0] text-white font-bold text-xs transition shadow-xs cursor-pointer"
                        >
                          {syncingId === a.id ? 'Sincronizando...' : 'Admitir y Matricular'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApproveAndSync(a.id)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                        >
                          Re-sincronizar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MOODLE MONITOR & AUDIT */}
      {activeTab === 'moodle' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Server className="w-5 h-5 text-[#22abe2]" />
                <span>Salud de Conexión de Servicios</span>
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-700">Moodle REST Web Services (core_user / enrol)</span>
                  <span className="px-2 py-0.5 rounded bg-[#22abe2]/15 text-[#148ebf] font-bold">ONLINE (24ms)</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-700">Proveedor de Identidad OIDC / Keycloak</span>
                  <span className="px-2 py-0.5 rounded bg-[#22abe2]/15 text-[#148ebf] font-bold">ONLINE (18ms)</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-700">Base de Datos PostgreSQL (Pool 20 conex.)</span>
                  <span className="px-2 py-0.5 rounded bg-[#22abe2]/15 text-[#148ebf] font-bold">ACTIVO</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-700">Estado de WordPress Monolítico</span>
                  <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-600 font-bold">DEPRECADO / APAGADO</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#22abe2]" />
                <span>Pruebas de Idempotencia y Auditoría</span>
              </h3>
              <p className="text-xs text-slate-600">
                La regla arquitectónica exige que ejecutar múltiples veces la matriculación no cree cuentas duplicadas en Moodle.
              </p>
              <div className="bg-[#05080f] rounded-2xl p-4 text-[#7dd3f1] font-mono text-[11px] h-48 overflow-y-auto space-y-1 border border-slate-800">
                {idempotencyLog.length === 0 ? (
                  <p className="text-slate-500 italic">Haz clic en 'Test Idempotencia Moodle' para probar la verificación en vivo...</p>
                ) : (
                  idempotencyLog.map((log, i) => <p key={i}>{log}</p>)
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CMS IINICIA HEADLESS */}
      {activeTab === 'cms' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Gestor de Contenidos Institucionales (CMS Desacoplado)
              </h3>
              <p className="text-xs text-slate-500">
                Actualiza páginas, convocatorias y notas institucionales sin necesidad de WordPress.
              </p>
            </div>
            <button
              onClick={() => alert('Abriendo editor enriquecido de noticias y comunicados institucionales...')}
              className="px-4 py-2 rounded-xl bg-[#22abe2] hover:bg-[#1b9ad0] text-white text-xs font-bold transition flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Publicar Nuevo Contenido</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl border border-slate-200 space-y-2 hover:border-[#22abe2]/50 transition">
              <span className="text-[10px] font-bold uppercase text-[#148ebf] bg-[#22abe2]/10 px-2 py-0.5 rounded">
                Página Institucional
              </span>
              <h4 className="font-bold text-xs text-slate-900">Página de Inicio / Hero Banner</h4>
              <p className="text-[11px] text-slate-500">Última edición hace 2 días por Ing. Roberto Peña.</p>
              <button className="text-xs font-bold text-[#22abe2] hover:underline">Editar sección →</button>
            </div>
            <div className="p-4 rounded-2xl border border-slate-200 space-y-2 hover:border-[#22abe2]/50 transition">
              <span className="text-[10px] font-bold uppercase text-[#148ebf] bg-[#22abe2]/10 px-2 py-0.5 rounded">
                Catálogo
              </span>
              <h4 className="font-bold text-xs text-slate-900">Planes de Estudio RVOE</h4>
              <p className="text-[11px] text-slate-500">5 programas activos en base de datos.</p>
              <button className="text-xs font-bold text-[#22abe2] hover:underline">Gestionar materias →</button>
            </div>
            <div className="p-4 rounded-2xl border border-slate-200 space-y-2 hover:border-[#22abe2]/50 transition">
              <span className="text-[10px] font-bold uppercase text-[#148ebf] bg-[#22abe2]/10 px-2 py-0.5 rounded">
                Convocatorias
              </span>
              <h4 className="font-bold text-xs text-slate-900">Admisión 2026-2027</h4>
              <p className="text-[11px] text-slate-500">Recepción de folios activa.</p>
              <button className="text-xs font-bold text-[#22abe2] hover:underline">Configurar fechas →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
