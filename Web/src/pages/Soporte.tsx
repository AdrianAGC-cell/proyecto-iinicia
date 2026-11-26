import React from 'react';
import { GestionSoporte } from '../components/admin/GestionSoporte';
import { Headphones } from 'lucide-react';

export const Soporte: React.FC = () => {
  return (
    <main className="max-w-5xl mx-auto px-6 py-10 space-y-6">

      <section className="bg-slate-900 text-white rounded-3xl p-8">
        <Headphones className="w-12 h-12 text-sky-400 mb-4" />

        <h1 className="text-3xl font-bold">
          Soporte IINICIA
        </h1>

        <p className="text-slate-300 mt-3">
          Reporta problemas y consulta el seguimiento
          de tus incidencias institucionales.
        </p>
      </section>

      <GestionSoporte />

    </main>
  );
};
