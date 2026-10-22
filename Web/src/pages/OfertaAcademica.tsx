import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Clock, 
  BookOpen, 
  ArrowRight, 
  GraduationCap
} from 'lucide-react';
import { MOCK_PROGRAMS } from '../data/mockData';
import { SafeImage } from '../components/common/SafeImage';

export const OfertaAcademica: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [selectedDegree, setSelectedDegree] = useState<string>('todos');
  const [selectedArea, setSelectedArea] = useState<string>('todas');

  const degrees = ['todos', 'Licenciatura', 'Ingeniería', 'Diplomado', 'Certificación'];
  const areas = ['todas', 'Tecnología & IA', 'Negocios Digitales'];

  const filteredPrograms = useMemo(() => {
    return MOCK_PROGRAMS.filter((p) => {
      const matchesSearch = 
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.fieldWork.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDegree = selectedDegree === 'todos' || p.degree === selectedDegree;
      const matchesArea = selectedArea === 'todas' || p.area === selectedArea;

      return matchesSearch && matchesDegree && matchesArea;
    });
  }, [searchTerm, selectedDegree, selectedArea]);

  return (
    <div className="space-y-12 pb-24">
      {/* Header Banner */}
      <section className="bg-gradient-to-r from-[#05080f] via-[#09101d] to-[#05080f] text-white py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#22abe2] bg-[#22abe2]/10 px-3 py-1 rounded-full border border-[#22abe2]/20">
            Catálogo Oficial 2026-2027
          </span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
            Oferta Académica Universitaria
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Planes de estudio con validez oficial RVOE SEP, enfocados en las competencias de innovación y ciencias aplicadas más demandadas en el mercado laboral global.
          </p>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar programa por palabra clave (ej. Inteligencia Artificial, Cloud, Ciberseguridad)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#22abe2] text-xs"
              />
            </div>

            {/* Level Filter */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs font-semibold text-slate-500 shrink-0">Nivel:</span>
              <select
                value={selectedDegree}
                onChange={(e) => setSelectedDegree(e.target.value)}
                className="w-full md:w-44 py-2.5 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#22abe2]"
              >
                {degrees.map((d) => (
                  <option key={d} value={d}>
                    {d === 'todos' ? 'Todos los niveles' : d}
                  </option>
                ))}
              </select>
            </div>

            {/* Area Filter */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs font-semibold text-slate-500 shrink-0">Área:</span>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="w-full md:w-48 py-2.5 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#22abe2]"
              >
                {areas.map((a) => (
                  <option key={a} value={a}>
                    {a === 'todas' ? 'Todas las áreas' : a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-400 font-medium">Filtro rápido:</span>
            {degrees.map((deg) => (
              <button
                key={deg}
                onClick={() => setSelectedDegree(deg)}
                className={`px-3 py-1 rounded-full transition text-xs font-semibold ${
                  selectedDegree === deg
                    ? 'bg-[#22abe2] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {deg === 'todos' ? 'Ver Todos' : deg}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Programs List */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-600">
            Mostrando <span className="text-[#22abe2] font-black">{filteredPrograms.length}</span> programas disponibles
          </p>
        </div>

        {filteredPrograms.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No encontramos programas con ese criterio</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Intenta cambiar los términos de búsqueda o restablecer los filtros de nivel y área.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedDegree('todos');
                setSelectedArea('todas');
              }}
              className="mt-2 px-4 py-2 rounded-xl bg-[#22abe2]/10 text-[#22abe2] text-xs font-bold hover:bg-[#22abe2]/20 transition"
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPrograms.map((program) => (
              <div
                key={program.id}
                className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200 flex flex-col justify-between card-hover-effect group"
              >
                <div>
                  {/* Card Header Image */}
                  <div className="relative h-52 overflow-hidden bg-slate-900">
                    <SafeImage
                      src={program.image}
                      alt={program.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute top-3 left-3 bg-[#22abe2] text-white text-[11px] font-extrabold px-3 py-1 rounded-lg shadow-md">
                      {program.degree}
                    </div>
                    <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-md text-white text-[11px] font-medium px-2.5 py-1 rounded-lg border border-white/10">
                      {program.modality}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 space-y-3">
                    <span className="text-[11px] font-bold text-[#22abe2] uppercase tracking-wider">
                      {program.area}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-[#22abe2] transition leading-snug">
                      {program.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {program.description}
                    </p>

                    <div className="pt-2 flex flex-col space-y-1.5 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Duración: <strong className="text-slate-800">{program.duration}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                        <span>Créditos: <strong className="text-slate-800">{program.credits} créditos RVOE</strong></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-6 pt-0 border-t border-slate-100 flex items-center justify-between gap-3 mt-4">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {program.rvoe}
                  </span>
                  <Link
                    to={`/carrera/${program.id}`}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#22abe2] to-[#148ebf] hover:from-[#1b9ad0] hover:to-[#0f729b] text-white text-xs font-bold transition-all duration-200 flex items-center gap-1.5 shadow-md shadow-[#22abe2]/20 hover:shadow-lg hover:shadow-[#22abe2]/30 hover:-translate-y-0.5 group/btn"
                  >
                    <span>Ver Programa</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
