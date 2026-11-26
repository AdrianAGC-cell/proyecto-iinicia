export function configurarCursosMoodle(app) {
  const moodleUrl = process.env.MOODLE_URL;

  const consultarMoodle = async (token, funcion, parametros) => {
    const base = new URL(moodleUrl);
    const respuesta = await fetch(
      new URL('/webservice/rest/server.php', base),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          wstoken: token,
          wsfunction: funcion,
          moodlewsrestformat: 'json',
          ...parametros
        }),
        redirect: 'error',
        signal: AbortSignal.timeout(15000)
      }
    );

    if (!respuesta.ok) {
      throw new Error(`Moodle respondió HTTP ${respuesta.status}`);
    }

    const datos = await respuesta.json();

    if (datos.exception) {
      throw new Error(datos.message || 'Error en consulta Moodle');
    }

    return datos;
  };

  // Cursos autenticados: solo los cursos inscritos del usuario
  app.get('/api/auth/courses', async (req, res) => {
    res.set('Cache-Control', 'no-store');

    if (!req.session?.usuario || !req.session?.moodleToken) {
      return res.status(401).json({
        conectado: false,
        error: 'No existe una sesión activa'
      });
    }

    try {
      const cursosMoodle = await consultarMoodle(
        req.session.moodleToken,
        'core_enrol_get_users_courses',
        { userid: String(req.session.usuario.id) }
      );

      if (!Array.isArray(cursosMoodle)) {
        throw new Error('Respuesta inesperada de Moodle');
      }

      const cursos = cursosMoodle
        .filter(c => c.id !== 1)
        .map(curso => ({
          id: curso.id,
          nombre: curso.fullname,
          nombreCorto: curso.shortname || '',
          idCategoria: curso.categoryid || 0,
          visible: curso.visible !== undefined ? curso.visible : 1,
          resumen: (curso.summary || '').replace(/<[^>]*>/g, ' ').trim(),
          progress: curso.progress != null ? Number(curso.progress) : null
        }));

      return res.json({
        conectado: true,
        total: cursos.length,
        cursos
      });
    } catch (error) {
      console.error('Error consultando cursos inscritos:', error.message);
      return res.status(502).json({
        conectado: false,
        error: 'No fue posible consultar los cursos inscritos'
      });
    }
  });

  // Contenidos autenticados con verificación de inscripción previa
  app.get('/api/auth/courses/:id/contents', async (req, res) => {
    res.set('Cache-Control', 'no-store');

    if (!req.session?.usuario || !req.session?.moodleToken) {
      return res.status(401).json({
        conectado: false,
        error: 'No existe una sesión activa'
      });
    }

    const courseId = Number(req.params.id);
    if (!Number.isSafeInteger(courseId) || courseId <= 0) {
      return res.status(400).json({
        conectado: false,
        error: 'ID de curso inválido'
      });
    }

    try {
      // 1. Verificar inscripción
      const cursosMoodle = await consultarMoodle(
        req.session.moodleToken,
        'core_enrol_get_users_courses',
        { userid: String(req.session.usuario.id) }
      );

      if (!Array.isArray(cursosMoodle) || !cursosMoodle.some(c => Number(c.id) === courseId)) {
        return res.status(403).json({
          conectado: false,
          error: 'No tienes acceso a este curso'
        });
      }

      // 2. Obtener secciones y módulos
      const data = await consultarMoodle(
        req.session.moodleToken,
        'core_course_get_contents',
        { courseid: String(courseId) }
      );

      if (!Array.isArray(data)) {
        throw new Error('Respuesta inesperada de Moodle');
      }

      const permisos = await consultarMoodle(
        req.session.moodleToken,
        'local_iinicia_course_permissions',
        { courseid: String(courseId) }
      );

      if (Number(permisos.courseid) !== courseId) {
        throw new Error('Permisos de curso invalidos');
      }

      const puedeVerOcultas =
        permisos.canviewhidden === true;

      const secciones = data
        .filter(s => s.visible !== 0 && s.uservisible !== false)
        .map(seccion => ({
          id: seccion.id,
          numero: seccion.section,
          nombre: seccion.name || 'General',
          resumen: seccion.summary || '',
          visible: seccion.visible,
          actividades: (seccion.modules || [])
            .filter(m =>
              (m.visible !== 0 && m.uservisible !== false) ||
              (puedeVerOcultas && m.modname === 'assign' &&
                m.visible === 0 && m.uservisible === true)
            )
            .map(actividad => ({
              id: actividad.id,
              nombre: actividad.name,
              tipo: actividad.modname,
              url: actividad.url || '',
              visible: actividad.visible,
              descripcion: actividad.description || '',
              contents: (actividad.contents || []).map(c => ({
                filename: c.filename,
                filesize: c.filesize,
                mimetype: c.mimetype
              }))
            }))
        }));

      return res.json({
        conectado: true,
        cursoId: courseId,
        permisos: {
          puedeCrear: permisos.cancreate === true,
          puedeGestionar: permisos.canmanage === true,
          puedeCambiarVisibilidad:
            permisos.canvisibility === true &&
            permisos.canviewhidden === true
        },
        totalSecciones: secciones.length,
        secciones
      });
    } catch (error) {
      console.error('Error consultando contenidos autenticados:', error.message);
      return res.status(502).json({
        conectado: false,
        error: 'No fue posible consultar los contenidos del curso'
      });
    }
  });

  // Calificaciones autenticadas del estudiante para el curso
  app.get('/api/auth/courses/:id/grades', async (req, res) => {
    res.set('Cache-Control', 'no-store');

    if (!req.session?.usuario || !req.session?.moodleToken) {
      return res.status(401).json({
        success: false,
        error: 'No existe una sesión activa'
      });
    }

    const courseId = Number(req.params.id);
    if (!Number.isSafeInteger(courseId) || courseId <= 0) {
      return res.status(400).json({
        success: false,
        error: 'ID de curso inválido'
      });
    }

    try {
      const data = await consultarMoodle(
        req.session.moodleToken,
        'gradereport_user_get_grade_items',
        {
          courseid: String(courseId),
          userid: String(req.session.usuario.id)
        }
      );

      return res.json({
        success: true,
        usergrades: data.usergrades || []
      });
    } catch (error) {
      console.error('Error consultando calificaciones de Moodle:', error.message);
      return res.status(502).json({
        success: false,
        error: 'No fue posible consultar las calificaciones'
      });
    }
  });
}
