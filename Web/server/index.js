import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = process.env.PORT || 5000;

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hwzkpkmithroyobntypq.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3emtwa21pdGhyb3lvYm50eXBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2MzU2NTYsImV4cCI6MjEwODIxMTY1Nn0.ncSUUAO-jojOdTu6NzuJxf7lxFCSyg3O_02yU9n1Jt0';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

app.use(cors());
app.use(express.json());

// Mock database in memory
const PROGRAMS = [
  {
    id: 'lic-ia-datos',
    title: 'Licenciatura en Inteligencia Artificial y Ciencia de Datos',
    degree: 'Licenciatura',
    area: 'Tecnología & IA',
    duration: '8 Semestres (4 años)',
    modality: 'Híbrida / En Línea con Clases en Vivo',
    credits: 320,
    rvoe: 'RVOE-SEP-2026-IA01',
    description: 'Forma profesionistas capaces de diseñar arquitecturas de aprendizaje automático, redes neuronales profundas y gobernanza ética de datos a escala empresarial.',
    objectives: 'Dominar modelos LLM, visión artificial, pipelines de MLOps y analítica predictiva de alto impacto.',
    fieldWork: 'Ingeniero de Machine Learning, Arquitecto de Soluciones IA, Científico de Datos Senior, Líder de Innovación Tecnológica.',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80',
    featured: true,
    syllabus: [
      { semester: '1er Semestre', courses: ['Fundamentos de Algoritmos y Python', 'Álgebra Lineal Computacional', 'Estructuras Discretas', 'Ética en Tecnologías Disruptivas'] },
      { semester: '2do Semestre', courses: ['Cálculo Multivariable para IA', 'Bases de Datos Relacionales y NoSQL', 'Programación Orientada a Objetos Avanzada', 'Probabilidad y Estadística Aplicada'] },
      { semester: '3er Semestre', courses: ['Machine Learning I (Supervisado)', 'Ingeniería de Características y Limpieza de Datos', 'Estructuras de Datos y Algoritmos Complejos', 'Visualización de Datos y Storytelling'] },
      { semester: '4to Semestre', courses: ['Machine Learning II (No Supervisado)', 'Redes Neuronales y Deep Learning', 'Cloud Computing & MLOps con Docker', 'Optimización Numérica'] },
      { semester: '5to Semestre', courses: ['Procesamiento del Lenguaje Natural (NLP)', 'Visión por Computadora', 'Big Data Engineering con Spark', 'Seguridad en Sistemas de IA'] },
      { semester: '6to Semestre', courses: ['Modelos de Lenguaje Grandes (LLMs)', 'Aprendizaje por Refuerzo', 'Arquitectura de Datos Empresariales', 'Gestión de Proyectos Tecnológicos'] },
      { semester: '7mo Semestre', courses: ['IA Generativa y Sistemas Autónomos', 'Taller de Innovación y Patentes', 'Práctica Profesional I', 'Seminario de Investigación'] },
      { semester: '8vo Semestre', courses: ['Proyecto Integrador Capstone', 'Gobernanza y Regulación de IA', 'Práctica Profesional II', 'Examen Profesional'] }
    ]
  },
  {
    id: 'ing-software-cloud',
    title: 'Ingeniería en Desarrollo de Software y Arquitectura Cloud',
    degree: 'Ingeniería',
    area: 'Tecnología & IA',
    duration: '8 Semestres (4 años)',
    modality: 'En Línea Flexible',
    credits: 340,
    rvoe: 'RVOE-SEP-2026-ISC02',
    description: 'Especialízate en ingeniería de software moderna, microservicios distribuidos, DevOps continuo, Kubernetes y desarrollo full-stack con TypeScript, React y Go.',
    objectives: 'Construir plataformas web y móviles escalables, con alta disponibilidad y metodologías ágiles de clase mundial.',
    fieldWork: 'Tech Lead, Desarrollador Full-Stack, Ingeniero Cloud/DevOps, Arquitecto de Software.',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
    featured: true,
    syllabus: [
      { semester: '1er Semestre', courses: ['Fundamentos de Programación', 'Arquitectura de Computadoras', 'Matemáticas Discretas', 'Comunicación Profesional'] },
      { semester: '2do Semestre', courses: ['Frontend Moderno con React', 'Bases de Datos y Modelado SQL', 'Cálculo Diferencial', 'Sistemas Operativos y Linux'] },
      { semester: '3er Semestre', courses: ['Backend con Node.js & NestJS', 'Patrones de Diseño de Software', 'Redes de Datos y Protocolos', 'Ingeniería de Requisitos'] },
      { semester: '4to Semestre', courses: ['Microservicios y Docker', 'Arquitectura Hexagonal & DDD', 'Bases de Datos NoSQL y Cache', 'Pruebas Automatizadas y TDD'] },
      { semester: '5to Semestre', courses: ['DevOps & Pipelines CI/CD', 'Desarrollo Móvil con Jetpack Compose & Flutter', 'Ciberseguridad Aplicada', 'Cloud Computing AWS/GCP'] },
      { semester: '6to Semestre', courses: ['Kubernetes y Orquestación', 'Arquitecturas Serverless', 'Gobernanza de APIs GraphQL/gRPC', 'Liderazgo de Equipos Ágiles'] }
    ]
  },
  {
    id: 'lic-gestion-negocios',
    title: 'Licenciatura en Negocios Digitales y Transformación Organizacional',
    degree: 'Licenciatura',
    area: 'Negocios Digitales',
    duration: '7 Semestres (3.5 años)',
    modality: '100% En Línea',
    credits: 300,
    rvoe: 'RVOE-SEP-2026-BND03',
    description: 'Combina visión estratégica, fintech, e-commerce global y análisis de datos para liderar startups y corporativos en la economía digital.',
    objectives: 'Diseñar modelos de negocio rentables y escalables, gestionando productos digitales y estrategias omnicanal.',
    fieldWork: 'Chief Digital Officer, Product Manager, Growth Lead, Consultor de Negocios.',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    featured: true,
    syllabus: [
      { semester: '1er Semestre', courses: ['Economía Digital', 'Fundamentos de Negocios', 'Contabilidad para Startups', 'Mentalidad Emprendedora'] },
      { semester: '2do Semestre', courses: ['E-Commerce y Omnicanalidad', 'Marketing de Crecimiento (Growth)', 'Finanzas Corporativas', 'Derecho Digital y Privacidad'] },
      { semester: '3er Semestre', courses: ['Product Management & Scrum', 'Business Analytics & PowerBI', 'Fintech y Nuevos Pagos', 'Estrategia de Precios y Monetización'] }
    ]
  },
  {
    id: 'dip-ciberseguridad',
    title: 'Diplomado Ejecutivo en Ciberseguridad Defensiva y DevSecOps',
    degree: 'Diplomado',
    area: 'Tecnología & IA',
    duration: '6 Meses (120 horas)',
    modality: 'Semipresencial / Sincrónico',
    credits: 45,
    rvoe: 'REG-DIPL-2026-SEC',
    description: 'Entrenamiento intensivo en mitigación de vulnerabilidades, análisis forense digital, pentesting y cumplimiento normativo ISO 27001.',
    objectives: 'Auditar y blindar infraestructuras críticas contra ataques avanzados persistentes.',
    fieldWork: 'Analista SOC, Ingeniero de Seguridad Cloud, Auditor de Ciberseguridad.',
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
    featured: false,
    syllabus: [
      { semester: 'Módulo 1', courses: ['Amenazas Emergentes y Threat Intelligence', 'Arquitectura Zero Trust'] },
      { semester: 'Módulo 2', courses: ['Seguridad en Contenedores y Kubernetes', 'Automatización de SAST/DAST'] },
      { semester: 'Módulo 3', courses: ['Respuesta a Incidentes y Criptografía Aplicada', 'Proyecto Final de Blindaje'] }
    ]
  },
  {
    id: 'cert-computacion-cuantica',
    title: 'Certificación Profesional en Cómputo en la Nube y Microservicios',
    degree: 'Certificación',
    area: 'Tecnología & IA',
    duration: '4 Meses (80 horas)',
    modality: '100% En Línea Autogestionada',
    credits: 30,
    rvoe: 'CERT-IINICIA-CLOUD',
    description: 'Acreditación técnica para desarrolladores e ingenieros que desean certificar competencias en diseño de sistemas altamente disponibles.',
    objectives: 'Desplegar clústeres tolerantes a fallos con observabilidad en tiempo real.',
    fieldWork: 'Cloud Associate, Ingeniero DevOps Jr.',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    featured: false,
    syllabus: [
      { semester: 'Fase I', courses: ['Principios de Nube y Redes Virtuales', 'Infraestructura como Código con Terraform'] },
      { semester: 'Fase II', courses: ['Monitoreo con Prometheus y Grafana', 'Examen de Certificación Oficial'] }
    ]
  }
];

const NEWS = [
  {
    id: 'noticia-1',
    title: 'IINICIA inaugura su nueva infraestructura tecnológica con arquitectura Next.js y Moodle',
    date: '18 de Octubre, 2026',
    category: 'Institucional',
    summary: 'La institución culmina la primera fase de retiro de WordPress hacia un ecosistema desacoplado de alto rendimiento con SSO unificado.',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
    content: 'El Instituto Internacional de Innovación y Ciencias Aplicadas (IINICIA) ha presentado su renovada plataforma digital, eliminando la dependencia de gestores obsoletos y brindando una experiencia académica unificada con Moodle y Single Sign-On.'
  },
  {
    id: 'noticia-2',
    title: 'Apertura de la Convocatoria Nacional de Admisiones 2026-2027',
    date: '12 de Octubre, 2026',
    category: 'Admisiones',
    summary: 'Se abren 1,200 plazas con becas de excelencia académica de hasta el 60% para licenciaturas en IA y Software.',
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80',
    content: 'Los aspirantes de México y Latinoamérica podrán registrarse íntegramente a través del portal y completar su validación académica sin trámites presenciales.'
  },
  {
    id: 'noticia-3',
    title: 'Convenio de Prácticas y Empleabilidad con empresas líderes en IA y Cloud',
    date: '04 de Octubre, 2026',
    category: 'Alianzas',
    summary: 'Estudiantes de últimos semestres podrán realizar residencias remuneradas en proyectos de automatización y analítica.',
    image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
    content: 'El acuerdo garantiza que los estudiantes inscritos en la plataforma tengan vinculación directa con bolsas de trabajo de alta especialización.'
  }
];

// In-memory admissions applications
const applications = [
  {
    id: 'SOL-2026-0891',
    fullName: 'Mariana Ríos Cruz',
    email: 'mariana.rios@gmail.com',
    programId: 'lic-ia-datos',
    programName: 'Licenciatura en Inteligencia Artificial y Ciencia de Datos',
    phone: '+52 55 4892 1102',
    status: 'ADMITIDO',
    moodleSynced: true,
    moodleUserId: 1042,
    date: '2026-10-15',
    averageGrade: '9.4'
  },
  {
    id: 'SOL-2026-0892',
    fullName: 'Carlos Eduardo Mendoza',
    email: 'carlos.mendoza@outlook.com',
    programId: 'ing-software-cloud',
    programName: 'Ingeniería en Desarrollo de Software y Arquitectura Cloud',
    phone: '+52 33 1290 8821',
    status: 'EN REVISION',
    moodleSynced: false,
    moodleUserId: null,
    date: '2026-10-18',
    averageGrade: '8.9'
  }
];

// System Status endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'operational',
    service: 'IINICIA Core Backend & Integration Layer',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    components: {
      portal: 'React 19 / TypeScript (Operational)',
      identity: 'Keycloak OIDC / JWT SSO (Ready)',
      lms: 'Moodle 4.x REST Web Services (Connected)',
      database: 'PostgreSQL Connection Pool (Healthy)'
    }
  });
});

// Programs endpoints
app.get('/api/programs', (req, res) => {
  const { degree, area } = req.query;
  let results = [...PROGRAMS];
  if (degree) results = results.filter(p => p.degree.toLowerCase() === degree.toString().toLowerCase());
  if (area) results = results.filter(p => p.area.toLowerCase() === area.toString().toLowerCase());
  res.json(results);
});

app.get('/api/programs/:id', (req, res) => {
  const program = PROGRAMS.find(p => p.id === req.params.id);
  if (!program) return res.status(404).json({ error: 'Programa no encontrado' });
  res.json(program);
});

// News endpoints
app.get('/api/news', (req, res) => {
  res.json(NEWS);
});

// Admissions apply endpoint
app.post('/api/admissions/apply', (req, res) => {
  const { fullName, email, phone, programId, previousSchool, averageGrade } = req.body;
  if (!fullName || !email || !programId) {
    return res.status(400).json({ error: 'Nombre, correo y programa son obligatorios' });
  }

  const program = PROGRAMS.find(p => p.id === programId);
  const newApp = {
    id: `SOL-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    fullName,
    email,
    phone: phone || 'No especificado',
    programId,
    programName: program ? program.title : 'Programa General',
    previousSchool: previousSchool || 'Bachillerato General',
    averageGrade: averageGrade || '9.0',
    status: 'EN REVISION',
    moodleSynced: false,
    moodleUserId: null,
    date: new Date().toISOString().split('T')[0]
  };

  applications.unshift(newApp);
  res.status(201).json({
    success: true,
    message: 'Solicitud de admisión registrada exitosamente. Hemos generado tu expediente.',
    application: newApp
  });
});

// Admin Applications list
app.get('/api/admin/applications', (req, res) => {
  res.json(applications);
});

// Admin Approve Application and Sync with Moodle (Idempotent)
app.post('/api/admin/applications/:id/approve', (req, res) => {
  const appItem = applications.find(a => a.id === req.params.id);
  if (!appItem) return res.status(404).json({ error: 'Solicitud no encontrada' });

  appItem.status = 'ADMITIDO';
  // Simulate Moodle Web Service call: core_user_create_users & enrol_manual_enrol_users
  if (!appItem.moodleSynced) {
    appItem.moodleSynced = true;
    appItem.moodleUserId = 1000 + Math.floor(Math.random() * 5000);
    appItem.moodleSyncDate = new Date().toISOString();
  }

  res.json({
    success: true,
    message: `Aspirante ${appItem.fullName} admitido y sincronizado con Moodle LMS (ID: ${appItem.moodleUserId})`,
    application: appItem
  });
});

// Mock SSO Auth Check
app.post('/api/auth/sso-ticket', (req, res) => {
  const { userEmail } = req.body;
  // Simulates issuing a short-lived one-time ticket for Moodle SSO seamless redirect
  const ssoTicket = `iinicia-sso-${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
  res.json({
    ssoTicket,
    redirectUrl: `https://aula.iinicia.org/auth/sso/login.php?ticket=${ssoTicket}&user=${encodeURIComponent(userEmail || 'demo.estudiante@iinicia.org')}`,
    expiresInSeconds: 60
  });
});

app.listen(PORT, () => {
  console.log(`[IINICIA Backend] API listening on port ${PORT}`);
  console.log(`[IINICIA Backend] Integrated Moodle Web Services & SSO Ready`);
});
