import { Program, Course, AdmissionApplication, NewsItem, User, MoodleTask, ForumThread, CourseResource } from '../types';


export const DEMO_USERS: Record<string, User> = {
  estudiante: {
    id: 'usr-est-01',
    name: 'Valeria Morales Santillán',
    email: 'valeria.morales@iinicia.edu.mx',
    role: 'estudiante',
    matricula: 'IIN-2024-8842',
    programId: 'lic-ia-datos',
    programName: 'Licenciatura en Inteligencia Artificial y Ciencia de Datos',
    semester: 4,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    moodleId: 1042
  },
  aspirante: {
    id: 'usr-asp-02',
    name: 'Diego Armando Solís',
    email: 'diego.solis@gmail.com',
    role: 'aspirante',
    programId: 'ing-software-cloud',
    programName: 'Ingeniería en Desarrollo de Software y Arquitectura Cloud',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80'
  },
  profesor: {
    id: 'usr-doc-03',
    name: 'Dr. Alejandro Méndez Vargas',
    email: 'alejandro.mendez@iinicia.edu.mx',
    role: 'profesor',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
  },
  coordinador: {
    id: 'usr-coord-04',
    name: 'Dra. Sofía Alarcón Ruiz',
    email: 'sofia.alarcon@iinicia.edu.mx',
    role: 'coordinador',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80'
  },
  admin: {
    id: 'usr-adm-05',
    name: 'Ing. Roberto Peña Guzmán',
    email: 'admin.sistemas@iinicia.edu.mx',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80'
  }
};

export const MOCK_PROGRAMS: Program[] = [
  {
    id: 'lic-ia-datos',
    title: 'Licenciatura en Inteligencia Artificial y Ciencia de Datos',
    degree: 'Licenciatura',
    area: 'Tecnología & IA',
    duration: '8 Semestres (4 años)',
    modality: 'Híbrida y 100% Online con Mentorías',
    credits: 320,
    rvoe: 'RVOE-SEP-2026-IA01',
    description: 'Diseñada con directores de ingeniería de Google, Microsoft y OpenAI para preparar a la nueva generación de científicos e ingenieros en machine learning, deep learning y arquitecturas de agentes autónomos.',
    objectives: 'Dominar la modelación matemática, visión computacional, procesamiento de lenguaje natural y el despliegue ético de modelos a gran escala en producción.',
    fieldWork: 'MLOps Engineer, Lead Data Scientist, AI Solutions Architect, Investigador en Modelos Fundacionales.',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80',
    featured: true,
    syllabus: [
      { semester: '1er Semestre', courses: ['Fundamentos de Algoritmos y Python Científico', 'Álgebra Lineal Computacional', 'Estructuras Discretas', 'Ética en Tecnologías Disruptivas', 'Inglés Técnico I'] },
      { semester: '2do Semestre', courses: ['Cálculo Multivariable para IA', 'Bases de Datos Relacionales y NoSQL', 'Programación Orientada a Objetos Avanzada', 'Probabilidad y Estadística Aplicada', 'Inglés Técnico II'] },
      { semester: '3er Semestre', courses: ['Machine Learning I (Algoritmos Supervisados)', 'Ingeniería de Características y Limpieza de Datos', 'Estructuras de Datos y Algoritmos Complejos', 'Visualización de Datos y Storytelling'] },
      { semester: '4to Semestre', courses: ['Machine Learning II (No Supervisado y Ensambles)', 'Redes Neuronales y Deep Learning con PyTorch', 'Cloud Computing & MLOps con Docker/K8s', 'Optimización Numérica'] },
      { semester: '5to Semestre', courses: ['Procesamiento del Lenguaje Natural (NLP)', 'Visión por Computadora y Reconocimiento Facial', 'Big Data Engineering con Apache Spark', 'Seguridad y Privacidad en Sistemas de IA'] },
      { semester: '6to Semestre', courses: ['Modelos de Lenguaje Grandes (LLMs) & RAG', 'Aprendizaje por Refuerzo Profundo', 'Arquitectura de Datos Empresariales', 'Gestión de Proyectos Ágiles'] },
      { semester: '7mo Semestre', courses: ['IA Generativa y Sistemas Autónomos', 'Taller de Innovación y Patentes', 'Práctica Profesional Supervisada I', 'Seminario de Investigación y Tesis'] },
      { semester: '8vo Semestre', courses: ['Proyecto Integrador Capstone de Grado', 'Gobernanza y Regulación Internacional de IA', 'Práctica Profesional Supervisada II', 'Examen Profesional'] }
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
    description: 'Aprende a concebir, programar y desplegar soluciones de software empresariales utilizando microservicios distribuidos, DevOps automatizado, Kubernetes y las mejores prácticas de la industria.',
    objectives: 'Desarrollar aplicaciones full-stack resilientes y escalables bajo arquitecturas limpias (Clean Architecture y DDD) con cobertura total de pruebas.',
    fieldWork: 'Cloud Architect, Senior Full-Stack Developer, DevOps Engineer, Site Reliability Engineer (SRE).',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
    featured: true,
    syllabus: [
      { semester: '1er Semestre', courses: ['Fundamentos de Programación con TypeScript', 'Arquitectura de Computadoras', 'Matemáticas Discretas', 'Comunicación Profesional en TI'] },
      { semester: '2do Semestre', courses: ['Frontend Moderno con React y Next.js', 'Bases de Datos y Modelado SQL', 'Cálculo Diferencial', 'Sistemas Operativos y Shell Scripting'] },
      { semester: '3er Semestre', courses: ['Backend con Node.js & NestJS', 'Patrones de Diseño de Software', 'Redes de Datos y Protocolos HTTP/WebSockets', 'Ingeniería de Requisitos'] },
      { semester: '4to Semestre', courses: ['Microservicios y Docker Containers', 'Arquitectura Hexagonal & DDD', 'Bases de Datos NoSQL y Redis Cache', 'Pruebas Automatizadas y TDD'] },
      { semester: '5to Semestre', courses: ['DevOps & Pipelines CI/CD con GitHub Actions', 'Desarrollo Móvil con Kotlin y Compose', 'Ciberseguridad Aplicada y OWASP Top 10', 'Cloud Computing AWS / Google Cloud'] },
      { semester: '6to Semestre', courses: ['Kubernetes y Orquestación de Cargas', 'Arquitecturas Serverless y Event-Driven', 'Gobernanza de APIs GraphQL & gRPC', 'Liderazgo de Equipos de Ingeniería'] },
      { semester: '7mo Semestre', courses: ['Sistemas Distribuidos de Alta Tolerancia', 'Consultoría de Software y Startups', 'Residencia Profesional I', 'Metodología de Titulación'] },
      { semester: '8vo Semestre', courses: ['Proyecto Capstone Empresarial', 'Auditoría y Certificación de Software', 'Residencia Profesional II', 'Defensa de Proyecto'] }
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
    description: 'Transforma la manera en que operan las organizaciones a través de la digitalización, modelos de suscripción, fintech, marketing de rendimiento y comercio electrónico sin fronteras.',
    objectives: 'Idear y operar modelos de negocio digitales rentables y data-driven en mercados hipercompetitivos.',
    fieldWork: 'Chief Digital Officer, Product Manager, Growth Marketing Lead, Consultor de Negocios Digitales.',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    featured: true,
    syllabus: [
      { semester: '1er Semestre', courses: ['Economía Digital y Plataformas', 'Fundamentos de Negocios y Estrategia', 'Contabilidad para Startups', 'Mentalidad Emprendedora'] },
      { semester: '2do Semestre', courses: ['E-Commerce y Omnicanalidad Global', 'Marketing de Crecimiento (Growth)', 'Finanzas Corporativas Digitales', 'Derecho Digital y Protección de Datos'] },
      { semester: '3er Semestre', courses: ['Product Management & Metodología Scrum', 'Business Analytics con SQL y PowerBI', 'Fintech, Criptoeconomía y Pagos Digitales', 'Estrategia de Monetización'] },
      { semester: '4to Semestre', courses: ['Cadena de Suministro Digital', 'Diseño de Experiencia de Cliente (CX)', 'Negociación y Venture Capital', 'Liderazgo en Equipos Remotos'] }
    ]
  },
  {
    id: 'dip-ciberseguridad',
    title: 'Diplomado Ejecutivo en Ciberseguridad Defensiva y DevSecOps',
    degree: 'Diplomado',
    area: 'Tecnología & IA',
    duration: '6 Meses (120 horas)',
    modality: 'En Línea Sincrónico',
    credits: 45,
    rvoe: 'REG-DIPL-2026-SEC',
    description: 'Capacitación táctica intensiva para defender infraestructuras corporativas, orquestar auditorías de seguridad, responder ante incidentes de ransomware y blindar pipelines CI/CD.',
    objectives: 'Implementar controles robustos bajo el framework NIST, ISO 27001 y técnicas del MITRE ATT&CK.',
    fieldWork: 'Analista de Seguridad SOC, DevSecOps Engineer, Auditor de Vulnerabilidades.',
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
    featured: false,
    syllabus: [
      { semester: 'Módulo 1', courses: ['Threat Intelligence y Vectores de Ataque', 'Arquitectura Zero Trust y Gestión de Identidades'] },
      { semester: 'Módulo 2', courses: ['Seguridad en Contenedores y Kubernetes', 'Integración de Herramientas SAST/DAST en CI/CD'] },
      { semester: 'Módulo 3', courses: ['Forense Digital y Respuesta a Incidentes', 'Criptografía y Simulacro Red Team vs Blue Team'] }
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
    description: 'Valida tus conocimientos prácticos en el diseño, despliegue y monitoreo de microservicios tolerantes a fallos con AWS, GCP y contenedores Docker.',
    objectives: 'Aprobar el examen de certificación con proyectos prácticos reales en la nube.',
    fieldWork: 'Cloud Associate, Ingeniero DevOps Jr.',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    featured: false,
    syllabus: [
      { semester: 'Fase I', courses: ['Principios de Cloud Networking y VPCs', 'Infraestructura como Código con Terraform'] },
      { semester: 'Fase II', courses: ['Monitoreo y Métricas con Prometheus y Grafana', 'Examen de Certificación Oficial'] }
    ]
  }
];

export const MOCK_STUDENT_COURSES: Course[] = [
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
    color: 'from-blue-600 to-indigo-700'
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
    color: 'from-emerald-600 to-teal-700'
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
    color: 'from-violet-600 to-purple-800'
  },
  {
    id: 'c-04',
    code: 'IA-404',
    name: 'Optimización Numérica y Algoritmos Genéticos',
    professor: 'Dra. Carmen Villalobos',
    progress: 52,
    pendingTasks: 3,
    nextDeadline: '22 Oct 2026, 23:59',
    grade: 8.7,
    moodleCourseId: 207,
    color: 'from-amber-600 to-orange-700'
  }
];

export const MOCK_APPLICATIONS: AdmissionApplication[] = [
  {
    id: 'SOL-2026-0891',
    fullName: 'Mariana Ríos Cruz',
    email: 'mariana.rios@gmail.com',
    phone: '+52 55 4892 1102',
    programId: 'lic-ia-datos',
    programName: 'Licenciatura en Inteligencia Artificial y Ciencia de Datos',
    previousSchool: 'Colegio de Ciencias y Humanidades Plantel Sur',
    averageGrade: '9.4',
    status: 'ADMITIDO',
    moodleSynced: true,
    moodleUserId: 1042,
    date: '2026-10-15'
  },
  {
    id: 'SOL-2026-0892',
    fullName: 'Carlos Eduardo Mendoza',
    email: 'carlos.mendoza@outlook.com',
    phone: '+52 33 1290 8821',
    programId: 'ing-software-cloud',
    programName: 'Ingeniería en Desarrollo de Software y Arquitectura Cloud',
    previousSchool: 'Preparatoria Federal Lázaro Cárdenas',
    averageGrade: '8.9',
    status: 'EN REVISION',
    moodleSynced: false,
    moodleUserId: null,
    date: '2026-10-18'
  },
  {
    id: 'SOL-2026-0893',
    fullName: 'Valeria Guadalupe Domínguez',
    email: 'valeria.dominguez@gmail.com',
    phone: '+52 81 9921 4455',
    programId: 'lic-gestion-negocios',
    programName: 'Licenciatura en Negocios Digitales y Transformación Organizacional',
    previousSchool: 'Instituto Tecnológico Regional',
    averageGrade: '9.1',
    status: 'PENDIENTE',
    moodleSynced: false,
    moodleUserId: null,
    date: '2026-10-19'
  }
];

export const MOCK_NEWS: NewsItem[] = [
  {
    id: 'noticia-1',
    title: 'IINICIA inaugura su renovada infraestructura digital desacoplada con React y Moodle',
    date: '18 de Octubre, 2026',
    category: 'Institucional',
    summary: 'La institución retira la dependencia operativa de WordPress en favor de una arquitectura moderna, segura y con Single Sign-On unificado.',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
    content: 'El Instituto Internacional de Innovación y Ciencias Aplicadas (IINICIA) ha dado a conocer su nueva plataforma tecnológica universitaria. Gracias a una arquitectura desacoplada basada en React y Next.js para la experiencia web institucional, un backend robusto en Node.js, y Moodle como motor LMS de clase mundial, los más de 12,000 estudiantes y docentes disfrutarán de una sola identidad digital y navegación fluida entre todos los servicios académicos.'
  },
  {
    id: 'noticia-2',
    title: 'Abierta la Convocatoria de Becas de Excelencia 2026-2027',
    date: '12 de Octubre, 2026',
    category: 'Admisiones',
    summary: 'Se otorgarán apoyos económicos del 40% al 70% a los aspirantes con promedios superiores a 9.0 en programas tecnológicos.',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
    content: 'Comprometidos con democratizar el acceso a la educación superior de vanguardia, IINICIA pone a disposición de la comunidad estudiantil su fondo de becas de impulso tecnológico. El registro se realiza íntegramente desde el nuevo portal web y la resolución se notificará en un plazo máximo de 72 horas hábiles.'
  },
  {
    id: 'noticia-3',
    title: 'Alianza Estratégica con Centros de Investigación de Inteligencia Artificial',
    date: '05 de Octubre, 2026',
    category: 'Investigación',
    summary: 'Docentes y alumnos de IINICIA podrán acceder a clústeres de cómputo GPU de última generación para proyectos de tesis.',
    image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
    content: 'Con el objetivo de consolidar las prácticas de la Licenciatura en Inteligencia Artificial y Ciencia de Datos, IINICIA formalizó un acuerdo de colaboración que provee acceso a infraestructura especializada para el entrenamiento de redes neuronales y modelos fundacionales.'
  }
];

export const MOCK_TASKS: MoodleTask[] = [
  // C-01: PyTorch & Deep Learning
  {
    id: 'T-1',
    courseId: 'c-01',
    title: 'Laboratorio 3: PyTorch Convolucional (CNN en CIFAR-10)',
    description: 'Diseñar e implementar una arquitectura de red convolucional profunda en PyTorch para la clasificación de 10 clases en CIFAR-10. Debe alcanzar al menos un 85% de precisión en test set, utilizando Dropout, BatchNorm y técnicas de data augmentation.',
    dueDate: '24 Oct 2026, 23:59',
    status: 'Pendiente',
    grade: null,
    rubric: [
      { criteria: 'Definición de capas Conv2D, Pooling y Dropout en PyTorch', points: 35 },
      { criteria: 'Pipeline de entrenamiento con optimizador AdamW y OneCycleLR', points: 35 },
      { criteria: 'Matriz de confusión y reporte de métricas F1-Score', points: 30 }
    ]
  },
  {
    id: 'T-2',
    courseId: 'c-01',
    title: 'Cuestionario de Arquitecturas Transformers y Mecanismos de Atención',
    description: 'Evaluación teórica y práctica sobre mecanismos de atención multi-head attention y decodificadores posicionales.',
    dueDate: '28 Oct 2026, 23:59',
    status: 'Calificado',
    grade: '95/100',
    submissionDate: '20 Oct 2026, 17:42',
    submissionText: 'Se adjunta el notebook con la implementación del bloque Scaled Dot-Product Attention y respuestas a los 10 reactivos teóricos.',
    fileName: 'evaluacion_transformers_valeria_morales.pdf',
    feedback: 'Excelente desarrollo matemático del mecanismo de atención y correcta explicación del cálculo de gradientes. Felicitaciones.'
  },
  {
    id: 'T-3-b',
    courseId: 'c-01',
    title: 'Proyecto Integrador Capstone: Detección de Anomalías Médicas con Vision Transformers',
    description: 'Propuesta de arquitectura y pipeline experimental utilizando ViT (Vision Transformer) preentrenado para la detección temprana de anomalías en radiografías de tórax.',
    dueDate: '15 Nov 2026, 23:59',
    status: 'Pendiente',
    grade: null,
    rubric: [
      { criteria: 'Fundamentación del estado del arte', points: 30 },
      { criteria: 'Pipeline de preprocesamiento e inferencia', points: 40 },
      { criteria: 'Métricas de sensibilidad y especificidad', points: 30 }
    ]
  },

  // C-02: Cloud & MLOps
  {
    id: 'T-3',
    courseId: 'c-02',
    title: 'Pipeline CI/CD con Docker y despliegue en K8s',
    description: 'Automatizar el ciclo de vida de un microservicio de inferencia: construir contenedor Docker optimizado multi-stage, ejecutar linter y tests unitarios, y desplegar en un clúster de Kubernetes con manifiesto Deployment y Service.',
    dueDate: '27 Oct 2026, 18:00',
    status: 'Pendiente',
    grade: null,
    rubric: [
      { criteria: 'Dockerfile con imagen distroless de mínimo tamaño', points: 35 },
      { criteria: 'Workflow automatizado en GitHub Actions', points: 35 },
      { criteria: 'Manifiestos K8s con liveness y readiness probes', points: 30 }
    ]
  },
  {
    id: 'T-4',
    courseId: 'c-02',
    title: 'Orquestación de Microservicios con Helm Charts y Nginx Ingress',
    description: 'Empaquetar la solución completa en un Helm Chart versionado con valores configurables para ambientes dev/staging/prod.',
    dueDate: '04 Nov 2026, 23:59',
    status: 'Pendiente',
    grade: null,
    rubric: [
      { criteria: 'Estructura modular de templates de Helm', points: 50 },
      { criteria: 'Validación de tls ingress y balanceo de carga', points: 50 }
    ]
  },

  // C-03: Machine Learning II
  {
    id: 'T-5',
    courseId: 'c-03',
    title: 'Clustering K-Means en dataset de producción',
    description: 'Segmentación de perfiles de usuarios a partir de 1.2M de registros. Identificación de número k óptimo con el método del codo y validación con Silhouette Coefficient.',
    dueDate: '30 Oct 2026, 23:59',
    status: 'Calificado',
    grade: '98/100',
    submissionDate: '19 Oct 2026, 21:15',
    submissionText: 'Notebook jupyter completo con reducción PCA previa y gráficos interactivos 3D.',
    fileName: 'segmentacion_clientes_valeria.ipynb',
    feedback: 'Análisis sobresaliente. Muy buena interpretación de los centroides y valor para la toma de decisiones empresariales.'
  },
  {
    id: 'T-6',
    courseId: 'c-03',
    title: 'Reducción de Dimensionalidad no lineal con t-SNE y UMAP',
    description: 'Estudio comparativo de preservación de topología local vs global en datos de alta dimensionalidad.',
    dueDate: '08 Nov 2026, 23:59',
    status: 'Pendiente',
    grade: null,
    rubric: [
      { criteria: 'Ajuste de hiperparámetros de perplejidad', points: 50 },
      { criteria: 'Visualización clara e informe comparativo', points: 50 }
    ]
  },

  // C-04: Optimización Numérica
  {
    id: 'T-7',
    courseId: 'c-04',
    title: 'Práctica 4: Algoritmos Genéticos en Python para el TSP',
    description: 'Resolver el problema del agente viajero (Traveling Salesperson Problem) de 50 nodos minimizando la distancia euclidiana mediante selección por torneo, cruce por orden (OX) y mutación swap.',
    dueDate: 'Hoy, 23:59',
    status: 'Pendiente',
    grade: null,
    rubric: [
      { criteria: 'Función de fitness y modelado de cromosomas', points: 30 },
      { criteria: 'Operadores genéticos libres de bucles infinitos', points: 40 },
      { criteria: 'Gráfica de convergencia y mejor ruta encontrada', points: 30 }
    ]
  },
  {
    id: 'T-8',
    courseId: 'c-04',
    title: 'Laboratorio de Descenso Estocástico y Adam Optimizer desde Cero',
    description: 'Programación matricial en NumPy del optimizador Adam con corrección de sesgo para primer y segundo momento.',
    dueDate: '05 Nov 2026, 23:59',
    status: 'Pendiente',
    grade: null
  }
];

export const MOCK_FORUM_THREADS: ForumThread[] = [
  // C-01 Threads
  {
    id: 'FT-101',
    courseId: 'c-01',
    title: 'Duda en Laboratorio 3: TypeError con Mixed Precision (AMP) en CUDA',
    category: 'Dudas',
    authorName: 'Carlos Eduardo Mendoza',
    authorEmail: 'carlos.mendoza@outlook.com',
    authorRole: 'estudiante',
    authorAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80',
    content: 'Hola compañeros y profesor, al habilitar `torch.cuda.amp.autocast()` para entrenar la ResNet en CIFAR-10 con GPUs T4, obtengo un error de dimensiones en la capa fully connected final. ¿Es necesario hacer un cast explícito a float32 antes de pasar la pérdida al criterion CrossEntropyLoss?',
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
        content: 'Buen día Carlos. Efectivamente, `CrossEntropyLoss` en PyTorch espera que los logits tengan la misma precisión numérica que los targets. En general, con `GradScaler()` no necesitas castear manualmente a menos que tengas un hook personalizado. Asegúrate de ejecutar `scaler.scale(loss).backward()` y luego `scaler.step(optimizer)`. En la clase del jueves revisamos un ejemplo idéntico.',
        createdAt: 'Hace 2 horas',
        likes: 6
      },
      {
        id: 'FR-101-2',
        threadId: 'FT-101',
        authorName: 'Valeria Morales Santillán',
        authorEmail: 'valeria.morales@iinicia.edu.mx',
        authorRole: 'estudiante',
        authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        content: 'A mí me pasó lo mismo Carlos, el tip del profesor resuelve el problema, pero además recuerda no aplicar `softmax` manual al final de la red porque `CrossEntropyLoss` ya lo incluye por dentro.',
        createdAt: 'Hace 45 minutos',
        likes: 3
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
    content: 'Abran este espacio para debatir la viabilidad de desplegar modelos de visión basados puramente en Autoatención (ViT) en chips de bajo consumo (ej. microcontroladores, edge TPU, smartphones Android). ¿Qué ventajas o desventajas prácticas identifican frente a MobileNetV4 o ConvNeXt?',
    createdAt: 'Ayer a las 10:15',
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
        content: 'Desde mi perspectiva, la complejidad cuadrática del mecanismo de self-attention O(N^2) en función del tamaño de los parches sigue siendo una penalización alta para dispositivos móviles con poca memoria RAM compartida. Sin embargo, arquitecturas como MobileViT que intercalan bloques de convolución para capturar contexto espacial local y atención global logran el balance ideal.',
        createdAt: 'Ayer a las 14:30',
        likes: 8
      }
    ]
  },

  // C-02 Threads
  {
    id: 'FT-201',
    courseId: 'c-02',
    title: 'Aviso: Clúster Kubernetes para prácticas de laboratorio habilitado',
    category: 'Avisos',
    authorName: 'Mtra. Elena Saldaña',
    authorEmail: 'elena.saldana@iinicia.edu.mx',
    authorRole: 'profesor',
    authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    content: 'Estimados ingenieros: Se han generado los namespaces dedicados para cada equipo en el clúster institucional. Podrán descargar su archivo `kubeconfig` autenticándose con su correo IINICIA en el portal de laboratorios.',
    createdAt: 'Hace 2 días',
    views: 78,
    pinned: true,
    replies: []
  },
  {
    id: 'FT-202',
    courseId: 'c-02',
    title: 'Consulta sobre políticas de Resource Quotas en Kubernetes',
    category: 'Dudas',
    authorName: 'Diego Armando Solís',
    authorEmail: 'diego.solis@gmail.com',
    authorRole: 'aspirante',
    authorAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80',
    content: '¿Cuál es el límite recomendado de memoria y CPU para el pod de inferencia FastAPI en el laboratorio 2 para evitar el OOMKilled de Kubernetes?',
    createdAt: 'Hace 1 día',
    views: 34,
    pinned: false,
    replies: [
      {
        id: 'FR-202-1',
        threadId: 'FT-202',
        authorName: 'Mtra. Elena Saldaña',
        authorEmail: 'elena.saldana@iinicia.edu.mx',
        authorRole: 'profesor',
        authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
        content: 'Configura requests en 500m CPU y 512Mi RAM, con limits en 1000m CPU y 1Gi RAM. Con eso tu contenedor de FastAPI procesará hasta 50 req/s sin problemas.',
        createdAt: 'Hace 18 horas',
        likes: 4
      }
    ]
  },

  // C-04 Threads
  {
    id: 'FT-401',
    courseId: 'c-04',
    title: 'Recomendaciones para evitar mínimos locales en Algoritmos Genéticos',
    category: 'Dudas',
    authorName: 'Mariana Ríos Cruz',
    authorEmail: 'mariana.rios@gmail.com',
    authorRole: 'estudiante',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    content: 'En la práctica de hoy para el TSP, mi población converge muy rápido en la generación 40 pero se queda atascada en un recorrido subóptimo de 7,800 km. ¿Recomiendan aumentar la tasa de mutación o cambiar a selección por ruleta?',
    createdAt: 'Hace 4 horas',
    views: 29,
    pinned: false,
    replies: [
      {
        id: 'FR-401-1',
        threadId: 'FT-401',
        authorName: 'Dra. Carmen Villalobos',
        authorEmail: 'carmen.villalobos@iinicia.edu.mx',
        authorRole: 'profesor',
        authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
        content: 'Hola Mariana. La selección por ruleta tiende a sufrir presión de selección prematura. Te sugiero implementar un esquema de torneo con k=3 e introducir una tasa de mutación adaptativa decreciente (inicia en 0.25 y reduce gradualmente). ¡Pruébalo y nos comentas!',
        createdAt: 'Hace 2 horas',
        likes: 5
      }
    ]
  }
];

export const MOCK_RESOURCES: CourseResource[] = [
  // C-01 Resources
  {
    id: 'R-01',
    courseId: 'c-01',
    unit: 'Bloque General',
    title: 'Syllabus Oficial y Rúbricas de Evaluación (RVOE SEP-2026-IA01)',
    type: 'pdf',
    date: '15 Octubre 2026',
    description: 'Guía metodológica, bibliografía recomendada (Goodfellow et al.) y criterios de ponderación.'
  },
  {
    id: 'R-02',
    courseId: 'c-01',
    unit: 'Unidad 1',
    title: 'Clase Magistral: De la Neurona Biológica al Perceptrón Multicapa',
    type: 'video',
    duration: '48 min',
    date: '17 Octubre 2026',
    description: 'Grabación de alta definición impartida por el Dr. Méndez explicando la regla de actualización de pesos Delta.'
  },
  {
    id: 'R-03',
    courseId: 'c-01',
    unit: 'Unidad 1',
    title: 'Lectura Obligatoria: Arquitectura de Redes Feed-Forward y Backpropagation',
    type: 'pdf',
    date: '18 Octubre 2026',
    description: 'Documento técnico con derivaciones analíticas del gradiente mediante regla de la cadena multivariable.'
  },
  {
    id: 'R-04',
    courseId: 'c-01',
    unit: 'Unidad 2',
    title: 'Laboratorio Virtual PyTorch en GPU T4 (Simulador Interactivo)',
    type: 'lab',
    date: 'Permanente',
    description: 'Ambiente interactivo preconfigurado con tensores, optimizadores y dataset de prueba.'
  },

  // C-02 Resources
  {
    id: 'R-05',
    courseId: 'c-02',
    unit: 'Bloque General',
    title: 'Guía de Arquitectura de Microservicios Cloud Native (CNCF Landscape)',
    type: 'pdf',
    date: '12 Octubre 2026',
    description: 'Estándares abiertos de contenedores OCI, CNI y CSI en clústeres empresariales.'
  },
  {
    id: 'R-06',
    courseId: 'c-02',
    unit: 'Unidad 1',
    title: 'Masterclass: Creación de Pipelines CI/CD con GitHub Actions y Docker',
    type: 'video',
    duration: '54 min',
    date: '16 Octubre 2026',
    description: 'Paso a paso para construir imágenes seguras, escaneo Trivy y push a Google Artifact Registry.'
  }
];

