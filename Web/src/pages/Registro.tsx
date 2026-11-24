import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Lock, 
  Mail, 
  User, 
  ShieldCheck, 
  ArrowRight, 
  Loader2, 
  MailCheck, 
  KeyRound, 
  RefreshCw, 
  AlertCircle,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MOCK_PROGRAMS } from '../data/mockData';
import { supabase } from '../lib/supabase';

export const Registro: React.FC = () => {
  // Estado de paso: 'form' (formulario) o 'verify' (confirmación de correo / 2 pasos)
  const [step, setStep] = useState<'form' | 'verify'>('form');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [programId, setProgramId] = useState('lic-ia-datos');
  // VULN-003 FIX: Desafío interactivo real anti-bot con verificación de cálculo
  const [captchaNum1, setCaptchaNum1] = useState(() => Math.floor(Math.random() * 8) + 2);
  const [captchaNum2, setCaptchaNum2] = useState(() => Math.floor(Math.random() * 8) + 1);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaVerified, setCaptchaVerified] = useState(false);

  // VULN-011 FIX: Terms must be explicitly accepted by the user (default = false)
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const refreshCaptcha = () => {
    setCaptchaNum1(Math.floor(Math.random() * 8) + 2);
    setCaptchaNum2(Math.floor(Math.random() * 8) + 1);
    setCaptchaAnswer('');
    setCaptchaVerified(false);
  };

  const handleVerifyCaptcha = (e: React.MouseEvent) => {
    e.preventDefault();
    if (parseInt(captchaAnswer.trim(), 10) === (captchaNum1 + captchaNum2)) {
      setCaptchaVerified(true);
      setErrorMsg(null);
    } else {
      setErrorMsg('Respuesta de seguridad incorrecta. Inténtalo de nuevo.');
      refreshCaptcha();
    }
  };

  // Estados de verificación OTP
  const [otpToken, setOtpToken] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [generatedFolio, setGeneratedFolio] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  // Paso 1: Enviar formulario y solicitar confirmación de correo a Supabase
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Por favor ingresa tu nombre completo.');
      return;
    }
    if (!email.trim()) {
      setErrorMsg('Por favor ingresa un correo electrónico válido.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (!captchaVerified) {
      setErrorMsg('Por favor completa la verificación de seguridad anti-bot resolviendo el cálculo.');
      return;
    }
    if (!agreeTerms) {
      setErrorMsg('Debes aceptar los Términos y Condiciones y el Aviso de Privacidad.');
      return;
    }

    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const prog = MOCK_PROGRAMS.find((p) => p.id === programId);
    const progTitle = prog ? prog.title : 'Programa Académico';
    const newFolio = `SOL-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setGeneratedFolio(newFolio);

    try {
      // 1. Guardar expediente en Supabase (admission_applications)
      const { error: appError } = await supabase.from('admission_applications').insert([
        {
          id: newFolio,
          full_name: cleanName,
          email: cleanEmail,
          program_id: programId,
          program_name: progTitle,
          previous_school: 'Bachillerato General',
          average_grade: 9.0,
          status: 'EN REVISION',
          moodle_synced: false
        }
      ]);

      if (appError) {
        console.warn('Nota al registrar expediente:', appError);
      }

      // 2. Disparar registro en Supabase Auth (envía correo con link y código OTP)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            full_name: cleanName,
            folio: newFolio,
            program_id: programId,
            program_name: progTitle
          },
          emailRedirectTo: `${window.location.origin}/admisiones?registered=true&program=${programId}&folio=${newFolio}`
        }
      });

      if (authError) {
        if (authError.message.toLowerCase().includes('already registered')) {
          // El usuario ya existe en Supabase Auth, permitirle ingresar código
          setStep('verify');
          return;
        }
        setErrorMsg(authError.message);
        setLoading(false);
        return;
      }

      // Avanzar al paso de verificación por correo
      setStep('verify');
    } catch (err: any) {
      console.error('Error en registro:', err);
      setErrorMsg(err.message || 'Error de conexión al servidor.');
    } finally {
      setLoading(false);
    }
  };

  // Paso 2: Verificar el código OTP de 6 dígitos que llegó por correo
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanToken = otpToken.trim();
    if (!cleanToken || cleanToken.length < 6) {
      setErrorMsg('Por favor ingresa el código numérico de 6 dígitos que llegó a tu correo.');
      return;
    }

    setVerifyingOtp(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: 'signup'
      });

      if (error) {
        setErrorMsg('El código ingresado es incorrecto o ha expirado. Por favor verifica tu correo.');
        setVerifyingOtp(false);
        return;
      }

      // Correo confirmado exitosamente: iniciar sesión con su nombre y folio real
      await login(cleanEmail, 'aspirante', password, name.trim());
      setVerifyingOtp(false);
      navigate(`/admisiones?registered=true&program=${programId}&folio=${generatedFolio}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al validar el código.');
      setVerifyingOtp(false);
    }
  };

  // Reenviar correo de confirmación
  const handleResend = async () => {
    setResending(true);
    setErrorMsg(null);
    setResendSuccess(false);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase()
      });

      if (error) {
        setErrorMsg('Por políticas de seguridad, espera unos minutos antes de solicitar otro correo.');
      } else {
        setResendSuccess(true);
      }
    } catch (err) {
      setErrorMsg('No se pudo reenviar el correo en este momento.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">
          
          {/* Encabezado Logo */}
          <div className="text-center space-y-3">
            <Link to="/" className="inline-block">
              <img
                src="/logo-iinicia.png"
                alt="I²NICIA"
                className="h-16 w-auto mx-auto object-contain"
              />
            </Link>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {step === 'form' ? 'Crear Identidad I²NICIA' : 'Verificación de Correo (2 Pasos)'}
            </h2>
            <p className="text-xs text-slate-500">
              {step === 'form'
                ? 'Paso 1: Registra tu cuenta institucional para postularte a cualquiera de nuestros programas académicos.'
                : 'Paso 2: Por seguridad, confirma tu correo electrónico para activar tu cuenta oficial.'}
            </p>
          </div>

          {/* Mensajes de Error */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-xs text-red-700 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* PASO 1: Formulario Inicial */}
          {step === 'form' && (
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
                    placeholder="ej. Sharon Ramírez"
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
                    placeholder="ej. sharon@gmail.com"
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
                    placeholder="Mínimo 6 caracteres"
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

              {/* VULN-003 FIX: Verificación interactiva de seguridad anti-bot */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <ShieldCheck className="w-4 h-4 text-[#22abe2]" />
                    <span>Control Anti-Bot IINICIA</span>
                  </div>
                  {captchaVerified ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> Verificado
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={refreshCaptcha}
                      className="text-[11px] text-[#22abe2] hover:underline flex items-center gap-1 cursor-pointer"
                      title="Generar nueva pregunta"
                    >
                      <RefreshCw className="w-3 h-3" /> Nuevo reto
                    </button>
                  )}
                </div>

                {!captchaVerified ? (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-slate-600 font-semibold whitespace-nowrap">
                      ¿Cuánto es {captchaNum1} + {captchaNum2}?
                    </span>
                    <input
                      type="number"
                      placeholder="Resultado"
                      value={captchaAnswer}
                      onChange={(e) => setCaptchaAnswer(e.target.value)}
                      className="w-20 px-2 py-1 text-xs text-center border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22abe2] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyCaptcha}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                    >
                      Comprobar
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-emerald-700 font-medium">
                    Identidad humana comprobada correctamente.
                  </p>
                )}
              </div>

              <div className="pt-1">
                <label className="flex items-start gap-2 text-[11px] text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 rounded text-[#22abe2] focus:ring-[#22abe2]"
                  />
                  <span>
                    Acepto los términos de servicio y la creación de mi perfil institucional único.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#22abe2] hover:bg-[#1b9ad0] text-white font-bold text-xs shadow-md shadow-[#22abe2]/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enviando correo de confirmación...</span>
                  </>
                ) : (
                  <>
                    <span>Crear Cuenta y Enviar Confirmación</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* PASO 2: Verificación de Correo (2 Pasos) */}
          {step === 'verify' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Tarjeta de Correo Enviado */}
              <div className="p-5 bg-sky-50 rounded-2xl border border-sky-100 text-center space-y-2">
                <div className="w-12 h-12 bg-[#22abe2]/20 text-[#22abe2] rounded-full flex items-center justify-center mx-auto">
                  <MailCheck className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-black text-slate-900">
                  ¡Revisa tu bandeja de entrada!
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Supabase ha enviado un correo de confirmación a:
                  <br />
                  <strong className="text-slate-900 font-semibold">{email}</strong>
                </p>
                <p className="text-[11px] text-slate-500 italic">
                  (Revisa también tu carpeta de Correo no deseado / Spam si no lo ves en unos segundos)
                </p>
              </div>

              {/* Formulario de Código OTP */}
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1 text-center">
                    Ingresa el Código de 6 Dígitos
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      maxLength={8}
                      placeholder="ej. 123456"
                      value={otpToken}
                      onChange={(e) => setOtpToken(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-center text-lg font-mono tracking-widest font-black focus:ring-2 focus:ring-[#22abe2] focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={verifyingOtp}
                  className="w-full py-3 rounded-xl bg-[#22abe2] hover:bg-[#1b9ad0] text-white font-bold text-xs shadow-md shadow-[#22abe2]/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {verifyingOtp ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Validando código en Supabase...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirmar y Entrar</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Separador */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-[11px] text-slate-400 uppercase font-semibold">o también</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <div className="text-center space-y-3">
                <p className="text-xs text-slate-600">
                  Puedes simplemente dar clic en el botón <strong>"Confirm your email"</strong> dentro del correo recibido.
                </p>

                {resendSuccess && (
                  <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-700 font-semibold">
                    ✓ Correo de confirmación reenviado exitosamente.
                  </div>
                )}

                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="inline-flex items-center gap-1.5 text-xs text-[#22abe2] hover:text-[#1b9ad0] font-bold hover:underline cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                    <span>Reenviar correo</span>
                  </button>

                  <span className="text-slate-300">•</span>

                  <button
                    type="button"
                    onClick={() => setStep('form')}
                    className="text-xs text-slate-500 hover:text-slate-800 font-medium hover:underline cursor-pointer"
                  >
                    Cambiar correo
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
            ¿Ya tienes una cuenta verificada?{' '}
            <Link to="/login" className="text-[#22abe2] font-bold hover:underline">
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
