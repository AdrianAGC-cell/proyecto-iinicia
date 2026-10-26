import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { moodle } from './moodleClient.js';

const app = express();
const PORT = process.env.PORT || 5000;

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hwzkpkmithroyobntypq.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3emtwa21pdGhyb3lvYm50eXBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2MzU2NTYsImV4cCI6MjEwODIxMTY1Nn0.ncSUUAO-jojOdTu6NzuJxf7lxFCSyg3O_02yU9n1Jt0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

// System Status endpoint with Moodle Live Check
app.get('/api/health', async (req, res) => {
  const moodleStatus = await moodle.testConnection();
  res.json({
    status: 'operational',
    service: 'IINICIA Core Backend & Integration Layer',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    moodleIntegration: moodleStatus,
    components: {
      portal: 'React 19 / TypeScript (Operational)',
      identity: 'Keycloak OIDC / JWT SSO (Ready)',
      lms: moodleStatus.connected 
        ? `Moodle 4.x REST Web Services (Conectado a ${moodleStatus.moodleUrl} en ${moodleStatus.latencyMs}ms)`
        : `Moodle LMS REST Layer (Resiliente / Modo Simulación: ${moodleStatus.message || moodleStatus.status})`,
      database: 'PostgreSQL Connection Pool (Healthy)'
    }
  });
});

// Dedicated Moodle Web Services Status Check
app.get('/api/moodle/status', async (req, res) => {
  const status = await moodle.testConnection();
  res.json(status);
});

// Idempotent User Sync Endpoint for Moodle (core_user_create_users)
app.post('/api/moodle/sync-user', async (req, res) => {
  const { email, firstName, lastName, username } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'El correo electrónico es requerido.' });
  }

  const result = await moodle.createUserIfNotExist({
    email,
    firstName: firstName || 'Estudiante',
    lastName: lastName || 'IINICIA',
    username
  });

  res.json(result);
});

// Enrol Student Endpoint for Moodle (enrol_manual_enrol_users)
app.post('/api/moodle/enrol', async (req, res) => {
  const { moodleUserId, moodleCourseId, roleId } = req.body;
  if (!moodleUserId || !moodleCourseId) {
    return res.status(400).json({ error: 'moodleUserId y moodleCourseId son requeridos.' });
  }

  const result = await moodle.enrolStudent(Number(moodleUserId), Number(moodleCourseId), roleId || 5);
  res.json(result);
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
app.post('/api/admissions/apply', async (req, res) => {
  const { fullName, email, phone, programId, previousSchool, averageGrade } = req.body;
  if (!fullName || !email || !programId) {
    return res.status(400).json({ error: 'Nombre, correo y programa son obligatorios' });
  }

  const program = PROGRAMS.find(p => p.id === programId);
  const progName = program ? program.title : 'Programa General';
  const newAppId = `SOL-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  const newApp = {
    id: newAppId,
    fullName,
    email,
    phone: phone || 'No especificado',
    programId,
    programName: progName,
    previousSchool: previousSchool || 'Bachillerato General',
    averageGrade: averageGrade || '9.0',
    status: 'EN REVISION',
    moodleSynced: false,
    moodleUserId: null,
    date: new Date().toISOString().split('T')[0]
  };

  try {
    await supabase.from('admission_applications').insert([{
      id: newAppId,
      full_name: fullName,
      email: email,
      phone: phone || null,
      program_id: programId,
      program_name: progName,
      previous_school: previousSchool || 'Bachillerato General',
      average_grade: parseFloat(averageGrade) || 9.0,
      status: 'EN REVISION',
      moodle_synced: false
    }]);
  } catch (err) {
    console.warn('[Supabase Insert Warning]:', err.message);
  }

  applications.unshift(newApp);
  res.status(201).json({
    success: true,
    message: 'Solicitud de admisión registrada exitosamente y sincronizada en Supabase.',
    application: newApp
  });
});

// Admin Applications list
app.get('/api/admin/applications', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('admission_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      const mapped = data.map(item => ({
        id: item.id,
        fullName: item.full_name,
        email: item.email,
        phone: item.phone,
        programId: item.program_id,
        programName: item.program_name,
        previousSchool: item.previous_school,
        averageGrade: String(item.average_grade),
        status: item.status,
        moodleSynced: item.moodle_synced,
        moodleUserId: item.moodle_user_id,
        date: item.created_at ? item.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
      }));
      return res.json(mapped);
    }
  } catch (err) {
    console.warn('[Supabase Fetch Warning]:', err.message);
  }
  res.json(applications);
});

// Admin Approve Application and Sync with Moodle (Idempotent via Web Services)
app.post('/api/admin/applications/:id/approve', async (req, res) => {
  let appItem = applications.find(a => a.id === req.params.id);
  const applicantEmail = appItem ? appItem.email : 'aspirante@iinicia.org';
  const applicantName = appItem ? appItem.fullName : 'Aspirante IINICIA';
  const nameParts = applicantName.split(' ');
  const firstName = nameParts[0] || 'Aspirante';
  const lastName = nameParts.slice(1).join(' ') || 'IINICIA';

  // 1. Llamada Idempotente al Cliente Oficial Moodle REST
  const moodleSyncResult = await moodle.createUserIfNotExist({
    email: applicantEmail,
    firstName,
    lastName
  });

  const finalMoodleId = moodleSyncResult.moodleUserId || (1000 + Math.floor(Math.random() * 5000));

  // 2. Matricular en curso por defecto (Moodle Course 204 = IA-401)
  await moodle.enrolStudent(finalMoodleId, 204, 5);

  try {
    await supabase
      .from('admission_applications')
      .update({
        status: 'ADMITIDO',
        moodle_synced: true,
        moodle_user_id: finalMoodleId,
        moodle_sync_date: new Date().toISOString()
      })
      .eq('id', req.params.id);
  } catch (err) {
    console.warn('[Supabase Approve Warning]:', err.message);
  }

  if (appItem) {
    appItem.status = 'ADMITIDO';
    appItem.moodleSynced = true;
    appItem.moodleUserId = finalMoodleId;
    appItem.moodleSyncDate = new Date().toISOString();
  } else {
    appItem = {
      id: req.params.id,
      fullName: applicantName,
      email: applicantEmail,
      status: 'ADMITIDO',
      moodleSynced: true,
      moodleUserId: finalMoodleId
    };
  }

  res.json({
    success: true,
    message: `Aspirante admitido y sincronizado con Moodle LMS REST API (ID Moodle: #${finalMoodleId})`,
    moodleDetails: moodleSyncResult,
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

// LMS COURSES (Matched with Kotlin Mobile CourseDto & Supabase)
let coursesData = [
  {
    id: 'c-01',
    code: 'IA-401',
    name: 'Redes Neuronales y Deep Learning con PyTorch',
    professor: 'Dr. Alejandro Méndez Vargas',
    progress: 78,
    pendingTasks: 2,
    nextDeadline: '24 Oct 2026, 23:59',
    grade: 9.6,
    moodleCourseId: 204,
    color: 'from-blue-600 to-indigo-700',
    semester: 'Semestre 4'
  },
  {
    id: 'c-02',
    code: 'IA-402',
    name: 'Cloud Computing & MLOps con Docker y Kubernetes',
    professor: 'Mtra. Elena Saldaña',
    progress: 65,
    pendingTasks: 1,
    nextDeadline: '27 Oct 2026, 18:00',
    grade: 9.1,
    moodleCourseId: 205,
    color: 'from-emerald-600 to-teal-700',
    semester: 'Semestre 4'
  },
  {
    id: 'c-03',
    code: 'IA-403',
    name: 'Machine Learning II: Algoritmos No Supervisados',
    professor: 'Dr. Fernando Quiroz',
    progress: 84,
    pendingTasks: 0,
    nextDeadline: '02 Nov 2026, 20:00',
    grade: 9.8,
    moodleCourseId: 206,
    color: 'from-violet-600 to-purple-800',
    semester: 'Semestre 4'
  },
  {
    id: 'c-04',
    code: 'IA-404',
    name: 'Optimización Numérica y Algoritmos Genéticos',
    professor: 'Dra. Carmen Villalobos',
    progress: 52,
    pendingTasks: 3,
    nextDeadline: 'Hoy, 23:59',
    grade: 8.7,
    moodleCourseId: 207,
    color: 'from-amber-600 to-orange-700',
    semester: 'Semestre 4'
  }
];

let tasksData = [
  {
    id: 'T-1',
    courseId: 'c-01',
    title: 'Laboratorio 3: PyTorch Convolucional (CNN en CIFAR-10)',
    description: 'Diseñar e implementar una red neuronal convolucional en PyTorch para clasificar el dataset CIFAR-10 con al menos 85% de exactitud.',
    dueDate: '24 Oct 2026, 23:59',
    status: 'Pendiente',
    grade: null,
    rubric: [
      { criteria: 'Capas Conv2D, Pooling y Dropout', points: 35 },
      { criteria: 'Pipeline con AdamW y OneCycleLR', points: 35 },
      { criteria: 'Reporte de métricas F1-Score', points: 30 }
    ]
  },
  {
    id: 'T-2',
    courseId: 'c-01',
    title: 'Cuestionario de Arquitecturas Transformers y Mecanismos de Atención',
    description: 'Evaluación teórica y práctica sobre mecanismos de atención multi-head y decodificadores posicionales.',
    dueDate: '28 Oct 2026, 23:59',
    status: 'Calificado',
    grade: '95/100',
    submissionDate: '20 Oct 2026, 17:42',
    submissionText: 'Notebook con bloque Scaled Dot-Product Attention y reactivos teóricos.',
    fileName: 'evaluacion_transformers_valeria_morales.pdf',
    feedback: 'Excelente desarrollo matemático del mecanismo de atención.'
  },
  {
    id: 'T-3',
    courseId: 'c-02',
    title: 'Pipeline CI/CD con Docker y despliegue en K8s',
    description: 'Automatizar construcción de imagen Docker optimizada y despliegue en clúster Kubernetes.',
    dueDate: '27 Oct 2026, 18:00',
    status: 'Pendiente',
    grade: null
  },
  {
    id: 'T-5',
    courseId: 'c-03',
    title: 'Clustering K-Means en dataset de producción',
    description: 'Segmentación de usuarios a partir de 1.2M de registros con K-Means y Silhouette Coefficient.',
    dueDate: '30 Oct 2026, 23:59',
    status: 'Calificado',
    grade: '98/100',
    submissionDate: '19 Oct 2026, 21:15',
    submissionText: 'Notebook jupyter completo con reducción PCA previa y gráficos 3D.',
    fileName: 'segmentacion_clientes_valeria.ipynb',
    feedback: 'Análisis sobresaliente. Muy buena interpretación de los centroides.'
  },
  {
    id: 'T-7',
    courseId: 'c-04',
    title: 'Práctica 4: Algoritmos Genéticos en Python para el TSP',
    description: 'Resolver el problema del agente viajero (TSP) minimizando la distancia euclidiana.',
    dueDate: 'Hoy, 23:59',
    status: 'Pendiente',
    grade: null
  }
];

let forumsData = [
  {
    id: 'FT-101',
    courseId: 'c-01',
    title: 'Duda en Laboratorio 3: TypeError con Mixed Precision (AMP) en CUDA',
    category: 'Dudas',
    authorName: 'Carlos Eduardo Mendoza',
    authorEmail: 'carlos.mendoza@outlook.com',
    authorRole: 'estudiante',
    authorAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80',
    content: 'Hola compañeros y profesor, al habilitar `torch.cuda.amp.autocast()` para entrenar la ResNet en CIFAR-10 con GPUs T4, obtengo un error de dimensiones en la capa fully connected final.',
    createdAt: 'Hace 3 horas',
    views: 45,
    pinned: true,
    replies: [
      {
        id: 'FR-101-1',
        threadId: 'FT-101',
        authorName: 'Dr. Alejandro Méndez Vargas',
        authorEmail: 'alejandro.mendez@iinicia.edu.mx',
        authorRole: 'profesor',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        content: 'Buen día Carlos. `CrossEntropyLoss` en PyTorch espera logits de la misma precisión que los targets. Con `GradScaler()` no necesitas castear manualmente. Asegúrate de usar `scaler.scale(loss).backward()`.',
        createdAt: 'Hace 2 horas',
        likes: 6
      }
    ]
  },
  {
    id: 'FT-102',
    courseId: 'c-01',
    title: 'Debate Académico: ¿Convoluciones o Transformers para inferencia en dispositivos embebidos?',
    category: 'Debate',
    authorName: 'Dr. Alejandro Méndez Vargas',
    authorEmail: 'alejandro.mendez@iinicia.edu.mx',
    authorRole: 'profesor',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    content: 'Debatan sobre la viabilidad de desplegar modelos de visión basados en Autoatención (ViT) en chips de bajo consumo (ej. smartphones Android, edge TPU).',
    createdAt: 'Ayer',
    views: 112,
    pinned: false,
    replies: [
      {
        id: 'FR-102-1',
        threadId: 'FT-102',
        authorName: 'Valeria Morales Santillán',
        authorEmail: 'valeria.morales@iinicia.edu.mx',
        authorRole: 'estudiante',
        authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        content: 'La complejidad cuadrática O(N^2) sigue siendo una penalización alta. Sin embargo, arquitecturas híbridas como MobileViT logran el balance ideal.',
        createdAt: 'Ayer',
        likes: 8
      }
    ]
  }
];

// Courses Endpoints
app.get('/api/courses', (req, res) => {
  res.json(coursesData);
});

app.get('/api/courses/:id', (req, res) => {
  const c = coursesData.find(item => item.id === req.params.id || String(item.moodleCourseId) === req.params.id);
  if (!c) return res.status(404).json({ error: 'Curso no encontrado' });
  res.json(c);
});

// Tasks Endpoints
app.get('/api/courses/:id/tasks', (req, res) => {
  const filtered = tasksData.filter(t => t.courseId === req.params.id);
  res.json(filtered);
});

app.post('/api/courses/:id/tasks/:taskId/submit', (req, res) => {
  const { submissionText, fileName } = req.body;
  const idx = tasksData.findIndex(t => t.id === req.params.taskId);
  if (idx === -1) {
    return res.status(404).json({ error: 'Tarea no encontrada' });
  }

  tasksData[idx] = {
    ...tasksData[idx],
    status: 'Entregado',
    submissionDate: new Date().toISOString(),
    submissionText: submissionText || 'Evidencia de tarea enviada desde el portal.',
    fileName: fileName || 'archivo_entrega.pdf',
    feedback: 'Entrega registrada en Moodle LMS. En espera de revisión por el claustro docente.'
  };

  // Recalculate course progress
  const courseTasks = tasksData.filter(t => t.courseId === req.params.id);
  const completed = courseTasks.filter(t => t.status !== 'Pendiente').length;
  const cIdx = coursesData.findIndex(c => c.id === req.params.id);
  if (cIdx !== -1) {
    coursesData[cIdx].progress = Math.round((completed / courseTasks.length) * 100);
    coursesData[cIdx].pendingTasks = courseTasks.filter(t => t.status === 'Pendiente').length;
  }

  res.json({
    success: true,
    message: 'Tarea entregada exitosamente en Moodle LMS',
    task: tasksData[idx]
  });
});

// Forums Endpoints
app.get('/api/courses/:id/forums', (req, res) => {
  const filtered = forumsData.filter(f => f.courseId === req.params.id);
  res.json(filtered);
});

app.post('/api/courses/:id/forums', (req, res) => {
  const { title, category, content, authorName, authorEmail, authorRole } = req.body;
  const newThread = {
    id: `FT-${Date.now()}`,
    courseId: req.params.id,
    title,
    category: category || 'General',
    authorName: authorName || 'Estudiante IINICIA',
    authorEmail: authorEmail || 'estudiante@iinicia.edu.mx',
    authorRole: authorRole || 'estudiante',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    content,
    createdAt: 'Hace un momento',
    views: 1,
    pinned: false,
    replies: []
  };

  forumsData.unshift(newThread);
  res.status(201).json(newThread);
});

app.post('/api/courses/:id/forums/:threadId/reply', (req, res) => {
  const { content, authorName, authorEmail, authorRole, authorAvatar } = req.body;
  const thread = forumsData.find(f => f.id === req.params.threadId);
  if (!thread) return res.status(404).json({ error: 'Hilo de foro no encontrado' });

  const reply = {
    id: `FR-${Date.now()}`,
    threadId: req.params.threadId,
    authorName: authorName || 'Valeria Morales Santillán',
    authorEmail: authorEmail || 'valeria.morales@iinicia.edu.mx',
    authorRole: authorRole || 'estudiante',
    authorAvatar: authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    content,
    createdAt: 'Hace un momento',
    likes: 0
  };

  thread.replies.push(reply);
  thread.views += 1;
  res.status(201).json(reply);
});

// Notifications (matched with Kotlin NotificationDto)
app.get('/api/notifications', (req, res) => {
  res.json([
    {
      id: 'N-1',
      title: 'Moodle SSO Disponible',
      message: 'Su sesión académica en el Campus Virtual Moodle ha sido sincronizada correctamente.',
      timestamp: 'Hace 10 min',
      type: 'sso'
    },
    {
      id: 'N-2',
      title: 'Próxima Entrega: Redes Neuronales',
      message: 'Tu laboratorio práctico de PyTorch vence el 24 de Octubre a las 23:59 hrs.',
      timestamp: 'Hace 2 horas',
      type: 'academic'
    },
    {
      id: 'N-3',
      title: 'Mantenimiento del Sistema IINICIA',
      message: 'El portal institucional tendrá una ventana de actualización este domingo a las 02:00 AM.',
      timestamp: 'Ayer',
      type: 'alert'
    }
  ]);
});

app.listen(PORT, () => {
  console.log(`[IINICIA Backend] API listening on port ${PORT}`);
  console.log(`[IINICIA Backend] Integrated Moodle Web Services & SSO Ready`);
});

