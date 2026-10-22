import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';

export const Contacto: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    area: 'admisiones',
    message: ''
  });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setFormData({ name: '', email: '', area: 'admisiones', message: '' });
    }, 4000);
  };

  return (
    <div className="space-y-16 pb-24">
      {/* Banner */}
      <section className="bg-gradient-to-r from-[#05080f] via-[#09101d] to-[#05080f] text-white py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#22abe2] bg-[#22abe2]/10 px-3 py-1 rounded-full border border-[#22abe2]/20">
            Canales Oficiales
          </span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
            Contacto y Mesa de Ayuda
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Estamos disponibles para orientarte en tu proceso de admisión, soporte técnico del campus virtual o trámites escolares.
          </p>
        </div>
      </section>

      {/* Directory & Form */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Direct channels cards */}
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 card-hover-effect group">
              <div className="w-10 h-10 rounded-2xl bg-[#22abe2]/10 text-[#22abe2] flex items-center justify-center group-hover:bg-[#22abe2] group-hover:text-white transition-colors duration-200">
                <Phone className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-[#22abe2] transition-colors">Atención Telefónica y WhatsApp</h3>
              <p className="text-xs text-slate-500">+52 (55) 8900-4642 • Conmutador general</p>
              <p className="text-xs text-slate-500">+52 (55) 4892-1102 • Asesoría de Admisión</p>
              <span className="inline-block text-[10px] text-[#148ebf] bg-[#22abe2]/10 px-2 py-0.5 rounded font-bold">
                Lun a Sáb: 8:00 a 20:00 hrs
              </span>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 card-hover-effect group">
              <div className="w-10 h-10 rounded-2xl bg-[#22abe2]/10 text-[#22abe2] flex items-center justify-center group-hover:bg-[#22abe2] group-hover:text-white transition-colors duration-200">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-[#22abe2] transition-colors">Mesa de Ayuda Digital</h3>
              <p className="text-xs text-slate-500">soporte@iinicia.edu.mx (Soporte Moodle y SSO)</p>
              <p className="text-xs text-slate-500">admisiones@iinicia.edu.mx (Informes)</p>
              <p className="text-xs text-slate-500">escolares@iinicia.edu.mx (Control Escolar)</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 card-hover-effect group">
              <div className="w-10 h-10 rounded-2xl bg-[#22abe2]/10 text-[#22abe2] flex items-center justify-center group-hover:bg-[#22abe2] group-hover:text-white transition-colors duration-200">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-[#22abe2] transition-colors">Sede Institucional</h3>
              <p className="text-xs text-slate-500">
                Distrito de Innovación Tecnológica • Campus Virtual Global
              </p>
              <span className="text-[10px] text-[#22abe2] font-mono">
                Atención presencial y virtual
              </span>
            </div>
          </div>

          {/* Interactive Contact Form */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h3 className="text-xl font-black text-slate-900">Envíanos un Mensaje</h3>
              <p className="text-xs text-slate-500 mt-1">
                Recibirás respuesta de un coordinador académico en un periodo no mayor a 24 horas.
              </p>
            </div>

            {sent ? (
              <div className="bg-[#22abe2]/10 border border-[#22abe2]/30 rounded-2xl p-6 text-center space-y-2 animate-fadeIn">
                <CheckCircle2 className="w-8 h-8 text-[#22abe2] mx-auto" />
                <h4 className="font-bold text-slate-900 text-sm">¡Mensaje Enviado con Éxito!</h4>
                <p className="text-xs text-slate-600">
                  Hemos canalizado tu solicitud al área correspondiente. Nos pondremos en contacto a la brevedad.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tu Nombre</label>
                    <input
                      type="text"
                      required
                      placeholder="ej. Mariana Ríos"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#22abe2] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      required
                      placeholder="ej. mariana@correo.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#22abe2] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Área de Contacto</label>
                  <select
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#22abe2] bg-white focus:outline-none"
                  >
                    <option value="admisiones">Información de Carreras y Admisión</option>
                    <option value="soporte">Soporte Técnico Campus Moodle</option>
                    <option value="escolares">Control Escolar y Certificados</option>
                    <option value="empresas">Convenios Empresariales y Residencias</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mensaje o Consulta</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Escribe los detalles de tu consulta..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#22abe2] focus:outline-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#22abe2] hover:bg-[#1b9ad0] text-white font-bold text-xs shadow-md shadow-[#22abe2]/20 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar Consulta</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
