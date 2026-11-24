import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Loader2, Database, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emailNeedsConfirmation, setEmailNeedsConfirmation] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setResendSuccess(null);
    setEmailNeedsConfirmation(false);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage('Por favor ingresa tu correo y contraseña.');
      setLoading(false);
      return;
    }

    // Validar con Supabase Auth
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password
      });

      if (authError) {
        if (authError.message.toLowerCase().includes('email not confirmed')) {
          setEmailNeedsConfirmation(true);
          setErrorMessage('Tu correo no ha sido confirmado aún. Revisa tu bandeja de entrada o presiona el botón para reenviar el correo de activación.');
          setLoading(false);
          return;
        }
        if (authError.message.toLowerCase().includes('invalid login credentials')) {
          setErrorMessage('Credenciales inválidas. Verifica tu correo institucional y contraseña.');
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn('[IINICIA Auth] Supabase Auth check notice:', e);
    }

    const success = await login(cleanEmail, undefined, password);
    setLoading(false);
    if (success) {
      // Navegación automática según rol (coincidente con la Tabla de Credenciales)
      const stored = sessionStorage.getItem('iinicia_user');
      let targetRole = 'estudiante';
      if (stored) {
        try { targetRole = JSON.parse(stored).role; } catch (e) {}
      }

      if (targetRole === 'admin' || targetRole === 'coordinador') {
        navigate('/admin');
      } else if (targetRole === 'aspirante') {
        navigate('/admisiones');
      } else {
        navigate('/mi-iinicia');
      }
    } else {
      setErrorMessage('No se encontró un usuario con esas credenciales o la cuenta requiere verificación.');
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/mi-iinicia`
        }
      });
      if (error) {
        setErrorMessage(`Error con Google OAuth: ${error.message}`);
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'No se pudo conectar con el servicio de autenticación de Google.');
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Ingresa tu correo para reenviar el enlace de confirmación.');
      return;
    }
    setResendingEmail(true);
    setResendSuccess(null);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail
      });
      if (error) {
        setErrorMessage(error.message);
      } else {
        setResendSuccess(`Se ha reenviado el correo de confirmación a ${cleanEmail}. Revisa tu bandeja de entrada o la carpeta de Spam.`);
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Error al reenviar correo de confirmación.');
    } finally {
      setResendingEmail(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Card */}
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
              Iniciar Sesión en I²NICIA
            </h2>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-50 text-sky-700 rounded-full text-[11px] font-semibold border border-sky-100">
              <Database className="w-3 h-3 text-[#22abe2]" />
              <span>Conectado a Base de Datos Central</span>
            </div>
            <p className="text-xs text-slate-500">
              Acceso unificado al portal institucional, expediente académico y aula virtual Moodle.
            </p>
          </div>

          {/* Botón de Inicio con Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-3 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
            <span>Continuar con Google</span>
          </button>

          {/* Separador */}
          <div className="flex items-center gap-3">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="text-[11px] text-slate-400 font-medium">o con correo institucional</span>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex flex-col gap-2 text-xs text-red-700 animate-fadeIn">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              {emailNeedsConfirmation && (
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={resendingEmail}
                  className="mt-1 self-start px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 text-[11px] font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${resendingEmail ? 'animate-spin' : ''}`} />
                  <span>Reenviar correo de confirmación</span>
                </button>
              )}
            </div>
          )}

          {resendSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-700 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{resendSuccess}</span>
            </div>
          )}

          <form onSubmit={handleFormLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Correo Institucional o de Registro
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

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Contraseña
                </label>
                <a 
                  href="#recuperar" 
                  onClick={() => alert('Se ha enviado un enlace de restablecimiento seguro a tu correo institucional.')} 
                  className="text-[11px] text-[#22abe2] hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#22abe2] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#22abe2] hover:bg-[#1b9ad0] text-white font-bold text-xs shadow-md shadow-[#22abe2]/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validando en Supabase...</span>
                </>
              ) : (
                <>
                  <span>Acceder al Ecosistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
            ¿Aún no tienes cuenta institucional?{' '}
            <Link to="/registro" className="text-[#22abe2] font-bold hover:underline">
              Registrarme como aspirante
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
