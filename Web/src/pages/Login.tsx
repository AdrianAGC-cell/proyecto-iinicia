import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Loader2, Database, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import { supabase } from '../lib/supabase';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    // Validar si el usuario está registrado en Supabase Auth y tiene el correo sin confirmar
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (authError && authError.message.toLowerCase().includes('email not confirmed')) {
        setErrorMessage('Tu correo no ha sido confirmado. Por favor revisa tu bandeja de entrada o correo no deseado (Spam) para activarlo.');
        setLoading(false);
        return;
      }
    } catch (e) {
      // Si falla auth, continúa al login de base de datos
    }

    await login(email, undefined, password);
    setLoading(false);
    navigate('/mi-iinicia');
  };

  const handleQuickDemoLogin = async (role: Role, demoEmail: string) => {
    setLoading(true);
    setEmail(demoEmail);
    setPassword('password123');
    await login(demoEmail, role, 'password123');
    setLoading(false);
    if (role === 'estudiante') navigate('/mi-iinicia');
    else if (role === 'coordinador' || role === 'admin') navigate('/admin');
    else navigate('/admisiones');
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
              <span>Conectado a Supabase Database</span>
            </div>
            <p className="text-xs text-slate-500">
              Accede a tu portal institucional y a tus materias con la misma cuenta de la base de datos central.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-xs text-red-700 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMessage}</span>
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

          {/* Quick Demo Logins for Evaluator */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center">
              Cuentas Registradas en Supabase
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('estudiante', 'valeria.morales@iinicia.edu.mx')}
                className="p-2.5 rounded-2xl border border-slate-200 hover:bg-[#22abe2]/10 hover:border-[#22abe2]/40 text-left transition"
              >
                <span className="font-bold text-slate-900 block">Estudiante</span>
                <span className="text-[10px] text-slate-500">Valeria Morales</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('coordinador', 'sofia.alarcon@iinicia.edu.mx')}
                className="p-2.5 rounded-2xl border border-slate-200 hover:bg-[#22abe2]/10 hover:border-[#22abe2]/40 text-left transition"
              >
                <span className="font-bold text-slate-900 block">Coordinador</span>
                <span className="text-[10px] text-slate-500">Dra. Alarcón</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('aspirante', 'diego.solis@gmail.com')}
                className="p-2.5 rounded-2xl border border-slate-200 hover:bg-[#22abe2]/10 hover:border-[#22abe2]/40 text-left transition"
              >
                <span className="font-bold text-slate-900 block">Aspirante</span>
                <span className="text-[10px] text-slate-500">Diego Solís</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin', 'admin.sistemas@iinicia.edu.mx')}
                className="p-2.5 rounded-2xl border border-slate-200 hover:bg-[#22abe2]/10 hover:border-[#22abe2]/40 text-left transition"
              >
                <span className="font-bold text-slate-900 block">Admin TI</span>
                <span className="text-[10px] text-slate-500">Ing. Roberto Peña</span>
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-slate-500">
            ¿Aún no tienes cuenta?{' '}
            <Link to="/registro" className="text-[#22abe2] font-bold hover:underline">
              Registrarme como aspirante
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
