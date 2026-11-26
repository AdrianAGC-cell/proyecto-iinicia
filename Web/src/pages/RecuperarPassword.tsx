import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const RecuperarPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [recuperando, setRecuperando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState(false);
  const [terminado, setTerminado] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(
      (evento, sesion) => {
        if (evento === 'PASSWORD_RECOVERY' && sesion) {
          setRecuperando(true);
          setMensaje('');
        }
      }
    );

    return () => data.subscription.unsubscribe();
  }, []);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setOcupado(true);
    setMensaje('');
    setError(false);

    try {
      if (recuperando) {
        if (password.length < 8) {
          throw new Error(
            'La contraseña debe tener al menos 8 caracteres.'
          );
        }

        if (password !== confirmacion) {
          throw new Error('Las contraseñas no coinciden.');
        }

        const resultado = await supabase.auth.updateUser({
          password
        });

        if (resultado.error) throw resultado.error;

        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include'
        });

        const cierre = await supabase.auth.signOut();

        if (cierre.error) throw cierre.error;

        setPassword('');
        setConfirmacion('');
        setTerminado(true);
        setMensaje(
          'Contraseña actualizada. Ya puedes iniciar sesión.'
        );

      } else {
        const resultado =
          await supabase.auth.resetPasswordForEmail(
            email.trim(),
            {
              redirectTo:
                window.location.origin + '/recuperar-password'
            }
          );

        if (resultado.error) throw resultado.error;

        setMensaje(
          'Si existe una cuenta asociada, recibirás un correo con las instrucciones.'
        );
      }
    } catch (err: any) {
      setError(true);
      setMensaje(
        err?.message || 'No se pudo completar la operación.'
      );
    } finally {
      setOcupado(false);
    }
  };

  return (
    <section className="min-h-[75vh] flex items-center justify-center bg-slate-950 px-5 py-16">
      <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-8 shadow-2xl">

        <div className="text-cyan-400 font-bold tracking-widest mb-5">
          IINICIA
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">
          {recuperando
            ? 'Nueva contraseña'
            : 'Recuperar contraseña'}
        </h1>

        <p className="text-slate-400 mb-7">
          {recuperando
            ? 'Establece una nueva contraseña para tu cuenta.'
            : 'Recupera el acceso a tu cuenta institucional.'}
        </p>

        {!terminado && (
          <form onSubmit={enviar} className="space-y-5">

            {recuperando ? (
              <>
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Nueva contraseña"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-600 bg-slate-800 p-4 text-white"
                />

                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Confirmar contraseña"
                  value={confirmacion}
                  onChange={e => setConfirmacion(e.target.value)}
                  className="w-full rounded-xl border border-slate-600 bg-slate-800 p-4 text-white"
                />
              </>
            ) : (
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-600 bg-slate-800 p-4 text-white"
              />
            )}

            <button
              disabled={ocupado}
              className="w-full rounded-xl bg-cyan-400 p-4 font-bold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
            >
              {ocupado
                ? 'Procesando...'
                : recuperando
                ? 'Guardar contraseña'
                : 'Enviar correo de recuperación'}
            </button>
          </form>
        )}

        {mensaje && (
          <div
            role="status"
            className={`mt-5 rounded-xl border p-4 ${
              error
                ? 'border-red-500/40 bg-red-500/10 text-red-300'
                : 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
            }`}
          >
            {mensaje}
          </div>
        )}

        <Link
          to="/login"
          className="block mt-7 text-center text-cyan-400"
        >
          Volver a iniciar sesión
        </Link>
      </div>
    </section>
  );
};
