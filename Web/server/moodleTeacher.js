export function configurarProfesorMoodle(app) {

  const base = new URL(process.env.MOODLE_URL);

  async function consultar(token, funcion, parametros = {}) {
    const respuesta = await fetch(
      new URL('/webservice/rest/server.php', base),
      {
        method: 'POST',
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
      throw new Error('Error de comunicacion con Moodle');
    }

    const datos = await respuesta.json();

    if (datos?.exception) {
      const error = new Error(datos.message || 'Moodle rechazo la operacion');
      error.moodleCode = datos.errorcode;
      throw error;
    }

    return datos;
  }


  app.get(
    '/api/auth/courses/:courseId/assignments/:assignmentId/permissions',
    async (req, res) => {

      res.set('Cache-Control', 'no-store');

      if (!req.session?.usuario || !req.session?.moodleToken) {
        return res.status(401).json({
          success: false,
          error: 'Sesion no activa'
        });
      }

      const courseId = Number(req.params.courseId);
      const assignmentId = Number(req.params.assignmentId);

      if (![courseId, assignmentId].every(
        id => Number.isSafeInteger(id) && id > 0
      )) {
        return res.status(400).json({
          success: false,
          error: 'Identificadores invalidos'
        });
      }

      try {

        const info = await consultar(
          req.session.moodleToken,
          'local_iinicia_assignment_permissions',
          { assignid: String(assignmentId) }
        );

        if (
          Number(info.courseid) !== courseId ||
          Number(info.assignid) !== assignmentId
        ) {
          return res.status(403).json({
            success: false,
            error: 'Actividad no disponible'
          });
        }

        return res.json({
          success: true,
          puedeCalificar: info.cangrade === true,
          puedeEntregar: info.cansubmit === true
        });

      } catch (error) {

        return res.status(502).json({
          success: false,
          error: 'No fue posible consultar los permisos de Moodle'
        });

      }
    }
  );

  app.get(
    '/api/auth/teacher/courses/:courseId/assignments/:assignmentId/submissions',
    async (req, res) => {

      res.set('Cache-Control', 'no-store');

      if (!req.session?.usuario || !req.session?.moodleToken) {
        return res.status(401).json({
          success: false,
          error: 'No existe una sesion activa'
        });
      }

      const courseId = Number(req.params.courseId);
      const assignmentId = Number(req.params.assignmentId);

      if (
        !Number.isSafeInteger(courseId) ||
        !Number.isSafeInteger(assignmentId) ||
        courseId <= 0 ||
        assignmentId <= 0
      ) {
        return res.status(400).json({
          success: false,
          error: 'Identificadores invalidos'
        });
      }

      try {

        const token = req.session.moodleToken;

        const actividades = await consultar(
          token,
          'mod_assign_get_assignments',
          {
            'courseids[0]': String(courseId)
          }
        );

        const curso = actividades.courses?.find(
          c => Number(c.id) === courseId
        );

        const tarea = curso?.assignments?.find(
          a => Number(a.id) === assignmentId
        );

        if (!tarea) {
          return res.status(403).json({
            success: false,
            error: 'Actividad no disponible'
          });
        }

        const datos = await consultar(
          token,
          'mod_assign_get_submissions',
          {
            'assignmentids[0]': String(assignmentId)
          }
        );

        const actividad = datos.assignments?.find(
          a => Number(a.assignmentid) === assignmentId
        );

        if (!actividad || datos.warnings?.length) {
          return res.status(403).json({
            success: false,
            error: 'No tienes permiso para consultar las entregas'
          });
        }

        // Las entregas grupales y anonimas requieren
        // un tratamiento independiente.
        if (
          Number(tarea.teamsubmission) === 1 ||
          Number(tarea.blindmarking) === 1
        ) {
          return res.status(422).json({
            success: false,
            error: 'Actividad grupal o anonima no compatible todavia'
          });
        }

        const participantes = await consultar(
          token,
          'mod_assign_list_participants',
          {
            assignid: String(assignmentId),
            groupid: '0',
            filter: '',
            skip: '0',
            limit: '0',
            onlyids: '0',
            includeenrolments: '0'
          }
        );

        if (!Array.isArray(participantes)) {
          throw new Error('Respuesta inesperada de participantes');
        }


        const datosCalificaciones = await consultar(
          token,
          'mod_assign_get_grades',
          {
            'assignmentids[0]': String(assignmentId)
          }
        );

        const advertencias = datosCalificaciones.warnings || [];

        if (advertencias.some(w => String(w.warningcode) !== '3')) {
          return res.status(403).json({
            success: false,
            error: 'No fue posible consultar las calificaciones'
          });
        }

        const calificaciones = datosCalificaciones.assignments?.find(
          a => Number(a.assignmentid) === assignmentId
        )?.grades || [];

        const entregas = actividad.submissions || [];


        const estudiantes = participantes.map(p => {

          const entrega = entregas.find(
            e => Number(e.userid) === Number(p.id)
          );

          const archivos = (entrega?.plugins || [])
            .filter(plugin => plugin.type === 'file')
            .flatMap(plugin => plugin.fileareas || [])
            .flatMap(area => area.files || [])
            .map((archivo, indice) => ({
              indice,
              nombre: archivo.filename,
              tamano: archivo.filesize,
              tipo: archivo.mimetype
            }));

          const registro = calificaciones.find(
            g => Number(g.userid) === Number(p.id) &&
                 Number(g.attemptnumber) === Number(entrega?.attemptnumber)
          );

          const nota = registro?.grade != null
            ? Number(registro.grade)
            : null;

          return {
            calificacion: nota !== null &&
              Number.isFinite(nota) && nota >= 0
              ? nota : null,
            id: p.id,
            nombre: p.fullname,
            estado: entrega?.status || 'new',
            intento: entrega?.attemptnumber ?? null,
            fechaEntrega: entrega?.timemodified || null,
            estadoCalificacion: entrega?.gradingstatus || null,
            archivos
          };
        });

        return res.json({
          success: true,
          tarea: {
            id: tarea.id,
            nombre: tarea.name,
            calificacionMaxima: tarea.grade
          },
          totalEstudiantes: estudiantes.length,
          totalEntregados: estudiantes.filter(
            e => e.estado === 'submitted'
          ).length,
          estudiantes
        });

      } catch (error) {

        console.error(
          'Error consultando entregas del profesor:',
          error.message
        );

        return res.status(502).json({
          success: false,
          error: 'No fue posible consultar las entregas de Moodle'
        });
      }
    }
  );

  app.get(
    '/api/auth/teacher/courses/:courseId/assignments/:assignmentId/students/:studentId/files/:index',
    async (req, res) => {

      res.set('Cache-Control', 'no-store');
      res.set('X-Content-Type-Options', 'nosniff');

      if (!req.session?.usuario || !req.session?.moodleToken) {
        return res.status(401).json({
          success: false,
          error: 'No existe una sesion activa'
        });
      }

      const courseId = Number(req.params.courseId);
      const assignmentId = Number(req.params.assignmentId);
      const studentId = Number(req.params.studentId);
      const index = Number(req.params.index);

      if (
        ![courseId, assignmentId, studentId, index]
          .every(Number.isSafeInteger) ||
        courseId <= 0 ||
        assignmentId <= 0 ||
        studentId <= 0 ||
        index < 0
      ) {
        return res.status(400).json({
          success: false,
          error: 'Identificadores invalidos'
        });
      }

      try {

        const token = req.session.moodleToken;

        const actividades = await consultar(
          token,
          'mod_assign_get_assignments',
          { 'courseids[0]': String(courseId) }
        );

        const curso = actividades.courses?.find(
          c => Number(c.id) === courseId
        );

        const tarea = curso?.assignments?.find(
          a => Number(a.id) === assignmentId
        );

        if (
          !tarea ||
          Number(tarea.teamsubmission) !== 0 ||
          Number(tarea.blindmarking) !== 0
        ) {
          return res.status(403).json({
            success: false,
            error: 'Actividad no disponible'
          });
        }

        const datos = await consultar(
          token,
          'mod_assign_get_submissions',
          { 'assignmentids[0]': String(assignmentId) }
        );

        const actividad = datos.assignments?.find(
          a => Number(a.assignmentid) === assignmentId
        );

        if (!actividad || datos.warnings?.length) {
          return res.status(403).json({
            success: false,
            error: 'No tienes permiso para consultar entregas'
          });
        }

        const entrega = actividad.submissions?.find(
          e => Number(e.userid) === studentId
        );

        const archivos = (entrega?.plugins || [])
          .filter(p => p.type === 'file')
          .flatMap(p => p.fileareas || [])
          .flatMap(a => a.files || []);

        const archivo = archivos[index];

        if (!archivo?.fileurl) {
          return res.status(404).json({
            success: false,
            error: 'Archivo no encontrado'
          });
        }

        const url = new URL(archivo.fileurl);

        if (
          url.origin !== base.origin ||
          !url.pathname.startsWith('/webservice/pluginfile.php/')
        ) {
          return res.status(403).json({
            success: false,
            error: 'Direccion de archivo no permitida'
          });
        }

        url.searchParams.set('token', token);

        const respuesta = await fetch(url, {
          redirect: 'error',
          signal: AbortSignal.timeout(30000)
        });

        if (!respuesta.ok) {
          return res.status(502).json({
            success: false,
            error: 'Moodle no pudo proporcionar el archivo'
          });
        }

        const tipo = (
          respuesta.headers.get('content-type') || ''
        ).split(';')[0].trim().toLowerCase();

        if (
          tipo === 'text/html' ||
          tipo === 'application/json'
        ) {
          return res.status(502).json({
            success: false,
            error: 'Respuesta de archivo no valida'
          });
        }

        const maxBytes = 20 * 1024 * 1024;
        const partes = [];
        let total = 0;

        for await (const parte of respuesta.body) {
          total += parte.length;

          if (total > maxBytes) {
            return res.status(413).json({
              success: false,
              error: 'Archivo demasiado grande'
            });
          }

          partes.push(Buffer.from(parte));
        }

        const contenido = Buffer.concat(partes);

        const esPDF =
          contenido.subarray(0, 5).toString() === '%PDF-';

        if (
          archivo.filename.toLowerCase().endsWith('.pdf') &&
          !esPDF
        ) {
          return res.status(502).json({
            success: false,
            error: 'El documento recibido no es un PDF valido'
          });
        }

        if (esPDF && req.query.download !== '1') {

          res.set('Content-Type', 'application/pdf');
          res.set('Content-Disposition', 'inline');

        } else {

          res.attachment(archivo.filename);
          res.set('Content-Type', 'application/octet-stream');

        }

        return res.send(contenido);

      } catch (error) {

        console.error('Error descargando entrega del profesor');

        return res.status(502).json({
          success: false,
          error: 'No fue posible obtener el documento'
        });

      }
    }
  );




  async function gestionarCancelacion(req, res, revisar) {

    res.set('Cache-Control', 'no-store');

    const rechazar = (status, error) =>
      res.status(status).json({ success: false, error });

    if (!req.session?.usuario || !req.session?.moodleToken) {
      return rechazar(401, 'Sesion no activa');
    }

    if (revisar && (
      req.get('origin') !== 'http://localhost:5173' ||
      !req.is('application/json')
    )) {
      return rechazar(403, 'Solicitud no permitida');
    }

    const courseId = Number(req.params.courseId);
    const assignmentId = Number(req.params.assignmentId);

    if (![courseId, assignmentId].every(
      id => Number.isSafeInteger(id) && id > 0
    )) {
      return rechazar(400, 'Identificadores invalidos');
    }

    try {

      const token = req.session.moodleToken;

      const permisos = await consultar(
        token,
        'local_iinicia_assignment_permissions',
        { assignid: String(assignmentId) }
      );

      if (
        Number(permisos.courseid) !== courseId ||
        Number(permisos.assignid) !== assignmentId ||
        permisos.cangrade !== true
      ) {
        return rechazar(
          403,
          'No tienes permiso para gestionar esta actividad'
        );
      }

      const info = await consultar(
        token,
        'local_iinicia_cancel_status',
        { assignid: String(assignmentId) }
      );

      if (
        info.success !== true ||
        info.role !== 'teacher'
      ) {
        return rechazar(403, 'Operacion reservada al profesor');
      }

      if (!revisar) {
        return res.json({
          success: true,
          compatible: info.compatible === true,
          solicitudes: info.requests || []
        });
      }

      if (info.compatible !== true) {
        return rechazar(422, 'Actividad no compatible');
      }

      const requestid = Number(req.params.requestId);
      const { aprobar } = req.body || {};

      if (
        !Number.isSafeInteger(requestid) ||
        requestid <= 0 ||
        typeof aprobar !== 'boolean'
      ) {
        return rechazar(400, 'Datos de solicitud invalidos');
      }

      const solicitud = (info.requests || []).find(
        r => Number(r.requestid) === requestid &&
             Number(r.assignid) === assignmentId &&
             r.status === 'pending'
      );

      if (!solicitud) {
        return rechazar(
          409,
          'La solicitud ya no esta pendiente'
        );
      }

      const resultado = await consultar(
        token,
        'local_iinicia_review_cancel',
        {
          assignid: String(assignmentId),
          requestid: String(requestid),
          approve: aprobar ? '1' : '0'
        }
      );

      if (resultado.success !== true) {
        return rechazar(
          409,
          resultado.message || 'Moodle rechazo la operacion'
        );
      }

      return res.json({
        success: true,
        requestid,
        estado: resultado.status,
        mensaje: resultado.message
      });

    } catch (error) {

      if ([
        'nopermissions',
        'accessexception',
        'requireloginerror',
        'notingroup'
      ].includes(error.moodleCode)) {
        return rechazar(403, 'No tienes los permisos necesarios');
      }

      console.error(
        'Error gestionando cancelacion:',
        error.moodleCode || error.name
      );

      return rechazar(
        502,
        'No se pudo verificar la operacion. Actualiza antes de reintentar'
      );
    }
  }

  app.get(
    '/api/auth/teacher/courses/:courseId/assignments/:assignmentId/cancellation',
    (req, res) => gestionarCancelacion(req, res, false)
  );

  app.post(
    '/api/auth/teacher/courses/:courseId/assignments/:assignmentId/cancellation/:requestId',
    (req, res) => gestionarCancelacion(req, res, true)
  );

  app.post(
    '/api/auth/teacher/courses/:courseId/assignments/:assignmentId/students/:studentId/grade',
    async (req, res) => {

      res.set('Cache-Control', 'no-store');

      const rechazar = (status, error) =>
        res.status(status).json({ success: false, error });

      if (!req.session?.usuario || !req.session?.moodleToken) {
        return rechazar(401, 'Sesion no activa');
      }

      if (req.get('origin') !== 'http://localhost:5173' ||
          !req.is('application/json')) {
        return rechazar(403, 'Solicitud no permitida');
      }

      const courseId = Number(req.params.courseId);
      const assignmentId = Number(req.params.assignmentId);
      const studentId = Number(req.params.studentId);

      if (![courseId, assignmentId, studentId].every(
        id => Number.isSafeInteger(id) && id > 0
      )) {
        return rechazar(400, 'Identificadores invalidos');
      }

      const { calificacion, comentario, intento } = req.body || {};

      if (
        typeof calificacion !== 'number' ||
        !Number.isFinite(calificacion) ||
        calificacion < 0 ||
        typeof comentario !== 'string' ||
        comentario.length > 10000 ||
        !Number.isSafeInteger(intento) ||
        intento < 0
      ) {
        return rechazar(400, 'Datos de calificacion invalidos');
      }

      let guardadoIniciado = false;

      try {

        const token = req.session.moodleToken;

        const datos = await consultar(
          token,
          'mod_assign_get_submissions',
          { 'assignmentids[0]': String(assignmentId) }
        );

        const actividad = datos.assignments?.find(
          a => Number(a.assignmentid) === assignmentId
        );

        if (!actividad || datos.warnings?.length) {
          return rechazar(403, 'No tienes permiso para calificar');
        }

        const info = await consultar(
          token,
          'local_iinicia_grading_info',
          {
            assignid: String(assignmentId),
            userid: String(studentId)
          }
        );

        if (
          Number(info.courseid) !== courseId ||
          Number(info.assignid) !== assignmentId
        ) {
          return rechazar(403, 'Actividad no disponible');
        }

        if (info.compatible !== true) {
          return rechazar(422, 'Metodo de calificacion no compatible');
        }

        if (info.blocked !== false) {
          return rechazar(409, 'La calificacion esta bloqueada');
        }

        if (info.submitted !== true) {
          return rechazar(409, 'El estudiante no tiene una entrega activa');
        }

        if (Number(info.attempt) !== intento) {
          return rechazar(409, 'La entrega cambio. Actualiza la consulta');
        }

        const entrega = actividad.submissions?.find(
          e => Number(e.userid) === studentId &&
               Number(e.attemptnumber) === intento &&
               e.status === 'submitted'
        );

        if (!entrega) {
          return rechazar(409, 'No se encontro el intento solicitado');
        }

        const maximo = Number(info.maxgrade);

        if (
          !Number.isFinite(maximo) ||
          maximo <= 0 ||
          calificacion > maximo
        ) {
          return rechazar(400, 'Calificacion fuera del rango permitido');
        }

        guardadoIniciado = true;

        await consultar(
          token,
          'mod_assign_save_grade',
          {
            assignmentid: String(assignmentId),
            userid: String(studentId),
            grade: String(calificacion),
            attemptnumber: String(intento),
            addattempt: '0',
            workflowstate: '',
            applytoall: '0',
            'plugindata[assignfeedbackcomments_editor][text]': comentario,
            'plugindata[assignfeedbackcomments_editor][format]': '2'
          }
        );

        const verificacion = await consultar(
          token,
          'mod_assign_get_grades',
          { 'assignmentids[0]': String(assignmentId) }
        );

        const registro = verificacion.assignments?.find(
          a => Number(a.assignmentid) === assignmentId
        )?.grades?.find(
          g => Number(g.userid) === studentId &&
               Number(g.attemptnumber) === intento
        );

        const confirmada =
          !verificacion.warnings?.length &&
          registro?.grade != null &&
          Math.abs(Number(registro.grade) - calificacion) < 0.00001;

        if (!confirmada) {
          return rechazar(
            502,
            'No se pudo confirmar el guardado. Consulta la nota antes de reintentar'
          );
        }

        return res.json({
          success: true,
          courseId,
          assignmentId,
          studentId,
          calificacion: Number(registro.grade),
          calificacionMaxima: maximo,
          intento,
          mensaje: 'Calificacion verificada en Moodle'
        });

      } catch (error) {

        console.error(
          'Error en calificacion dinamica:',
          error.moodleCode || error.name
        );

        if (guardadoIniciado) {
          return rechazar(
            502,
            'Guardado no confirmado. Consulta Moodle antes de reintentar'
          );
        }

        if ([
          'accessexception',
          'nopermissions',
          'requireloginerror',
          'notingroup'
        ].includes(error.moodleCode)) {
          return rechazar(403, 'No tienes permiso para calificar');
        }

        return rechazar(502, 'No fue posible validar la calificacion');

      }
    }
  );

}
