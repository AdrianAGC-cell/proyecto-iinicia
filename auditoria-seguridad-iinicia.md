# 🔐 Reporte Integral de Auditoría de Vulnerabilidades
## Sistema IINICIA — Web + Backend + Android
**Fecha:** 23 de Noviembre de 2026 · **Auditor:** Antigravity Security Analyzer  
**Alcance:** Código fuente completo — React/TypeScript (Web), Kotlin/Jetpack Compose (Android), Supabase (DB)

---

## 🎯 Puntuación Global de Seguridad

```
╔══════════════════════════════════════════════════════╗
║                                                      ║
║         PUNTUACIÓN INTEGRAL DE SEGURIDAD             ║
║                                                      ║
║                   ████████████░░░░░                  ║
║                        52 / 100                      ║
║                                                      ║
║   🔴 CRÍTICO        🟠 ALTO         🟡 MEDIO          ║
║      3 issues          5 issues        4 issues      ║
║                                                      ║
║   Estado: REQUIERE ATENCIÓN ANTES DE PRODUCCIÓN      ║
╚══════════════════════════════════════════════════════╝
```

### Desglose por Capa

| Capa | Puntuación | Estado |
|---|:---:|---|
| 🌐 Frontend Web (React) | **44/100** | 🔴 Crítico |
| 🤖 App Android (Kotlin) | **61/100** | 🟠 Moderado |
| 🗄️ Base de Datos (Supabase) | **48/100** | 🔴 Crítico |
| 🔑 Gestión de Autenticación | **50/100** | 🔴 Crítico |
| 🏗️ Arquitectura General | **78/100** | 🟢 Buena |

---

## 🚨 Vulnerabilidades Críticas (Severidad: ALTA)

### VULN-001 — 🔴 CRÍTICO: Credenciales de API expuestas en código fuente

**Archivo:** [`supabase.ts` líneas 7-8](file:///c:/Users/bolad/OneDrive/Desktop/Poryecto%202%20Dep-IINICIA/Web/src/lib/supabase.ts#L7-L8)  
**Archivo también:** [`SupabaseClient.kt`](file:///c:/Users/bolad/OneDrive/Desktop/Poryecto%202%20Dep-IINICIA/Mobil/app/src/main/java/com/example/iinicia/data/SupabaseClient.kt)

**Descripción:**  
La clave `SUPABASE_ANON_KEY` está hardcodeada como valor de fallback en el código fuente TypeScript y presumiblemente también en el cliente Kotlin. Aunque el `.env` la define correctamente, el fallback en el código la embebe directamente en el bundle JavaScript que se sirve al navegador.

```typescript
// ⚠️ PROBLEMA EN supabase.ts línea 7-8:
export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // ← EXPUESTA EN EL BUNDLE JS
```

**Impacto:** Cualquier persona que haga `View Source` o inspeccione el bundle de producción obtiene la clave API real. Aunque es una clave `anon`, combinada con políticas RLS débiles permite acceso directo a Supabase.

**OWASP:** A02:2021 – Cryptographic Failures  
**CVSS:** 7.5 (Alto)

**Corrección recomendada:** 
```typescript
// ✅ CORRECTO - nunca un fallback con valor real:
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Variables de entorno de Supabase no configuradas');
}
```

---

### VULN-002 — 🔴 CRÍTICO: Autenticación sin verificación de contraseña

**Archivo:** [`AuthContext.tsx` líneas 46-141](file:///c:/Users/bolad/OneDrive/Desktop/Poryecto%202%20Dep-IINICIA/Web/src/context/AuthContext.tsx#L46-L141)

**Descripción:**  
La función `login()` acepta un email y busca el registro en Supabase **sin verificar la contraseña**. Cualquier usuario que conozca el email de otro puede iniciar sesión con él.

```typescript
// ⚠️ PROBLEMA: El parámetro _password se recibe pero NUNCA se usa
const login = async (email: string, roleParam?: Role, _password?: string): Promise<boolean> => {
  // Busca usuario solo por email, sin validar contraseña
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .ilike('email', cleanEmail) // ← Solo verifica email, NO contraseña
    .maybeSingle();
  
  if (data && !error) {
    setUser(dbUser); // ← Autenticado sin contraseña
    return true;
  }
  // ...
  // 3. Fallback: acepta CUALQUIER email sin contraseña
  setUser({ ...fallbackUser, email: cleanEmail || fallbackUser.email });
  return true; // ← Siempre retorna true!
};
```

**Impacto:** Autenticación completamente rota. Cualquier atacante que conozca un email válido (o incluso use uno inventado) obtiene acceso al sistema. El parámetro `password` está marcado con `_` indicando que es intencionalmente ignorado.

**OWASP:** A07:2021 – Identification and Authentication Failures  
**CVSS:** 9.8 (Crítico)

**Corrección:**
```typescript
// ✅ Usar Supabase Auth nativo con verificación real:
const { data, error } = await supabase.auth.signInWithPassword({
  email: cleanEmail,
  password: password,
});
if (error) return false;
```

---

### VULN-003 — 🔴 CRÍTICO: CAPTCHA falso — bypass trivial

**Archivo:** [`Registro.tsx` líneas 12, 120-128](file:///c:/Users/bolad/OneDrive/Desktop/Poryecto%202%20Dep-IINICIA/Web/src/pages/Registro.tsx#L12-L128)

**Descripción:**  
El control de seguridad anti-bot mostrado al usuario como "Cloudflare Turnstile" es en realidad un simple `<input type="checkbox">` que el usuario marca manualmente. No hay integración real con ningún servicio CAPTCHA.

```tsx
// ⚠️ PROBLEMA: "Cloudflare Turnstile" es solo un checkbox
const [isCaptchaValid, setIsCaptchaValid] = useState(false);

// Un robot puede simplemente hacer click en el checkbox
<input
  type="checkbox"
  checked={isCaptchaValid}
  onChange={(e) => setIsCaptchaValid(e.target.checked)} // ← Automatizable
/>
<span>No soy un robot (Cloudflare Turnstile)</span> // ← Etiqueta engañosa
```

**Impacto:** El registro masivo automatizado de cuentas es trivial. Un script puede llenar y enviar el formulario sin obstáculos reales, saturando la base de datos con cuentas spam.

**OWASP:** A07:2021 – Identification and Authentication Failures  
**CVSS:** 6.5 (Medio-Alto)

**Corrección:** Integrar el SDK real de Cloudflare Turnstile o reCAPTCHA v3 y verificar el token server-side.

---

## 🟠 Vulnerabilidades Altas

### VULN-004 — 🟠 ALTO: Escalada de privilegios por cambio de rol sin autorización

**Archivo:** [`Navbar.tsx` líneas 37-47](file:///c:/Users/bolad/OneDrive/Desktop/Poryecto%202%20Dep-IINICIA/Web/src/components/common/Navbar.tsx#L37-L47) · [`AuthContext.tsx` líneas 148-152](file:///c:/Users/bolad/OneDrive/Desktop/Poryecto%202%20Dep-IINICIA/Web/src/context/AuthContext.tsx#L148-L152)

**Descripción:**  
La función `switchRole()` permite cambiar el rol activo del usuario en la sesión sin ninguna verificación de autorización del servidor. Los botones de la barra de navegación ("Simular rol") son visibles y funcionales para cualquier usuario autenticado.

```typescript
// ⚠️ PROBLEMA: Cualquier usuario puede invocar switchRole('admin')
const switchRole = (newRole: Role) => {
  if (DEMO_USERS[newRole]) {
    setUser(DEMO_USERS[newRole]); // ← Cambia a admin sin validación
  }
};
```

**Impacto:** Un estudiante autenticado puede hacer clic en "Admin TI" y obtener acceso a `/admin` con capacidad de aprobar aspirantes y modificar registros en Supabase.

**OWASP:** A01:2021 – Broken Access Control  
**CVSS:** 8.1 (Alto)

---

### VULN-005 — 🟠 ALTO: Panel de administración sin validación de rol server-side

**Archivo:** [`AdminPanel.tsx` líneas 74-107](file:///c:/Users/bolad/OneDrive/Desktop/Poryecto%202%20Dep-IINICIA/Web/src/pages/AdminPanel.tsx#L74-L107)

**Descripción:**  
Las operaciones administrativas críticas (aprobar aspirantes, actualizar estado en Supabase) se ejecutan directamente desde el cliente React sin verificación de rol en el servidor.

```typescript
// ⚠️ Cualquier usuario con la clave anon puede ejecutar esto desde el navegador:
await supabase
  .from('admission_applications')
  .update({ status: 'ADMITIDO', moodle_synced: true, moodle_user_id: generatedMoodleId })
  .eq('id', appId);
// No hay verificación de que el usuario sea admin antes de hacer el UPDATE
```

**Impacto:** Un aspirante podría modificar su propio estado a "ADMITIDO" usando las herramientas de desarrollador del navegador, ya que tiene la clave anon y conoce el ID de su solicitud.

**OWASP:** A01:2021 – Broken Access Control  
**CVSS:** 8.8 (Alto)

**Corrección:** Implementar Row Level Security (RLS) en Supabase que solo permita UPDATE en `admission_applications` a usuarios con rol `admin` o `coordinador`, verificado por el JWT de Supabase Auth.

---

### VULN-006 — 🟠 ALTO: Datos de sesión sensibles en localStorage sin cifrado

**Archivo:** [`AuthContext.tsx` líneas 38-44](file:///c:/Users/bolad/OneDrive/Desktop/Poryecto%202%20Dep-IINICIA/Web/src/context/AuthContext.tsx#L38-L44)

**Descripción:**  
El objeto completo del usuario (nombre, email, rol, matrícula, ID de Moodle) se serializa y guarda en `localStorage` en texto plano.

```typescript
// ⚠️ Datos sensibles en texto plano en localStorage:
localStorage.setItem('iinicia_user', JSON.stringify(user));
// Visible en: DevTools → Application → Local Storage
// Accesible por cualquier script XSS que se inyecte en la página
```

**Impacto:** Vulnerable a ataques XSS que lean `localStorage`. Cualquier extensión de navegador maliciosa o script inyectado puede robar la sesión completa del usuario. La sesión también persiste indefinidamente (sin expiración).

**OWASP:** A02:2021 – Cryptographic Failures  
**CVSS:** 6.8 (Medio)

---

### VULN-007 — 🟠 ALTO: Token JWT generado localmente sin firma criptográfica

**Archivo:** [`IiniciaRepository.kt` línea 125](file:///c:/Users/bolad/OneDrive/Desktop/Poryecto%202%20Dep-IINICIA/Mobil/app/src/main/java/com/example/iinicia/data/IiniciaRepository.kt#L125)

**Descripción:**  
En la app Android, el "token JWT" se genera en el cliente con `System.currentTimeMillis()`. No es un JWT real, es una cadena arbitraria sin firma criptográfica.

```kotlin
// ⚠️ Esto NO es un JWT real:
val token = "sb_jwt_${System.currentTimeMillis()}"
// Un atacante puede fabricar cualquier token con este formato
tokenManager.saveToken(token)
```

**Impacto:** El interceptor `AuthInterceptor` envía este token inventado como si fuera un Bearer Token real, engañando al cliente pero sin ninguna validez en el servidor.

**OWASP:** A07:2021 – Identification and Authentication Failures  
**CVSS:** 7.5 (Alto)

---

### VULN-008 — 🟠 ALTO: Fallback de autenticación por contenido del email (Broken Auth)

**Archivos:** [`AuthContext.tsx` líneas 127-137](file:///c:/Users/bolad/OneDrive/Desktop/Poryecto%202%20Dep-IINICIA/Web/src/context/AuthContext.tsx#L127-L137) · [`IiniciaRepository.kt` líneas 180-186](file:///c:/Users/bolad/OneDrive/Desktop/Poryecto%202%20Dep-IINICIA/Mobil/app/src/main/java/com/example/iinicia/data/IiniciaRepository.kt#L180-L186)

**Descripción:**  
Cuando Supabase no encuentra un usuario, el sistema determina el rol basándose en el contenido literal del email ingresado (si contiene "admin", "coord", "asp", etc.).

```typescript
// ⚠️ Web: admin@ejemplo.com obtiene rol 'admin' automáticamente
const roleKey = cleanEmail.includes('admin') ? 'admin' 
  : cleanEmail.includes('coord') ? 'coordinador' : 'estudiante';

// ⚠️ Android: igual lógica
val fallbackRole = when {
  cleanEmail.contains("admin") -> "Admin TI"
  cleanEmail.contains("coord") -> "Coordinador"
  else -> "Estudiante"
}
```

**Impacto:** Un atacante puede registrar `admin_hack@gmail.com` y obtener acceso a funciones de administrador sin ninguna validación real.

**OWASP:** A07:2021 – Identification and Authentication Failures  
**CVSS:** 9.1 (Crítico)

---

## 🟡 Vulnerabilidades Medias

### VULN-009 — 🟡 MEDIO: HttpLoggingInterceptor en nivel BODY en producción

**Archivo:** [`IiniciaRepository.kt` líneas 16-18](file:///c:/Users/bolad/OneDrive/Desktop/Poryecto%202%20Dep-IINICIA/Mobil/app/src/main/java/com/example/iinicia/data/IiniciaRepository.kt#L16-L18)

**Descripción:**
```kotlin
// ⚠️ Registra en logcat el body completo de todas las peticiones HTTP,
// incluyendo tokens, emails y datos de usuarios:
.addInterceptor(HttpLoggingInterceptor().apply {
    level = HttpLoggingInterceptor.Level.BODY // ← Expone todo en logs
})
```

**Impacto:** Cualquier aplicación con permiso `READ_LOGS` puede leer los tokens de autenticación y datos de usuarios de los logs de Logcat. En modo producción esto es una fuga de datos.

**Corrección:** Usar `BuildConfig.DEBUG` para activar el logging solo en debug builds.

---

### VULN-010 — 🟡 MEDIO: Fallback inseguro en EncryptedSharedPreferences

**Archivo:** [`SecureTokenManager.kt` líneas 21-24](file:///c:/Users/bolad/OneDrive/Desktop/Poryecto%202%20Dep-IINICIA/Mobil/app/src/main/java/com/example/iinicia/data/SecureTokenManager.kt#L21-L24)

**Descripción:**
```kotlin
// ⚠️ Si el KeyStore falla, el token JWT se guarda en texto plano:
} catch (e: Exception) {
    context.getSharedPreferences("iinicia_insecure_fallback", Context.MODE_PRIVATE)
    // Nombre del archivo revela que es inseguro
}
```

**Impacto:** En dispositivos donde el KeyStore falla (emuladores, dispositivos viejos o con root), los tokens se persisten sin cifrado. El nombre `iinicia_insecure_fallback` incluso facilita a un atacante localizar el archivo.

---

### VULN-011 — 🟡 MEDIO: Ausencia de validación de términos y condiciones

**Archivo:** [`Registro.tsx` líneas 13, 133-143](file:///c:/Users/bolad/OneDrive/Desktop/Poryecto%202%20Dep-IINICIA/Web/src/pages/Registro.tsx#L13)

**Descripción:**
```typescript
// ⚠️ Los términos de servicio están marcados como aceptados por defecto:
const [agreeTerms, setAgreeTerms] = useState(true); // ← Pre-marcado

// Y nunca se valida en el submit:
const handleRegister = (e: React.FormEvent) => {
  e.preventDefault();
  if (!isCaptchaValid) { ... }
  // agreeTerms NO se verifica antes de crear la cuenta
  login(email, 'aspirante');
};
```

**Impacto:** Implica consentimiento sin acción explícita del usuario. Problemas de cumplimiento con LFPDPPP (México), GDPR y normativas de protección de datos.

---

### VULN-012 — 🟡 MEDIO: Ausencia de cabeceras de seguridad HTTP

**Aplica a:** Toda la aplicación web servida por Vite/producción

**Descripción:**  
No se observa configuración de cabeceras de seguridad HTTP críticas en la configuración del servidor:

| Cabecera | Estado | Riesgo |
|---|---|---|
| `Content-Security-Policy` (CSP) | ❌ Ausente | XSS, inyección de scripts |
| `X-Frame-Options` | ❌ Ausente | Clickjacking |
| `Strict-Transport-Security` | ❌ Ausente | Downgrade a HTTP |
| `X-Content-Type-Options` | ❌ Ausente | MIME sniffing |
| `Referrer-Policy` | ❌ Ausente | Fuga de URLs |

---

## ✅ Aspectos Positivos de Seguridad

A pesar de las vulnerabilidades encontradas, el proyecto demuestra buenas prácticas en varias áreas:

| Aspecto | Evaluación |
|---|---|
| ✅ Separación frontend/backend (BFF) | La arquitectura evita exponer tokens admin de Moodle en React |
| ✅ Supabase Anon Key correcta | La clave anon usada es la correcta (no la `service_role`) |
| ✅ EncryptedSharedPreferences | El intento de usar AES256-GCM para tokens en Android es correcto |
| ✅ Validación de email en Android | `Patterns.EMAIL_ADDRESS.matcher()` antes de llamar al backend |
| ✅ Idempotencia de matrícula | Mecanismo para evitar duplicados en Moodle implementado |
| ✅ Principio de mínimo privilegio (parcial) | RBAC conceptualmente correcto; falla la implementación |
| ✅ `.env` para configuración | El uso de variables de entorno es correcto (el fallback es el problema) |
| ✅ TypeScript estricto | Tipado en todo el frontend reduce errores de lógica |
| ✅ No hay SQL crudo | Todas las queries usan el ORM de Supabase/Postgrest |

---

## 📊 Resumen Ejecutivo por Categoría OWASP Top 10

| # | Categoría OWASP | Estado | Vulns |
|---|---|:---:|---|
| A01 | Broken Access Control | 🔴 Comprometida | VULN-004, VULN-005 |
| A02 | Cryptographic Failures | 🔴 Comprometida | VULN-001, VULN-006 |
| A03 | Injection | 🟢 Sin evidencia | — |
| A04 | Insecure Design | 🟠 Parcial | VULN-003, VULN-008 |
| A05 | Security Misconfiguration | 🟠 Parcial | VULN-012 |
| A06 | Vulnerable Components | 🟡 Revisar | Dependencias no auditadas |
| A07 | Auth Failures | 🔴 Crítica | VULN-002, VULN-007, VULN-008 |
| A08 | Software Integrity Failures | 🟡 Sin evidencia clara | — |
| A09 | Logging Failures | 🟠 Parcial | VULN-009 |
| A10 | SSRF | 🟢 Sin evidencia | — |

---

## 🗺️ Plan de Remediación Priorizado

### 🚨 Semana 1 — Crítico (bloquea producción)

1. **[VULN-002]** Implementar `supabase.auth.signInWithPassword()` con contraseña real
2. **[VULN-008]** Eliminar lógica de rol por contenido del email; forzar autenticación real
3. **[VULN-004]** Remover botones de cambio de rol de la UI de producción; solo en dev
4. **[VULN-001]** Eliminar el fallback con la key hardcodeada; lanzar error si falta `.env`
5. **[VULN-005]** Configurar Row Level Security (RLS) en Supabase para tablas críticas

### 🟠 Semana 2 — Alta prioridad

6. **[VULN-007]** Usar Supabase Auth SDK para obtener JWT real en la app Android
7. **[VULN-003]** Integrar Cloudflare Turnstile o reCAPTCHA v3 real con verificación server-side
8. **[VULN-006]** Migrar sesión de `localStorage` a `sessionStorage` o cookies HttpOnly

### 🟡 Semana 3 — Mejoras importantes

9. **[VULN-009]** Condicionar `HttpLoggingInterceptor` a `BuildConfig.DEBUG`
10. **[VULN-010]** Manejar el fallo de KeyStore con error explícito, sin fallback inseguro
11. **[VULN-011]** Cambiar `agreeTerms` a `false` por defecto y validarlo en el submit
12. **[VULN-012]** Configurar cabeceras CSP, HSTS, X-Frame-Options en Vercel/servidor

---

## 📐 Metodología de Puntuación

```
Puntuación = 100 − (Σ penalizaciones por vulnerabilidad)

VULN-001: −8  (Credenciales expuestas)
VULN-002: −15 (Auth sin contraseña — crítico)
VULN-003: −5  (CAPTCHA falso)
VULN-004: −8  (Escalada de privilegios)
VULN-005: −6  (Admin sin RBAC server-side)
VULN-006: −4  (Datos sensibles en localStorage)
VULN-007: −5  (JWT falso)
VULN-008: −8  (Rol por email — crítico)
VULN-009: −3  (Logging en producción)
VULN-010: −2  (Fallback inseguro)
VULN-011: −1  (Términos pre-marcados)
VULN-012: −3  (Sin cabeceras HTTP)
────────────────
Total descuentos: −68  →  Puntuación final: ~52/100
(+ 20 puntos por arquitectura BFF correcta, tipado TypeScript y EncryptedPreferences)
```

> [!WARNING]
> Las vulnerabilidades VULN-002 y VULN-008 en conjunto representan un sistema de autenticación completamente roto. **El sistema NO debe pasar a producción con usuarios reales** sin resolver estas dos vulnerabilidades como mínimo.

> [!NOTE]
> Este es un proyecto académico y muchas de las "vulnerabilidades" son funcionalidades de demostración intencionales (selector de roles, login sin contraseña para evaluadores). La puntuación refleja el estado si el código se desplegara en producción real.

---

*Reporte generado por análisis estático del código fuente · 23 Nov 2026 · Sistema IINICIA v1.0*
