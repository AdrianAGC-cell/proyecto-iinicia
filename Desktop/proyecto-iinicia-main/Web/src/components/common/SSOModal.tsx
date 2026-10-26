import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Server, X, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const SSOModal: React.FC = () => {
  const { ssoModalOpen, closeSSOModal, user, ssoCourseTarget } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [ticketId, setTicketId] = useState('');

  useEffect(() => {
    if (ssoModalOpen) {
      setStep(1);
      const generatedTicket = 'OIDC-TKT-' + Math.random().toString(36).substring(2, 9).toUpperCase();
      setTicketId(generatedTicket);

      const t1 = setTimeout(() => setStep(2), 700);
      const t2 = setTimeout(() => setStep(3), 1400);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [ssoModalOpen]);

  if (!ssoModalOpen) return null;

  const handleEnterCampus = () => {
    closeSSOModal();
    navigate('/moodle-preview', { state: { courseId: ssoCourseTarget } });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
        {/* Header with IINICIA Black & Cyan Accent */}
        <div className="bg-[#05080f] p-6 text-white relative border-b border-slate-800">
          <button
            onClick={closeSSOModal}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#22abe2]/20 border border-[#22abe2]/40 rounded-xl">
              <ShieldCheck className="w-7 h-7 text-[#22abe2]" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-widest uppercase text-[#22abe2]">
                Single Sign-On Institucional
              </span>
              <h3 className="text-xl font-black">Conectando con Moodle LMS</h3>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          <p className="text-xs text-slate-600">
            Transfiriendo tu sesión segura desde <strong className="text-slate-900">Portal I²NICIA</strong> hacia el entorno académico <strong className="text-slate-900">aula.iinicia.org</strong> sin solicitar una segunda contraseña.
          </p>

          {/* Stepper details */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 font-mono text-xs">
            {/* Step 1 */}
            <div className="flex items-center gap-3">
              {step >= 1 ? (
                <CheckCircle2 className="w-4 h-4 text-[#22abe2] shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
              )}
              <div className="flex-1 flex justify-between">
                <span className="text-slate-700">Verificando OIDC / OAuth 2.0:</span>
                <span className="font-semibold text-slate-900">{user?.email || 'estudiante@iinicia.edu.mx'}</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-center gap-3">
              {step >= 2 ? (
                <CheckCircle2 className="w-4 h-4 text-[#22abe2] shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
              )}
              <div className="flex-1 flex justify-between">
                <span className="text-slate-700">Ticket SSO generado:</span>
                <span className="font-semibold text-[#148ebf]">{step >= 2 ? ticketId : 'Generando...'}</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-center gap-3">
              {step >= 3 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
              )}
              <div className="flex-1 flex justify-between">
                <span className="text-slate-700">Mapeo de Rol Moodle:</span>
                <span className="font-semibold text-emerald-700">{step >= 3 ? `student (ID #${user?.moodleId || 1042})` : 'Mapeando...'}</span>
              </div>
            </div>
          </div>

          {/* Destination Notice */}
          <div className="p-3.5 bg-[#22abe2]/10 rounded-2xl border border-[#22abe2]/20 flex items-start gap-3">
            <Server className="w-5 h-5 text-[#22abe2] shrink-0 mt-0.5" />
            <div className="text-xs text-slate-800">
              <span className="font-semibold">Destino Académico:</span> Campus Virtual I²NICIA con tema personalizado Moodle.
              {ssoCourseTarget && (
                <p className="mt-1 text-[#148ebf] font-semibold">Redirigiendo directamente al curso #{ssoCourseTarget}.</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={closeSSOModal}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleEnterCampus}
              disabled={step < 3}
              className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-md flex items-center gap-2 transition ${
                step >= 3
                  ? 'bg-[#22abe2] hover:bg-[#1b9ad0] cursor-pointer shadow-[#22abe2]/25'
                  : 'bg-slate-400 cursor-not-allowed opacity-70'
              }`}
            >
              <span>{step < 3 ? 'Sincronizando...' : 'Entrar a Mi Campus Virtual'}</span>
              {step >= 3 && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
