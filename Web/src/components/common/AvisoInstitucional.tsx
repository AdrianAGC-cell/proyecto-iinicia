import React, { useEffect, useRef } from 'react';
import { Info } from 'lucide-react';

export const AvisoInstitucional: React.FC<{
  mensaje: string;
  cerrar: () => void;
}> = ({ mensaje, cerrar }) => {
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogo.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialogo}
      onCancel={e => {
        e.preventDefault();
        cerrar();
      }}
      className="fixed m-auto w-[90%] max-w-md rounded-3xl bg-white p-8 shadow-2xl backdrop:bg-slate-950/70"
      aria-labelledby="aviso-titulo"
    >
      <img
        src="/logo-iinicia.png"
        alt="IINICIA"
        className="h-14 mx-auto mb-5"
      />

      <Info className="w-12 h-12 text-[#22abe2] mx-auto mb-4" />

      <h2
        id="aviso-titulo"
        className="text-xl font-black text-slate-900 text-center"
      >
        Aviso institucional
      </h2>

      <p className="text-sm text-slate-600 text-center my-5">
        {mensaje}
      </p>

      <button
        type="button"
        autoFocus
        onClick={cerrar}
        className="w-full py-3 rounded-xl bg-[#22abe2] hover:bg-sky-600 text-white font-bold"
      >
        Entendido
      </button>
    </dialog>
  );
};
