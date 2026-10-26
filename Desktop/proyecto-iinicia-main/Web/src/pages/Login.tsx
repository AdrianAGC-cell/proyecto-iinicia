import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, switchRole } = useAuth();
  const navigate = useNavigate();

  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(email);
    navigate('/mi-iinicia');
  };

  const handleQuickDemoLogin = (role: Role) => {
    switchRole(role);
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
            <p className="text-xs text-slate-500">
              Accede a tu portal institucional y a tus materias en Moodle LMS con tu cuenta única.
            </p>
          </div>

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
                  onClick={() => alert('Se ha enviado un enlace de restablecimiento seguro OIDC a tu correo institucional.')} 
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
              className="w-full py-3 rounded-xl bg-[#22abe2] hover:bg-[#1b9ad0] text-white font-bold text-xs shadow-md shadow-[#22abe2]/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Acceder al Ecosistema</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Logins for Evaluator */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center">
              Acceso Rápido de Evaluación
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('estudiante')}
                className="p-2.5 rounded-2xl border border-slate-200 hover:bg-[#22abe2]/10 hover:border-[#22abe2]/40 text-left transition"
              >
                <span className="font-bold text-slate-900 block">Estudiante</span>
                <span className="text-[10px] text-slate-500">Valeria Morales</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('coordinador')}
                className="p-2.5 rounded-2xl border border-slate-200 hover:bg-[#22abe2]/10 hover:border-[#22abe2]/40 text-left transition"
              >
                <span className="font-bold text-slate-900 block">Coordinador</span>
                <span className="text-[10px] text-slate-500">Dra. Alarcón</span>
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
