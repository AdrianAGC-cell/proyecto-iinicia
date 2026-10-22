import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Globe, ShieldCheck, Award } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#05080f] text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800/80">
          {/* Column 1: Official White Logo & Identity */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-block group">
              <img 
                src="/logo-iinicia-white.png" 
                alt="I²NICIA - Instituto de Innovación y Ciencias Aplicadas" 
                className="h-14 w-auto object-contain transition-all duration-300 group-hover:scale-105"
              />
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Instituto de Innovación y Ciencias Aplicadas. Formando a la nueva generación de profesionistas e investigadores en inteligencia artificial, arquitectura cloud y ciencias computacionales.
            </p>
            <div className="pt-2 flex flex-col space-y-2.5 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#22abe2] shrink-0" />
                <span>Distrito de Innovación Tecnológica • Campus Virtual Global</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#22abe2] shrink-0" />
                <span>+52 (55) 8900-INICIA (4642) • Atención Telefónica y WhatsApp</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#22abe2] shrink-0" />
                <span>contacto@iinicia.edu.mx • admisiones@iinicia.edu.mx</span>
              </div>
            </div>
          </div>

          {/* Column 2: Oferta Académica */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-[#22abe2] pl-2">
              Oferta Académica
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/carrera/lic-ia-datos" className="hover:text-[#22abe2] transition">
                  Lic. en Inteligencia Artificial y Datos
                </Link>
              </li>
              <li>
                <Link to="/carrera/ing-software-cloud" className="hover:text-[#22abe2] transition">
                  Ing. en Software & Arquitectura Cloud
                </Link>
              </li>
              <li>
                <Link to="/carrera/lic-gestion-negocios" className="hover:text-[#22abe2] transition">
                  Lic. en Negocios Digitales
                </Link>
              </li>
              <li>
                <Link to="/carrera/dip-ciberseguridad" className="hover:text-[#22abe2] transition">
                  Diplomado en DevSecOps
                </Link>
              </li>
              <li>
                <Link to="/oferta-academica" className="text-[#22abe2] hover:underline font-semibold inline-block pt-1">
                  Ver catálogo completo →
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Alumnos y Campus */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-[#22abe2] pl-2">
              Alumnos & Campus
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/mi-iinicia" className="hover:text-[#22abe2] transition">
                  Portal Mi IINICIA
                </Link>
              </li>
              <li>
                <Link to="/moodle-preview" className="hover:text-[#22abe2] transition">
                  Campus Virtual (Moodle LMS)
                </Link>
              </li>
              <li>
                <Link to="/admisiones" className="hover:text-[#22abe2] transition">
                  Convocatoria de Becas
                </Link>
              </li>
              <li>
                <Link to="/noticias" className="hover:text-[#22abe2] transition">
                  Gaceta Institucional
                </Link>
              </li>
              <li>
                <Link to="/contacto" className="hover:text-[#22abe2] transition">
                  Mesa de Ayuda Técnica
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Validez y Arquitectura */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-[#22abe2] pl-2">
              Acreditación Oficial
            </h4>
            <div className="space-y-3 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <Award className="w-4 h-4 text-[#22abe2] shrink-0 mt-0.5" />
                <span>Programas académicos con Reconocimiento de Validez Oficial de Estudios (RVOE SEP Federal).</span>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#22abe2] shrink-0 mt-0.5" />
                <span>Ecosistema desacoplado: React + Node.js + Moodle LMS con SSO OIDC.</span>
              </div>
              <div className="pt-2">
                <span className="inline-flex items-center px-2 py-1 rounded bg-slate-900 text-[11px] text-[#22abe2] font-mono border border-slate-800">
                  ISO 9001 & WCAG 2.2 AA
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 I²NICIA - Instituto de Innovación y Ciencias Aplicadas. Todos los derechos reservados.</p>
          <div className="flex items-center space-x-6">
            <a href="#" className="hover:text-slate-400 transition">Aviso de Privacidad</a>
            <a href="#" className="hover:text-slate-400 transition">Términos de Servicio</a>
            <a href="#" className="hover:text-slate-400 transition">Seguridad Digital</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
