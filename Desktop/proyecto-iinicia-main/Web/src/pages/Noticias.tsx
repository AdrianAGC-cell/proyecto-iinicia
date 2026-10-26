import React, { useState } from 'react';
import { Calendar, ArrowRight } from 'lucide-react';
import { MOCK_NEWS } from '../data/mockData';
import { NewsItem } from '../types';
import { SafeImage } from '../components/common/SafeImage';

export const Noticias: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [activeArticle, setActiveArticle] = useState<NewsItem | null>(null);

  const categories = ['todas', 'Institucional', 'Admisiones', 'Investigación', 'Alianzas'];

  const filteredNews = selectedCategory === 'todas'
    ? MOCK_NEWS
    : MOCK_NEWS.filter(n => n.category.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <div className="space-y-12 pb-24">
      {/* Banner */}
      <section className="bg-gradient-to-r from-[#05080f] via-[#09101d] to-[#05080f] text-white py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#22abe2] bg-[#22abe2]/10 px-3 py-1 rounded-full border border-[#22abe2]/20">
            Gaceta Universitaria
          </span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
            Noticias y Comunicados Oficiales
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Mantente al día con los avances tecnológicos, convocatorias, convenios internacionales y vida estudiantil en I²NICIA.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 mr-2">Filtrar por:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setActiveArticle(null);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                selectedCategory === cat
                  ? 'bg-[#22abe2] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat === 'todas' ? 'Todas las Noticias' : cat}
            </button>
          ))}
        </div>

        {/* Modal / Expanded Reader View */}
        {activeArticle && (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#22abe2]/30 shadow-xl space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-[#22abe2]/10 text-[#148ebf] text-xs font-bold uppercase">
                {activeArticle.category}
              </span>
              <button
                onClick={() => setActiveArticle(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700"
              >
                Cerrar lectura ✕
              </button>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              {activeArticle.title}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-[#22abe2]" />
              <span>{activeArticle.date} • Redacción y Comunicación Institucional I²NICIA</span>
            </div>
            <SafeImage
              src={activeArticle.image}
              alt={activeArticle.title}
              className="w-full h-80 object-cover rounded-2xl shadow-md"
            />
            <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">
              {activeArticle.content}
            </p>
          </div>
        )}

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filteredNews.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm card-hover-effect flex flex-col justify-between group"
            >
              <div>
                <div className="h-48 overflow-hidden relative bg-slate-900">
                  <SafeImage
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  />
                  <span className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg border border-white/10">
                    {item.category}
                  </span>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-[#22abe2]" />
                    <span>{item.date}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-[#22abe2] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {item.summary}
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0 border-t border-slate-100 flex items-center justify-between mt-4">
                <button
                  onClick={() => setActiveArticle(item)}
                  className="text-xs font-bold text-[#22abe2] hover:text-[#1b9ad0] inline-flex items-center gap-1 cursor-pointer group/btn"
                >
                  <span>Leer completo</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
