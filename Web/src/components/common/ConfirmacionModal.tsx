import { useEffect, useRef } from 'react';
import { X, AlertCircle, ShieldCheck } from 'lucide-react';

type Props = {
  titulo: string;
  mensaje: string;
  detalle?: string;
  textoConfirmar?: string;
  onConfirmar: () => void;
  onCancelar: () => void;
};

export const ConfirmacionModal = ({
  titulo,
  mensaje,
  detalle,
  textoConfirmar = 'Confirmar',
  onConfirmar,
  onCancelar
}: Props) => {
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const elemento = dialogo.current;
    elemento?.showModal();

    return () => {
      elemento?.close();
    };
  }, []);

  return (
    <dialog
      ref={dialogo}
      aria-labelledby="confirmacion-titulo"
      onCancel={e => {
        e.preventDefault();
        onCancelar();
      }}
      className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl bg-white p-0 shadow-2xl backdrop:bg-slate-950/60 backdrop:backdrop-blur-sm"
    >
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="bg-sky-50 text-[#148ebf] rounded-2xl p-3">
            <AlertCircle className="w-7 h-7" />
          </div>

          <button
            type="button"
            aria-label="Cerrar ventana"
            onClick={onCancelar}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <h2
            id="confirmacion-titulo"
            className="text-xl font-black text-slate-900"
          >
            {titulo}
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            {mensaje}
          </p>
        </div>

        {detalle && (
          <div className="flex gap-3 bg-sky-50 rounded-2xl p-4 text-sm text-slate-600">
            <ShieldCheck className="w-5 h-5 shrink-0 text-[#148ebf]" />
            <span>{detalle}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 flex-wrap">
          <button
            type="button"
            autoFocus
            onClick={onCancelar}
            className="px-5 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirmar}
            className="px-5 py-3 rounded-xl bg-[#148ebf] hover:bg-[#117da9] text-white text-sm font-bold"
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </dialog>
  );
};
