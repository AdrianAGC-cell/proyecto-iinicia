# IINICIA — Guía de Continuidad Técnica e Integración Moodle LMS

> **Documento para el compañero desarrollador y su Asistente de IA**  
> **Rama publicada de trabajo**: `continuacion-moodle`  
> **Punto de partida**: `b5b6db3` (rama `integracion-moodle-android`)  
> **Estado del código**: Backend Express completado, App Android con modo de continuidad y actividades Moodle, Frontend React con portal Mi IINICIA, kardex y módulos institucionales.

---

## 1. Arquitectura y Novedades Implementadas

La plataforma desacopla la presentación de Moodle mediante una capa Backend for Frontend (BFF) en Express:

```text
Android (Kotlin / Jetpack Compose)  \
                                      ->  Express :5000 (Sesión iinicia.sid)  ->  Moodle REST :8080  ->  MariaDB
React / Vite :5173 (Proxy /api)     /
```

### Contratos de API Implementados (`Web/server/`):
* `POST /api/auth/login`: Autentica contra Moodle `/login/token.php` (servicio `moodle_mobile_app`), resuelve matrícula vía `core_user_get_users_by_field` y genera sesión por cookie `iinicia.sid`.
* `GET /api/auth/me`: Devuelve datos del estudiante autenticado (ID, username, nombre, correo, matrícula oficial y avatar).
* `POST /api/auth/logout`: Destruye la sesión de Express e invalida la cookie.
* `GET /api/auth/courses`: **(Nuevo)** Consulta `core_enrol_get_users_courses` con el token Moodle del usuario. Devuelve **únicamente** los cursos en los que el estudiante está inscrito con su avance real (`progress`).
* `GET /api/auth/courses/:id/contents`: **(Nuevo)** Verifica inscripción previa (devuelve `403` si no pertenece al curso) y consulta `core_course_get_contents`.
* `GET /api/auth/courses/:id/grades`: **(Nuevo)** Consulta calificaciones reales del estudiante en el curso vía `gradereport_user_get_grade_items`.
* `GET /api/auth/courses/:courseId/resources/:moduleId`: Descarga autenticada de archivos PDF con validación de tipo MIME y aislamiento.

---

## 2. Instrucciones para la IA del Compañero con Moodle

> **Mensaje para la IA que asista en la laptop con Moodle**:  
> Actúa como guía técnica de IINICIA. Usa la rama `continuacion-moodle`. Tu compañero tiene alojado el Moodle en Docker y la base de datos MariaDB. Sigue estos pasos para arrancar el entorno y ejecutar las pruebas de validación de extremo a extremo.

### Paso 1: Cambiar a la rama actualizada
```bash
git fetch origin
git switch continuacion-moodle
git pull --ff-only origin continuacion-moodle
```

### Paso 2: Iniciar Moodle en Docker
En la laptop anfitriona (donde está instalado Moodle):
```bash
# En Windows / WSL:
docker start moodle-docker-db-1 moodle-docker-webserver-1

# Verificar que los contenedores estén activos:
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```
Comprueba abriendo en el navegador: [http://localhost:8080](http://localhost:8080).

### Paso 3: Configurar variables de entorno
Asegúrate de que `Web/server/.env` contenga:
```env
MOODLE_URL=http://localhost:8080
MOODLE_TOKEN=TU_TOKEN_DE_SERVICIO_MOODLE
SESSION_SECRET=TU_SECRETO_HEX_ALEATORIO
PORT=5000
```
*(Si necesitas generar un SESSION_SECRET nuevo: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)*.

### Paso 4: Arrancar el Servidor Express
```bash
cd Web
npm run server
```
El servidor debe mostrar: `Servidor iniciado en el puerto 5000`.

---

## 3. Pruebas de Validación del Backend (Paso a Paso)

Ejecuta estas pruebas desde una terminal en la máquina anfitriona para verificar la integración:

### Prueba 1: Verificar protección sin sesión (401 esperado)
```powershell
curl.exe -i http://127.0.0.1:5000/api/auth/me
# Debe responder HTTP/1.1 401 Unauthorized
```

### Prueba 2: Inicio de sesión real con Moodle
```powershell
curl.exe -i -c cookie.txt -X POST http://127.0.0.1:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"identificador":"estudianteprueba","password":"TU_PASSWORD_AQUI","tipo":"usuario"}'
```
*Debe responder `HTTP 200` con `success: true` y guardar la cookie en `cookie.txt`.*

### Prueba 3: Consultar perfil autenticado con matrícula
```powershell
curl.exe -i -b cookie.txt http://127.0.0.1:5000/api/auth/me
```
*Debe devolver JSON con el ID del estudiante, username, nombre y matrícula.*

### Prueba 4: Consultar cursos inscritos autenticados
```powershell
curl.exe -i -b cookie.txt http://127.0.0.1:5000/api/auth/courses
```
*Debe responder `HTTP 200` con `conectado: true` y la lista de cursos inscritos del estudiante.*

### Prueba 5: Consultar contenidos con validación de inscripción
```powershell
curl.exe -i -b cookie.txt http://127.0.0.1:5000/api/auth/courses/2/contents
```
*Debe devolver las secciones, módulos y recursos del curso.*

### Prueba 6: Descargar el PDF autenticado
```powershell
curl.exe -i -b cookie.txt http://127.0.0.1:5000/api/auth/courses/2/resources/2 -o recurso_test.pdf
```
*Debe devolver `HTTP 200`, `Content-Type: application/pdf` y guardar el archivo PDF válido.*

---

## 4. Pruebas en la Aplicación Android

La aplicación móvil ya está compilada y preparada para conectarse al backend:

1. **Conectar teléfono por USB** y activar depuración USB.
2. **Habilitar el túnel ADB reverse** para conectar el puerto 5000 del teléfono al Express de la computadora:
   ```powershell
   $adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
   & $adb devices
   & $adb reverse tcp:5000 tcp:5000
   & $adb install -r .\Mobil\app\build\outputs\apk\debug\app-debug.apk
   ```
3. **Flujo de prueba funcional en el teléfono**:
   - Abrir **IINICIA** en el teléfono.
   - En la pantalla de login, ingresar con `estudianteprueba` o matrícula `IIN-2026-0001` y su contraseña.
   - En el Dashboard verificar que aparezca el estatus `🟢 Moodle Online`, las asignaturas activas y las próximas actividades.
   - Entrar al curso y presionar el PDF: debe descargarse y abrirse en el visor del celular.
   - Presionar un foro o tarea: debe abrir el modal con el estatus y acceso al Campus Virtual SSO.
   - Ir a la pestaña **Mi IINICIA / Perfil** y verificar nombre, correo y matrícula. Presionar **Cerrar Sesión**.

---

## 5. Pruebas en el Portal Web (React)

En otra terminal:
```bash
cd Web
npm run dev
```
Abre [http://localhost:5173](http://localhost:5173):
* Inicia sesión desde `/login`.
* Entra a `/mi-iinicia` y revisa las 4 pestañas: **Cursos**, **Próximas Entregas**, **Calificaciones y Avance (Kardex)** y **Servicios y Trámites**.
* Abre las nuevas páginas legales en el pie de página: `/aviso-privacidad` y `/terminos-servicio`.

---

## 6. Compartir el Servicio entre Compañeros de Forma Segura

Si ambos compañeros quieren probar en vivo desde laptops diferentes:
* **Opción recomendada**: Instalar **Tailscale** (red privada virtual gratuita y segura).
* Asignar la IP privada de Tailscale de la laptop con Moodle a la variable `MOODLE_URL` o conectar la app móvil a la IP privada de Express sin exponer puertos públicos a internet.
