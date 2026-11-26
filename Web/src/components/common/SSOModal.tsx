import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, X, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const SSOModal: React.FC = () => {
  const {
    ssoModalOpen,
    closeSSOModal,
    user
  } = useAuth();

  const navigate = useNavigate();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (ssoModalOpen) {
      setError('');
      setCargando(false);
    }
  }, [ssoModalOpen]);

  if (!ssoModalOpen) return null;

  const entrar = async () => {
    setCargando(true);
    setError('');

    try {
      const respuesta = await fetch('/api/auth/me', {
        credentials: 'include',
        cache: 'no-store'
      });

      const datos = await respuesta.json();

      if (!respuesta.ok || !datos.success) {
        throw new Error('No existe una sesion academica activa.');
      }

      closeSSOModal();
      navigate('/mi-iinicia');

    } catch (_) {
      setError('No fue posible verificar tu acceso academico.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div role="dialog" aria-modal="true"
        className="relative w-full max-w-lg rounded-3xl bg-slate-900 text-white border border-slate-700 shadow-2xl p-7">

        <button onClick={closeSSOModal}
          disabled={cargando}
          aria-label="Cerrar"
          className="absolute top-4 right-4 text-slate-400 hover:text-white">
          <X size={22} />
        </button>

        <ShieldCheck className="text-cyan-400 mb-4" size={38} />

        <h3 className="text-xl font-bold">
          Campus Virtual IINICIA
        </h3>

        <p className="text-slate-400 text-sm mt-3">
          Accede a tus cursos y actividades mediante tu
          sesion academica institucional.
        </p>

        <div className="bg-slate-800 rounded-xl p-4 mt-5">
          <p className="text-cyan-400 font-bold">
            {user?.email}
          </p>
          <p className="text-sm mt-2">
            Perfil: {user?.role}
          </p>
        </div>

        {error && (
          <p role="alert"
            className="mt-4 p-3 rounded-xl bg-red-950 text-red-300 text-sm">
            {error}
          </p>
        )}

        <button onClick={entrar}
          disabled={cargando}
          className="mt-6 w-full flex justify-center items-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 p-3 font-bold">
          {cargando ? 'Verificando acceso...' : 'Entrar a Mi Campus'}
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};
