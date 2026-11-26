import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Mail, User, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { rutaPorRol } from '../security/roles';
import { useAuth } from '../context/AuthContext';
import { MOCK_PROGRAMS } from '../data/mockData';

export const Registro: React.FC = () => {
  const [params] = useSearchParams();
  const recuperarOtp = params.get('verificar') === 'true';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [programId, setProgramId] = useState('lic-ia-datos');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState(recuperarOtp);
  const [needsConfirmation, setNeedsConfirmation] = useState(recuperarOtp);

  const [otp, setOtp] = useState('');
  const [notice, setNotice] = useState('');
  const [resendUntil, setResendUntil] = useState(0);
  const { register, loginWithGoogle, verifyEmailOtp, resendEmailOtp } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!agreeTerms) {
      setErrorMsg('Debes aceptar los terminos institucionales.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setLoading(true);
    const res = await register(name, email, password, programId);
    setLoading(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Error al procesar el registro. Inténtalo nuevamente.');
      return;
    }

    if (res.needsEmailConfirmation) {
      setPassword('');
      setResendUntil(Date.now() + 60000);
      setNeedsConfirmation(true);
      setRegisteredSuccess(true);
    } else {
      navigate('/admisiones?registered=true&program=' + programId);
    }
  };

  const handleGoogleRegister = async () => {
    setErrorMsg(null);

    if (!agreeTerms) {
      setErrorMsg('Debes aceptar los terminos institucionales antes de continuar con Google.');
      return;
    }
    const res = await loginWithGoogle();
    if (!res.success && res.error) {
      setErrorMsg(res.error);
    }
  };


  const confirmarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setNotice('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Ingresa un correo electronico valido.');
      return;
    }

    setLoading(true);

    try {
      const res = await verifyEmailOtp(email, otp);

      if (!res.success) {
        setErrorMsg(res.error || 'No se pudo verificar el correo.');
        return;
      }

      navigate(rutaPorRol(res.role || 'aspirante'), {
        replace: true
      });
    } finally {
      setLoading(false);
    }
  };

  const reenviarCodigo = async () => {
    setErrorMsg(null);
    setNotice('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Ingresa un correo electronico valido.');
      return;
    }


    if (Date.now() < resendUntil) {
      setErrorMsg('Espera al menos 60 segundos entre solicitudes.');
      return;
    }

    setLoading(true);

    try {
      const res = await resendEmailOtp(email);

      if (!res.success) {
        setErrorMsg(res.error || 'No se pudo reenviar el correo.');
        return;
      }

      setResendUntil(Date.now() + 60000);
      setOtp('');
      setNotice('Solicitud de reenvio aceptada. Revisa tu correo y spam.');
    } finally {
      setLoading(false);
    }
  };

  if (registeredSuccess && needsConfirmation) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">

          <img
            src="/logo-iinicia.png"
            alt="IINICIA"
            className="h-16 w-auto mx-auto"
          />

          <h2 className="text-xl font-black text-center text-slate-900">
            Verificacion de correo
          </h2>

          <div className="bg-sky-50 border border-sky-100 rounded-2xl p-5 text-center space-y-3">
            <Mail className="w-10 h-10 mx-auto text-[#22abe2]" />
            <p className="text-sm font-bold">Revisa tu bandeja de entrada</p>
            <p className="text-xs text-slate-600">
              Solicitamos el codigo de confirmacion para:
            </p>
            <input
              type="email"
              aria-label="Correo electronico"
              autoComplete="email"
              value={email}
              readOnly={!recuperarOtp}
              disabled={loading}
              onChange={e => {
                setEmail(e.target.value);
                setOtp('');
                setNotice('');
              }}
              placeholder="correo@gmail.com"
              className="w-full p-3 text-center text-sm rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#22abe2] focus:outline-none"
            />
            <p className="text-xs text-slate-500">
              Revisa tambien spam. Puedes utilizar el enlace incluido en el correo.
            </p>
          </div>

          {errorMsg && (
            <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </div>
          )}

          {notice && (
            <div role="status" className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {notice}
            </div>
          )}

          <form noValidate onSubmit={confirmarCodigo} className="space-y-4">
            <label className="block text-xs font-bold text-slate-700 text-center">
              CODIGO DE VERIFICACION
            </label>

            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="123456"
              className="w-full p-4 text-center text-xl tracking-widest rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#22abe2] focus:outline-none"
            />

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-3 rounded-xl bg-[#22abe2] text-white font-bold text-sm disabled:opacity-50"
            >
              {loading ? 'Procesando...' : 'Confirmar y entrar'}
            </button>
          </form>

          <button
            type="button"
            onClick={reenviarCodigo}
            disabled={loading}
            className="w-full text-sm font-bold text-[#22abe2] disabled:opacity-50"
          >
            Reenviar codigo
          </button>

          <Link
            to="/login"
            className="block text-center text-xs text-slate-500"
          >
            Volver a iniciar sesion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
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
              Crear Identidad I²NICIA
            </h2>
            <p className="text-xs text-slate-500">
              Registra tu cuenta institucional para postularte a cualquiera de nuestros programas académicos.
            </p>
          </div>

          {/* Botón de Registro con Google */}
          <button
            type="button"
            onClick={handleGoogleRegister}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-3 shadow-xs cursor-pointer hover:border-slate-300"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Registrarme con Google</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full"></div>
            <span className="bg-white px-3 text-[10px] uppercase font-bold text-slate-400 absolute">
              o completa el formulario
            </span>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Nombre Completo *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="ej. Diego Armando Solís"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#22abe2] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Correo Electrónico *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="ej. diego.solis@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#22abe2] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Contraseña Segura *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#22abe2] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Programa de Interés
              </label>
              <select
                value={programId}
                onChange={(e) => setProgramId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-[#22abe2] focus:outline-none"
              >
                {MOCK_PROGRAMS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-[11px] text-slate-500 space-y-1">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 w-3.5 h-3.5 text-[#22abe2] rounded border-slate-300 focus:ring-[#22abe2]"
                />
                <span>
                  Acepto el aviso de privacidad y los términos institucionales para el proceso de admisión.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !agreeTerms}
              className="w-full py-3 rounded-xl bg-[#22abe2] hover:bg-[#1b9ad0] text-white font-bold text-xs shadow-md shadow-[#22abe2]/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creando cuenta en Supabase...</span>
                </>
              ) : (
                <>
                  <span>Crear Cuenta y Continuar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
            ¿Ya tienes una cuenta registrada?{' '}
            <Link to="/login" className="text-[#22abe2] font-bold hover:underline">
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
