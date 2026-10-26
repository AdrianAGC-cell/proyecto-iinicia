import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { SSOModal } from './components/common/SSOModal';
import { Home } from './pages/Home';
import { Universidad } from './pages/Universidad';
import { OfertaAcademica } from './pages/OfertaAcademica';
import { DetallePrograma } from './pages/DetallePrograma';
import { Admisiones } from './pages/Admisiones';
import { Noticias } from './pages/Noticias';
import { Contacto } from './pages/Contacto';
import { Login } from './pages/Login';
import { Registro } from './pages/Registro';
import { MiIinicia } from './pages/MiIinicia';
import { AdminPanel } from './pages/AdminPanel';
import { MoodlePreview } from './pages/MoodlePreview';

// Helper component to scroll to top on page change
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/universidad" element={<Universidad />} />
              <Route path="/oferta-academica" element={<OfertaAcademica />} />
              <Route path="/carrera/:id" element={<DetallePrograma />} />
              <Route path="/admisiones" element={<Admisiones />} />
              <Route path="/noticias" element={<Noticias />} />
              <Route path="/contacto" element={<Contacto />} />
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<Registro />} />
              <Route path="/mi-iinicia" element={<MiIinicia />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/moodle-preview" element={<MoodlePreview />} />
            </Routes>
          </main>
          <Footer />
          <SSOModal />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
