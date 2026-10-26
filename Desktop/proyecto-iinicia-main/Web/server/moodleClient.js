/**
 * Cliente oficial de Servicios Web REST para Moodle 4.x
 * Arquitectura IINICIA - Backend BFF
 * 
 * Cumple con:
 * - Regla de seguridad: tokens administrativos NUNCA expuestos en React ni Android.
 * - Idempotencia: verificación previa de identidad antes de crear usuarios.
 * - Soporte de servicios: core_user, enrol_manual, mod_assign, mod_forum, core_course.
 */

import 'dotenv/config';

export class MoodleRestClient {
  constructor() {
    this.baseUrl = (process.env.MOODLE_URL || 'https://aula.iinicia.org').replace(/\/+$/, '');
    this.wsToken = process.env.MOODLE_WS_TOKEN || '';
    this.restEndpoint = `${this.baseUrl}/webservice/rest/server.php`;
  }

  isConfigured() {
    return Boolean(this.baseUrl && this.wsToken && this.wsToken.trim().length > 10);
  }

  /**
   * Ejecuta una llamada genérica al endpoint oficial de Moodle Web Services
   * @param {string} wsfunction Nombre oficial de la función en Moodle
   * @param {object} params Parámetros en formato de objeto plano o anidado
   */
  async call(wsfunction, params = {}) {
    if (!this.isConfigured()) {
      return {
        success: false,
        configured: false,
        message: 'MOODLE_WS_TOKEN no está configurado en .env. Usando capa de datos local.'
      };
    }

    try {
      const url = new URL(this.restEndpoint);
      url.searchParams.append('wstoken', this.wsToken);
      url.searchParams.append('wsfunction', wsfunction);
      url.searchParams.append('moodlewsrestformat', 'json');

      // Convert params to PHP/Moodle array format: e.g. users[0][username]=valeria
      const bodyParams = new URLSearchParams();
      
      const flatten = (obj, prefix = '') => {
        for (const key of Object.keys(obj)) {
          const val = obj[key];
          const newPrefix = prefix ? `${prefix}[${key}]` : key;
          if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
            flatten(val, newPrefix);
          } else if (Array.isArray(val)) {
            val.forEach((item, idx) => {
              if (typeof item === 'object' && item !== null) {
                flatten(item, `${newPrefix}[${idx}]`);
              } else {
                bodyParams.append(`${newPrefix}[${idx}]`, String(item));
              }
            });
          } else if (val !== undefined && val !== null) {
            bodyParams.append(newPrefix, String(val));
          }
        }
      };

      flatten(params);

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: bodyParams.toString()
      });

      const data = await response.json();

      // Moodle returns { exception: "...", message: "..." } on error
      if (data && data.exception) {
        console.warn(`[Moodle REST Error] ${wsfunction}:`, data.message);
        return {
          success: false,
          error: data.message,
          errorcode: data.errorcode,
          exception: data.exception
        };
      }

      return {
        success: true,
        data
      };
    } catch (err) {
      console.warn(`[Moodle REST Fetch Error] ${wsfunction}:`, err.message);
      return {
        success: false,
        error: err.message
      };
    }
  }

  /**
   * 1. Diagnóstico de Conexión: Verifica si el token y Moodle responden
   */
  async testConnection() {
    if (!this.isConfigured()) {
      return {
        connected: false,
        status: 'TOKEN_PENDING',
        message: 'Falta configurar MOODLE_WS_TOKEN en el archivo .env',
        moodleUrl: this.baseUrl
      };
    }

    const start = Date.now();
    const result = await this.call('core_webservice_get_site_info');
    const latency = Date.now() - start;

    if (result.success) {
      return {
        connected: true,
        status: 'OPERATIONAL',
        siteName: result.data.sitename,
        username: result.data.username,
        moodleVersion: result.data.release || 'Moodle 4.x',
        latencyMs: latency,
        moodleUrl: this.baseUrl
      };
    } else {
      return {
        connected: false,
        status: 'AUTH_FAILED',
        error: result.error,
        latencyMs: latency,
        moodleUrl: this.baseUrl
      };
    }
  }

  /**
   * 2. Buscar usuario por correo (Garantiza Idempotencia)
   * Función Moodle: core_user_get_users_by_field
   */
  async getUserByEmail(email) {
    const res = await this.call('core_user_get_users_by_field', {
      field: 'email',
      values: [email.toLowerCase().trim()]
    });
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      return res.data[0];
    }
    return null;
  }

  /**
   * 3. Crear usuario en Moodle (Solo si no existe)
   * Función Moodle: core_user_create_users
   */
  async createUserIfNotExist({ email, firstName, lastName, username, password }) {
    // Paso 1: Verificar si ya existe para cumplir idempotencia
    const existing = await this.getUserByEmail(email);
    if (existing) {
      return {
        created: false,
        alreadyExisted: true,
        moodleUserId: existing.id,
        user: existing
      };
    }

    if (!this.isConfigured()) {
      const simulatedId = Math.floor(1000 + Math.random() * 5000);
      return {
        created: true,
        alreadyExisted: false,
        simulated: true,
        moodleUserId: simulatedId,
        message: 'Modo demo: usuario creado en simulación Moodle LMS.'
      };
    }

    // Paso 2: Crear usuario mediante Web Services
    const cleanUsername = (username || email.split('@')[0]).toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    const cleanPassword = password || 'Iinicia2026!Temporal';

    const res = await this.call('core_user_create_users', {
      users: [
        {
          username: cleanUsername,
          password: cleanPassword,
          firstname: firstName || 'Estudiante',
          lastname: lastName || 'IINICIA',
          email: email.toLowerCase().trim(),
          auth: 'manual',
          idnumber: `IIN-${Date.now()}`
        }
      ]
    });

    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      return {
        created: true,
        alreadyExisted: false,
        moodleUserId: res.data[0].id,
        username: res.data[0].username
      };
    }

    return {
      created: false,
      error: res.error || 'No se pudo crear el usuario en Moodle'
    };
  }

  /**
   * 4. Matricular estudiante en un curso Moodle
   * Función Moodle: enrol_manual_enrol_users
   * roleid: 5 = Estudiante (Student en Moodle estándar)
   */
  async enrolStudent(moodleUserId, moodleCourseId, roleId = 5) {
    if (!this.isConfigured()) {
      return {
        success: true,
        simulated: true,
        message: `Alumno #${moodleUserId} matriculado en curso #${moodleCourseId} (Modo local).`
      };
    }

    const res = await this.call('enrol_manual_enrol_users', {
      enrolments: [
        {
          roleid: roleId,
          userid: moodleUserId,
          courseid: moodleCourseId
        }
      ]
    });

    return res;
  }

  /**
   * 5. Obtener Cursos de Moodle
   * Función Moodle: core_course_get_courses
   */
  async getCourses() {
    return await this.call('core_course_get_courses');
  }

  /**
   * 6. Obtener Cursos Matriculados de un usuario
   * Función Moodle: core_enrol_get_users_courses
   */
  async getUserCourses(moodleUserId) {
    return await this.call('core_enrol_get_users_courses', {
      userid: moodleUserId
    });
  }

  /**
   * 7. Obtener Tareas y Asignaciones
   * Función Moodle: mod_assign_get_assignments
   */
  async getAssignments(courseIds = []) {
    return await this.call('mod_assign_get_assignments', {
      courseids: courseIds
    });
  }

  /**
   * 8. Obtener Hilos de Foros
   * Función Moodle: mod_forum_get_forum_discussions
   */
  async getForumDiscussions(forumId) {
    return await this.call('mod_forum_get_forum_discussions', {
      forumid: forumId
    });
  }
}

export const moodle = new MoodleRestClient();
