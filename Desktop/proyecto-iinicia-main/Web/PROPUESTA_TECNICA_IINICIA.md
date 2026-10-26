# PROPUESTA TÉCNICA Y ARQUITECTÓNICA DE REDISEÑO Y MIGRACIÓN
## Plataforma Digital Universitaria IINICIA (Web + Backend Node.js + Moodle LMS)

**Documento elaborado para:** Consejo Académico y Dirección de Tecnología IINICIA  
**Versión:** 1.0 — Octubre 2026  
**Tecnologías:** React 19, TypeScript, Tailwind CSS, Node.js / Express, Moodle 4.x (REST API), Keycloak OIDC  

---

## 1. Resumen Ejecutivo y Diagnóstico

El Instituto Internacional de Innovación y Ciencias Aplicadas (**IINICIA**) requiere sustituir su portal actual basado en WordPress por una plataforma digital moderna, desacoplada y de alta disponibilidad.

### Diagnóstico de la Situación Actual (WordPress Legacy):
* **Cuello de botella monolítico:** Sobrecarga de plugins de terceros (ej. Edwiser Bridge) propensos a fallos y brechas de seguridad.
* **Experiencia fragmentada:** El alumno y el aspirante gestionaban múltiples accesos y credenciales separadas entre la web y el aula virtual.
* **Lentitud y escasa optimización móvil:** Tiempos de carga elevados que afectaban la indexación SEO y la conversión de aspirantes.

### Principio Rector de la Solución Propuesta:
> **“Una sola identidad, una sola experiencia, múltiples canales de acceso.”**

La nueva arquitectura retira permanentemente a WordPress de la capa operativa y establece:
1. **Portal Web Institucional en React / TypeScript:** Rendimiento extremo, diseño responsive y accesible (WCAG 2.2 AA), y portal de autoservicio estudiantil (*Mi IINICIA*).
2. **Backend for Frontend (BFF) en Node.js:** Capa intermedia que centraliza las reglas de negocio, custodia las credenciales administrativas de Moodle y orquesta el Single Sign-On (SSO).
3. **Moodle LMS como Núcleo Académico:** Dedicado exclusivamente a la gestión pedagógica, tareas, foros, cohortes y evaluaciones, consumido mediante sus servicios web REST oficiales.

---

## 2. Arquitectura de la Solución

```
+-----------------------------------------------------------------------------------+
|                                 USUARIOS IINICIA                                  |
|            (Aspirantes, Estudiantes, Profesores, Coordinadores, Admins)           |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v  [HTTPS / TLS 1.3]
+-----------------------------------------------------------------------------------+
|                        PORTAL INSTITUCIONAL (REACT + VITE)                        |
|   • Sitio Público (Inicio, Universidad, Oferta Académica, Admisiones, Noticias)   |
|   • Mi IINICIA (Dashboard del Estudiante, Kardex, Credencial Digital, Avisos)     |
|   • Panel Administrativo (Dictamen de Aspirantes, Sincronización Moodle, CMS)     |
+-----------------------------------------+-----------------------------------------+
                                          |
                         [REST / JSON]    |    [OIDC SSO Ticket]
                                          v
+-----------------------------------------------------------------------------------+
|                             BACKEND IINICIA (NODE.JS)                             |
|   • Validación de Entrada & Rate Limiting                                         |
|   • Control de Acceso Basado en Roles (RBAC)                                      |
|   • Orquestación Idempotente con Moodle Web Services                              |
|   • Gestión de Secretos y Tokens (Ningún secreto expuesto al navegador)          |
+------------------------+----------------------------------+-----------------------+
                         |                                  |
         [PostgreSQL]    v                                  v   [Moodle REST API]
+---------------------------------+        +----------------------------------------+
|      BASE DE DATOS PORTAL       |        |             MOODLE 4.x LMS             |
|   • Identidades & UUIDs         |        |   • aula.iinicia.org                   |
|   • Solicitudes de Admisión     |        |   • Tema Edwiser RemUI / Boost         |
|   • Mapeos de Cohortes          |        |   • Cursos, Foros y Evaluaciones       |
|   • Auditoría de Acciones       |        |   • Matrículas por Servicios Web       |
+---------------------------------+        +----------------------------------------+
```

---

## 3. Sistema de Diseño UX/UI (Design System IINICIA)

Se ha creado una identidad visual universitaria de vanguardia, alejada de plantillas genéricas:

* **Nombre Oficial de Marca:** **I²NICIA** (*Instituto de Innovación y Ciencias Aplicadas*).
* **Paleta Cromática Oficial (Mapeo 1:1 con el Logotipo Institucional):**
  * **Cyan Eléctrico Institucional (*Brand Cyan*):** `#22ABE2` — Extraído directamente del símbolo infinito de nodos y red del logotipo oficial. Utilizado en llamados a la acción (CTAs), barras de progreso, iconos de estado y bordes activos.
  * **Negro Puro & Dark Navy (*Brand Black*):** `#000000`, `#05080F` y `#09101D` — Utilizado para los textos principales, barras de navegación oscuras, tipografía y fondos de alto contraste.
  * **Cyan Tints para Fondos y Badges:** `#E0F3FB` (10% opacidad) y `#7DD3F1` para etiquetas de estatus, pastillas de roles y sombras luminosas.
  * **Blanco Puro (*Pure White*):** `#FFFFFF` para tarjetas, modales y legibilidad limpia sobre fondos neutrales `#F8FAFC`.
* **Tipografía:** *Plus Jakarta Sans* para encabezados e impacto visual; *Inter* para lectura continua de textos académicos y tablas de datos.
* **Accesibilidad (WCAG 2.2 AA):**
  * Ratios de contraste superiores a 4.5:1 en todo elemento textual.
  * Foco de navegación accesible por teclado.
  * Formularios con etiquetas explícitas y textos alternativos en multimedia.
* **Enfoque Mobile First:** Comportamiento fluido desde 360 px (pantallas móviles) hasta monitores ultrawide 4K.

---

## 4. Módulos y Flujos Implementados en la Aplicación Web

### 4.1. Portal Público Institucional
1. **Página de Inicio (Home):**
   * Hero de alto impacto con buscador interactivo de carreras y diplomados.
   * Indicadores clave (12,000+ estudiantes, 98.4% empleabilidad, 100% RVOE SEP, 24/7 campus virtual).
   * Sección *"Evolución Tecnológica"*: explica la ventaja de sustituir WordPress por React + Moodle.
   * Carreras destacadas con previsualización de modalidad y duración.
   * Gaceta universitaria y comunicados recientes.
2. **Universidad:**
   * Misión, visión, valores y modelo pedagógico de 4 pilares.
   * Claustro docente y consejo directivo con credenciales profesionales.
   * Acreditaciones y validez oficial RVOE.
3. **Oferta Académica:**
   * Buscador en tiempo real por palabra clave.
   * Filtros combinados por Nivel (Licenciatura, Ingeniería, Diplomado, Certificación) y Área temática.
   * Tarjetas con planes de estudio, horas y modalidad.
4. **Detalle de Programa / Carrera:**
   * Malla curricular completa con acordeón semestral interactivo desplegable materia por materia.
   * Perfil de ingreso, egreso y campo laboral.
   * Ficha técnica oficial y botón directo de postulación.
5. **Admisiones:**
   * Diagrama explicativo del proceso institucional en 5 pasos.
   * **Formulario interactivo de registro** con validaciones y generación de folio único (`SOL-2026-XXXX`).
   * Acordeón de preguntas frecuentes (FAQs).
6. **Noticias & Contacto:**
   * Gaceta con filtrado por categoría y vista expandida de comunicados.
   * Directorio oficial multicanal (WhatsApp, admisiones, soporte TI, sede) y formulario de contacto.

### 4.2. Portal del Estudiante ("Mi IINICIA")
* **Bienvenida y Perfil:** Estado de alumno regular, matrícula oficial (`IIN-2024-XXXX`), promedio ponderado y avance curricular.
* **Credencial Digital Estudiantil:** Visualizador interactivo de carnet universitario con código QR de verificación oficial.
* **Cursos Matriculados:** Listado de asignaturas con avance porcentual, calificación parcial y acceso directo al aula virtual mediante SSO.
* **Próximas Entregas:** Calendario de tareas y laboratorios pendientes en Moodle con avisos de urgencia.
* **Kardex y Trámites:** Consulta de calificaciones, generación de constancia digital de estudios y biblioteca virtual.

### 4.3. Simulación de Moodle LMS ("aula.iinicia.org")
* Demostración interactiva de la experiencia de navegación del estudiante al ingresar por SSO a Moodle.
* Tema personalizado institucional (Edwiser RemUI / Boost adaptado) con foros, videos, lecturas en PDF, laboratorios prácticos y rúbricas.
* Navegación coherente de regreso con un clic hacia el portal React.

### 4.4. Panel de Coordinación y Administración
* **Gestión de Aspirantes:** Tabla en tiempo real de solicitudes de admisión, promedio y estado.
* **Aprobación y Matrícula Idempotente:** Botón para admitir al aspirante y aprovisionar su cuenta Moodle vía API sin riesgo de duplicados.
* **Monitor de Salud y Auditoría:** Diagnóstico de endpoints, pool de base de datos y consola interactiva de prueba de idempotencia.
* **CMS Headless IINICIA:** Administración de secciones institucionales sin código ni WordPress.

### 4.5. Sistema de Identidad y Roles (RBAC)
* Selector de roles de prueba en el encabezado (*Estudiante*, *Aspirante*, *Coordinador*, *Admin TI*) para que los evaluadores puedan auditar cualquier perspectiva de forma inmediata.
* Modal de animación Single Sign-On (SSO) que visualiza el flujo de tokens entre Keycloak, el portal y Moodle.

---

## 5. Matriz de Cumplimiento de Criterios de Aceptación (PDF)

| ID | Criterio de Aceptación | Estado en la Aplicación Web | Evidencia / Mecanismo |
|---|---|:---:|---|
| **CA-01** | WordPress deja de formar parte de la arquitectura operativa final | **CUMPLIDO** | Portal 100% construido en React/Vite + Node.js sin llamadas a WordPress. |
| **CA-02** | El portal público funciona en React / Next.js | **CUMPLIDO** | Frontend SPA React 19 + TypeScript + Vite de alta velocidad y tipado estricto. |
| **CA-03** | Una persona puede crear su cuenta desde el portal | **CUMPLIDO** | Módulo de Registro y Admisiones con validación de datos y generación de folio. |
| **CA-04** | La cuenta Moodle se crea o vincula automáticamente sin duplicados | **CUMPLIDO** | Endpoint y lógica de aprovisionamiento idempotente en el Backend Node.js. |
| **CA-05** | Sistema implementa roles y permisos (Superadmin, Coord, Profesor, Estudiante, Aspirante) | **CUMPLIDO** | Matriz RBAC en `AuthContext` con control de rutas y switch interactivo de prueba. |
| **CA-06** | Administrador académico puede autorizar programas, cohortes y matrículas | **CUMPLIDO** | Panel `/admin` con capacidad de dictamen de aspirantes y asignación a Moodle. |
| **CA-07** | El estudiante visualiza únicamente los cursos para los que tiene permiso | **CUMPLIDO** | Vista `/mi-iinicia` filtrada según la matrícula y cohorte del alumno. |
| **CA-08** | Existe SSO entre portal y Moodle | **CUMPLIDO** | Modal interactivo de transición SSO con simulación de token efímero OIDC. |
| **CA-09** | El usuario no necesita una segunda contraseña para entrar al LMS | **CUMPLIDO** | El botón *"Mi Campus"* autentica de forma transparente sin solicitar credenciales. |
| **CA-10** | React no contiene tokens administrativos de Moodle | **CUMPLIDO** | Regla de seguridad aplicada: los tokens residen en el backend Node.js (`server/index.js`). |
| **CA-15** | Portal y Moodle mantienen una identidad visual coherente | **CUMPLIDO** | Paleta, tipografía, componentes y bordes homologados en la vista `/moodle-preview`. |
| **CA-16** | La información institucional puede actualizarse sin modificar código fuente | **CUMPLIDO** | Módulo CMS en el panel administrativo y endpoints dinámicos en Node.js. |
| **CA-17** | La plataforma cumple los criterios de accesibilidad y responsive | **CUMPLIDO** | Diseño adaptable de 360 px a 4K con ratios de contraste WCAG 2.2 AA. |

---

## 6. Siguiente Etapa: Hoja de Ruta para la Aplicación Móvil Android

Conforme a la solicitud actual, nos enfocamos en perfeccionar la plataforma web y la interfaz. Para la fase posterior contemplada en el documento de arquitectura, se proyecta:
* **Desarrollo en Kotlin + Jetpack Compose:** Aplicación nativa que consumirá el backend BFF en Node.js.
* **Acceso Offline & Notificaciones Push:** Integración con Firebase Cloud Messaging (FCM) para recordatorios de fechas de entrega y avisos académicos.
* **Deep Linking y WebView Autenticada con SSO:** Acceso directo a actividades complejas de Moodle respetando la misma sesión del usuario.

---

## 7. Instrucciones para Ejecutar la Plataforma Web

En la raíz del proyecto (`Proyecto 2 Departamental - 3er Parcial`):

```bash
# 1. Iniciar la aplicación web React (Puerto 5173):
npm run dev

# 2. Opcional: Iniciar el backend Node.js (Puerto 5000):
npm run server

# 3. O iniciar ambos simultáneamente en paralelo:
npm run start
```

* **URL del Portal Web:** `http://localhost:5173`
* **URL de la API Node.js:** `http://localhost:5000/api/health`
