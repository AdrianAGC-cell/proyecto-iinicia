import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  ExternalLink, 
  User as UserIcon, 
  Menu, 
  X, 
  LogOut, 
  LayoutDashboard, 
  Sparkles,
  ChevronDown,
  GraduationCap,
  UserCheck,
  ShieldCheck,
  Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';
import { SafeImage } from './SafeImage';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, switchRole, triggerMoodleSSO } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { label: 'Inicio', path: '/' },
    { label: 'Universidad', path: '/universidad' },
    { label: 'Oferta Académica', path: '/oferta-academica' },
    { label: 'Admisiones', path: '/admisiones' },
    { label: 'Noticias', path: '/noticias' },
    { label: 'Contacto', path: '/contacto' },
  ];

  const handleRoleChange = (role: Role) => {
    switchRole(role);
    setUserDropdownOpen(false);
    if (role === 'estudiante') {
      navigate('/mi-iinicia');
    } else if (role === 'coordinador' || role === 'admin') {
      navigate('/admin');
    } else if (role === 'aspirante') {
      navigate('/admisiones');
    }
  };

  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-xl border-b border-slate-200/70 shadow-xs transition-all">
      {/* Top Bar for Announcements and Evaluator Role Switcher */}
      <div className="bg-[#05080f] text-slate-200 text-xs py-2 px-4 sm:px-8 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5">
          {/* Announcement with glowing pulse indicator */}
          <div className="flex items-center gap-2 text-center md:text-left">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22abe2] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22abe2]"></span>
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#22abe2] text-white uppercase tracking-wider shadow-xs">
              Admisiones 2026-2027
            </span>
            <span className="hidden sm:inline text-slate-300 text-[11px]">
              Inscripciones abiertas • Modalidad Híbrida y 100% Online • <strong className="text-white font-medium">RVOE SEP Federal</strong>
            </span>
          </div>

          {/* Quick Persona Switcher for Evaluation */}
          <div className="flex items-center gap-1.5 text-[11px] bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <span className="text-slate-400 hidden lg:inline px-1.5 font-medium">Simular rol:</span>
            
            <button
              onClick={() => handleRoleChange('estudiante')}
              title="Ver portal como Estudiante Regular (Valeria Morales)"
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all duration-200 flex items-center gap-1 cursor-pointer ${
                user?.role === 'estudiante'
                  ? 'bg-[#22abe2] text-white shadow-md shadow-[#22abe2]/30 scale-[1.02]'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <GraduationCap className="w-3 h-3" />
              <span>Estudiante</span>
            </button>

            <button
              onClick={() => handleRoleChange('aspirante')}
              title="Ver portal como Aspirante en Proceso (Diego Solís)"
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all duration-200 flex items-center gap-1 cursor-pointer ${
                user?.role === 'aspirante'
                  ? 'bg-[#22abe2] text-white shadow-md shadow-[#22abe2]/30 scale-[1.02]'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <UserCheck className="w-3 h-3" />
              <span>Aspirante</span>
            </button>

            <button
              onClick={() => handleRoleChange('coordinador')}
              title="Ver portal como Coordinador Académico (Dra. Sofía Alarcón)"
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all duration-200 flex items-center gap-1 cursor-pointer ${
                user?.role === 'coordinador'
                  ? 'bg-[#22abe2] text-white shadow-md shadow-[#22abe2]/30 scale-[1.02]'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>Coordinador</span>
            </button>

            <button
              onClick={() => handleRoleChange('admin')}
              title="Ver portal como Administrador TI (Ing. Roberto Peña)"
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all duration-200 flex items-center gap-1 cursor-pointer ${
                user?.role === 'admin'
                  ? 'bg-[#22abe2] text-white shadow-md shadow-[#22abe2]/30 scale-[1.02]'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Admin TI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Official Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group py-1">
            <img 
              src="/logo-iinicia.png" 
              alt="I²NICIA - Instituto de Innovación y Ciencias Aplicadas" 
              className="h-12 w-auto object-contain transition-all duration-300 group-hover:scale-105 filter drop-shadow-xs group-hover:drop-shadow-sm" 
            />
          </Link>

          {/* Desktop Navigation Links with enhanced hover state */}
          <nav className="hidden lg:flex items-center space-x-1.5">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    active
                      ? 'text-[#22abe2] bg-[#22abe2]/10 font-bold shadow-xs'
                      : 'text-slate-700 hover:text-[#22abe2] hover:bg-slate-100/80 hover:-translate-y-0.5'
                  }`}
                >
                  {link.label}
                  {active && (
                    <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#22abe2] rounded-full shadow-xs" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Header Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Mi Campus (Moodle LMS) Button with Live Pulsing Dot */}
            <button
              onClick={() => triggerMoodleSSO()}
              title="Acceso directo con Single Sign-On al LMS Moodle"
              className="group relative inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 hover:border-[#22abe2] transition-all duration-200 shadow-xs hover:shadow-md hover:shadow-[#22abe2]/15 hover:-translate-y-0.5 cursor-pointer"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22abe2] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22abe2]"></span>
              </span>
              <span className="group-hover:text-[#22abe2] transition-colors">Mi Campus (Moodle)</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#22abe2] transition-colors" />
            </button>

            {/* Authenticated State vs Public State */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                {/* Panel Admin / Coordinator Link if applicable */}
                {(user.role === 'coordinador' || user.role === 'admin') && (
                  <Link
                    to="/admin"
                    className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 hover:border-slate-400 transition-all duration-200 shadow-xs hover:-translate-y-0.5"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-[#22abe2]" />
                    <span>Panel de Control</span>
                  </Link>
                )}

                {/* Mi IINICIA Student Portal Button */}
                <Link
                  to="/mi-iinicia"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#22abe2] to-[#148ebf] hover:from-[#1b9ad0] hover:to-[#0f729b] shadow-md shadow-[#22abe2]/25 hover:shadow-lg hover:shadow-[#22abe2]/35 transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  <Sparkles className="w-4 h-4 text-white animate-spin-slow" />
                  <span>Mi IINICIA</span>
                </Link>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 border border-slate-200 hover:border-[#22abe2]/40 transition-all duration-200 cursor-pointer shadow-xs"
                  >
                    <SafeImage
                      src={user.avatar}
                      alt={user.name}
                      isAvatar={true}
                      className="w-8 h-8 rounded-lg object-cover ring-2 ring-[#22abe2]/50 shadow-xs"
                    />
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-fadeIn">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#22abe2]/15 text-[#11719b]">
                          Rol: {user.role}
                        </span>
                      </div>
                      <Link
                        to="/mi-iinicia"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 font-medium hover:text-[#22abe2] transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-[#22abe2]" />
                        <span>Portal del Estudiante</span>
                      </Link>
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          triggerMoodleSSO();
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 font-medium text-left hover:text-[#22abe2] transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-4 h-4 text-[#22abe2]" />
                        <span>Ir a Aula Moodle (SSO)</span>
                      </button>
                      <div className="border-t border-slate-100 mt-1 pt-1">
                        <button
                          onClick={() => {
                            logout();
                            setUserDropdownOpen(false);
                            navigate('/');
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 font-medium text-left transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Cerrar sesión</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2.5 text-sm font-bold text-slate-700 hover:text-[#22abe2] hover:bg-slate-100 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/registro"
                  className="px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-[#22abe2] to-[#148ebf] hover:from-[#1b9ad0] hover:to-[#0f729b] rounded-xl shadow-md shadow-[#22abe2]/20 hover:shadow-lg hover:shadow-[#22abe2]/30 transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  Registrarme
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => triggerMoodleSSO()}
              className="p-2 text-slate-700 bg-slate-100 rounded-lg text-xs font-bold flex items-center gap-1 border border-slate-200 cursor-pointer"
            >
              <span className="text-[#22abe2]">Campus</span>
              <ExternalLink className="w-3 h-3 text-[#22abe2]" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-b border-slate-200 px-4 pt-2 pb-6 space-y-3 animate-fadeIn">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                  isActive(link.path)
                    ? 'text-[#22abe2] bg-[#22abe2]/10 font-bold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="pt-3 border-t border-slate-200 space-y-2">
            {isAuthenticated && user ? (
              <>
                <Link
                  to="/mi-iinicia"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#22abe2] to-[#148ebf] shadow-md"
                >
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>Mi IINICIA ({user.role})</span>
                </Link>
                {(user.role === 'coordinador' || user.role === 'admin') && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-900 bg-slate-100 border border-slate-300"
                  >
                    <LayoutDashboard className="w-4 h-4 text-[#22abe2]" />
                    <span>Panel de Control</span>
                  </Link>
                )}
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                    navigate('/');
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-red-600 bg-red-50 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar sesión</span>
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 px-3 rounded-xl border border-slate-300 text-sm font-bold text-slate-700"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/registro"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 px-3 rounded-xl bg-[#22abe2] text-sm font-bold text-white shadow-sm"
                >
                  Registrarme
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
