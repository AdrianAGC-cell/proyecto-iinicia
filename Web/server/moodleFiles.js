export function configurarArchivosMoodle(app) {

  app.get('/api/auth/courses/:courseId/resources/:moduleId', async (req, res) => {

    res.set('Cache-Control', 'no-store');

    if (!req.session?.usuario || !req.session?.moodleToken) {
      return res.status(401).json({
        error: 'No existe una sesion activa'
      });
    }

    const courseId = Number(req.params.courseId);
    const moduleId = Number(req.params.moduleId);

    if (!Number.isSafeInteger(courseId) ||
        !Number.isSafeInteger(moduleId) ||
        courseId <= 0 || moduleId <= 0) {
      return res.status(400).json({
        error: 'Identificador invalido'
      });
    }

    try {
      const base = new URL(process.env.MOODLE_URL);
      const token = req.session.moodleToken;

      const consultar = async (funcion, parametros) => {
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

        const datos = await respuesta.json();

        if (!respuesta.ok || datos.exception) {
          throw new Error('Consulta Moodle rechazada');
        }

        return datos;
      };

      const cursos = await consultar(
        'core_enrol_get_users_courses',
        { userid: String(req.session.usuario.id) }
      );

      if (!Array.isArray(cursos) ||
          !cursos.some(c => Number(c.id) === courseId)) {
        return res.status(403).json({
          error: 'No tienes acceso a este curso'
        });
      }

      const secciones = await consultar(
        'core_course_get_contents',
        { courseid: String(courseId) }
      );

      const recurso = secciones
        .filter(s => s.visible !== 0 && s.uservisible !== false)
        .flatMap(s => s.modules || [])
        .find(m =>
          m.id === moduleId &&
          m.modname === 'resource' &&
          m.visible !== 0 &&
          m.uservisible !== false
        );

      const archivo = recurso?.contents?.find(a =>
        a.type === 'file' &&
        a.filename?.toLowerCase().endsWith('.pdf')
      );

      if (!archivo?.fileurl) {
        return res.status(404).json({
          error: 'PDF no disponible'
        });
      }

      const url = new URL(archivo.fileurl);

      if (url.origin !== base.origin ||
          !url.pathname.startsWith('/webservice/pluginfile.php/')) {
        return res.status(403).json({
          error: 'Direccion de archivo no permitida'
        });
      }

      url.searchParams.set('token', token);

      const descarga = await fetch(url, {
        redirect: 'error',
        signal: AbortSignal.timeout(30000)
      });

      const tipo = descarga.headers.get('content-type') || '';

      if (!descarga.ok || !tipo.includes('application/pdf')) {
        return res.status(502).json({
          error: 'No fue posible recuperar el PDF'
        });
      }

      const pdf = Buffer.from(await descarga.arrayBuffer());

      res.set('Content-Type', 'application/pdf');
      res.set('X-Content-Type-Options', 'nosniff');
      res.set('Content-Disposition', 'inline; filename="recurso.pdf"');
      res.send(pdf);

    } catch (error) {
      res.status(502).json({
        error: 'No fue posible consultar el recurso de Moodle'
      });
    }
  });
}
