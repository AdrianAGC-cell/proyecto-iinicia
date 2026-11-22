import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, CheckCircle2, ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';

export const RecuperarPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulación de envío de token de restablecimiento conforme a SSO OIDC
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1000);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">
          <div className="text-center space-y-3">
            <Link to="/" className="inline-block">
              <img
                src="/logo-iinicia.png"
                alt="I²NICIA"
                className="h-16 w-auto mx-auto object-contain"
              />
            </Link>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Recuperar Contraseña
            </h2>
            <p className="text-xs text-slate-500">
              Ingresa tu correo institucional o de registro para recibir un enlace seguro de restablecimiento de tu identidad I²NICIA.
            </p>
          </div>

          {submitted ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3 animate-fadeIn">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-sm font-bold text-emerald-900">Enlace de Seguridad Enviado</h3>
              <p className="text-xs text-emerald-700 leading-relaxed">
                Hemos enviado instrucciones de recuperación a <strong className="text-emerald-900">{email}</strong>. El enlace tiene una vigencia de 15 minutos de acuerdo con las políticas de seguridad OIDC.
              </p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#22abe2] hover:underline"
                >
                  <span>Volver al inicio de sesión</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Correo Electrónico Institucional *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="ej. valeria.morales@iinicia.edu.mx"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#22abe2] focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#22abe2] shrink-0 mt-0.5" />
                <span>Al cambiar tu contraseña, se actualizará automáticamente tu acceso al Portal Web, Campus Virtual Moodle y la App Android (SSO Unificado).</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#22abe2] hover:bg-[#1b9ad0] text-white font-bold text-xs uppercase tracking-wider transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enviando enlace seguro...</span>
                  </>
                ) : (
                  <>
                    <span>Enviar enlace de restablecimiento</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <Link to="/login" className="text-xs text-slate-500 hover:text-slate-800 transition inline-flex items-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Cancelar y regresar al login</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
