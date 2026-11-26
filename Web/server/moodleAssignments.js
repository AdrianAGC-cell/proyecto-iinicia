import multer from 'multer';

export function configurarTareasMoodle(app) {

  const base = new URL(process.env.MOODLE_URL);


  function limitesArchivos(tarea) {
    const configs = Object.fromEntries(
      (tarea.configs || [])
        .filter(c =>
          c.plugin === 'file' &&
          c.subtype === 'assignsubmission'
        )
        .map(c => [c.name, c.value])
    );

    const cantidad = Number(configs.maxfilesubmissions);
    const bytes = Number(configs.maxsubmissionsizebytes);

    return {
      maxArchivos: cantidad > 0
        ? Math.min(cantidad, 10)
        : 0,
      maxBytes: bytes > 0
        ? Math.min(bytes, 20 * 1024 * 1024)
        : 20 * 1024 * 1024,
      formatos: String(configs.filetypeslist || '')
        .split(/[\s,;]+/)
        .filter(Boolean)
    };
  }

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

    if (datos.exception) {
      throw new Error(datos.errorcode || 'Error Moodle');
    }

    return datos;
  }

  app.get('/api/auth/courses/:courseId/assignments', async (req, res) => {

    res.set('Cache-Control', 'no-store');

    if (!req.session?.usuario || !req.session?.moodleToken) {
      return res.status(401).json({
        success: false,
        error: 'No existe una sesion activa'
      });
    }

    const courseId = Number(req.params.courseId);
    const token = req.session.moodleToken;

    if (!Number.isSafeInteger(courseId) || courseId <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Curso invalido'
      });
    }

    try {

      const cursos = await consultar(
        token,
        'core_enrol_get_users_courses',
        { userid: String(req.session.usuario.id) }
      );

      if (!Array.isArray(cursos) ||
          !cursos.some(c => Number(c.id) === courseId)) {
        return res.status(403).json({
          success: false,
          error: 'No tienes acceso a este curso'
        });
      }

      const datos = await consultar(
        token,
        'mod_assign_get_assignments',
        { 'courseids[0]': String(courseId) }
      );

      const curso = (datos.courses || [])
        .find(c => Number(c.id) === courseId);

      const secciones = await consultar(
        token,
        'core_course_get_contents',
        { courseid: String(courseId) }
      );

      const visibles = new Set(
        secciones
          .filter(s => s.visible !== 0 && s.uservisible !== false)
          .flatMap(s => s.modules || [])
          .filter(m => m.modname === 'assign' &&
                       m.visible !== 0 &&
                       m.uservisible !== false)
          .map(m => Number(m.id))
      );

      const tareas = (curso?.assignments || [])
        .filter(t => visibles.has(Number(t.cmid)))
        .map(t => ({
          id: t.id,
          moduloId: t.cmid,
          nombre: t.name,
          descripcion: t.intro || '',
          fechaLimite: t.duedate || 0,
          fechaCierre: t.cutoffdate || 0,
          permiteEntregasDesde: t.allowsubmissionsfromdate || 0,
          requiereConfirmacion: Boolean(t.submissiondrafts),
          limites: limitesArchivos(t),
          archivos: (t.introattachments || []).map((a, i) => ({
            indice: i,
            nombre: a.filename,
            tipo: a.mimetype,
            tamano: a.filesize
          }))
        }));

      return res.json({
        success: true,
        cursoId: courseId,
        total: tareas.length,
        tareas
      });

    } catch (error) {

      console.error('Error consultando tareas Moodle:', error.message);

      return res.status(502).json({
        success: false,
        error: 'No fue posible consultar las tareas'
      });
    }
  });

  async function obtenerTarea(req) {
    const token = req.session.moodleToken;
    const courseId = Number(req.params.courseId);
    const assignmentId = Number(req.params.assignmentId);

    if (![courseId, assignmentId].every(
      n => Number.isSafeInteger(n) && n > 0
    )) {
      return null;
    }

    const cursos = await consultar(
      token,
      'core_enrol_get_users_courses',
      { userid: String(req.session.usuario.id) }
    );

    if (!cursos.some(c => Number(c.id) === courseId)) {
      return null;
    }

    const datos = await consultar(
      token,
      'mod_assign_get_assignments',
      { 'courseids[0]': String(courseId) }
    );

    const curso = (datos.courses || [])
      .find(c => Number(c.id) === courseId);

    const tarea = (curso?.assignments || [])
      .find(t => Number(t.id) === assignmentId);

    if (!tarea) return null;

    const secciones = await consultar(
      token,
      'core_course_get_contents',
      { courseid: String(courseId) }
    );

    const visible = secciones
      .filter(s => s.visible !== 0 && s.uservisible !== false)
      .flatMap(s => s.modules || [])
      .some(m =>
        Number(m.id) === Number(tarea.cmid) &&
        m.modname === 'assign' &&
        m.visible !== 0 &&
        m.uservisible !== false
      );

    return visible ? tarea : null;
  }

  app.get(
    '/api/auth/courses/:courseId/assignments/:assignmentId/files/:index',
    async (req, res) => {

      res.set('Cache-Control', 'no-store');

      if (!req.session?.usuario || !req.session?.moodleToken) {
        return res.status(401).json({
          success: false,
          error: 'Sesion no activa'
        });
      }

      try {
        const tarea = await obtenerTarea(req);
        const indice = Number(req.params.index);

        if (!tarea || !Number.isSafeInteger(indice) || indice < 0) {
          return res.sendStatus(404);
        }

        const archivo = tarea.introattachments?.[indice];

        if (!archivo?.fileurl) {
          return res.sendStatus(404);
        }

        const url = new URL(archivo.fileurl);

        if (
          url.origin !== base.origin ||
          !url.pathname.startsWith('/webservice/pluginfile.php/')
        ) {
          return res.sendStatus(403);
        }

        url.searchParams.set(
          'token',
          req.session.moodleToken
        );

        const respuesta = await fetch(url, {
          redirect: 'error',
          signal: AbortSignal.timeout(30000)
        });

        if (!respuesta.ok) {
          return res.sendStatus(502);
        }

        const tipo = respuesta.headers.get('content-type') || '';

        if (!tipo.toLowerCase().startsWith('application/pdf')) {
          return res.status(415).json({
            error: 'Por ahora solo se permite descargar PDF'
          });
        }

        const contenido = Buffer.from(
          await respuesta.arrayBuffer()
        );

        res.set('Content-Type', 'application/pdf');
        res.set('X-Content-Type-Options', 'nosniff');
        res.set('Content-Disposition', 'inline');

        return res.send(contenido);

      } catch (error) {
        console.error('Error descargando archivo de tarea');
        return res.sendStatus(502);
      }
    }
  );

  app.get(
    '/api/auth/courses/:courseId/assignments/:assignmentId/status',
    async (req, res) => {

      res.set('Cache-Control', 'no-store');

      if (!req.session?.usuario || !req.session?.moodleToken) {
        return res.sendStatus(401);
      }

      try {
        const tarea = await obtenerTarea(req);

        if (!tarea) return res.sendStatus(404);

        const datos = await consultar(
          req.session.moodleToken,
          'mod_assign_get_submission_status',
          { assignid: String(tarea.id) }
        );

        return res.json({
          success: true,
          estado: datos.lastattempt?.submission?.status || 'new',
          archivosEntregados: (
            datos.lastattempt?.submission?.plugins || []
          )
            .filter(p => p.type === 'file')
            .flatMap(p => p.fileareas || [])
            .flatMap(a => a.files || [])
            .map(f => ({
              nombre: f.filename,
              tamano: f.filesize
            })),
          calificada: datos.lastattempt?.graded === true,
          puedeDeshacer:
            Number(tarea.teamsubmission) === 0 &&
            datos.lastattempt?.graded === false &&
            datos.lastattempt?.gradingstatus === 'notgraded' &&
            datos.lastattempt?.canedit === true &&
            ['submitted', 'draft'].includes(
              datos.lastattempt?.submission?.status
            ),
          puedeEditar:
            datos.lastattempt?.graded === false &&
            datos.lastattempt?.gradingstatus === 'notgraded' &&
            datos.lastattempt?.canedit === true,
          puedeEnviar:
            datos.lastattempt?.graded === false &&
            datos.lastattempt?.gradingstatus === 'notgraded' &&
            datos.lastattempt?.cansubmit === true
        });

      } catch (error) {
        console.error('Error consultando estado de entrega');
        return res.sendStatus(502);
      }
    }
  );



  app.get(
    '/api/auth/courses/:courseId/assignments/:assignmentId/cancellation',
    async (req, res) => {

      res.set('Cache-Control', 'no-store');

      const rechazar = (status, error) =>
        res.status(status).json({ success: false, error });

      if (!req.session?.usuario || !req.session?.moodleToken) {
        return rechazar(401, 'Sesion no activa');
      }

      try {
        const tarea = await obtenerTarea(req);

        if (!tarea) {
          return rechazar(404, 'Actividad no encontrada');
        }

        const token = req.session.moodleToken;

        const info = await consultar(
          token,
          'local_iinicia_cancel_status',
          { assignid: String(tarea.id) }
        );

        if (info.role !== 'student') {
          return rechazar(403, 'Operacion reservada al estudiante');
        }

        const datos = await consultar(
          token,
          'mod_assign_get_submission_status',
          { assignid: String(tarea.id) }
        );

        const intento = datos.lastattempt;
        const entrega = intento?.submission;

        const solicitudes = (info.requests || [])
          .filter(r =>
            Number(r.userid) === Number(req.session.usuario.id)
          );

        const ultima = solicitudes[0] || null;

        const pendiente = ultima?.status === 'pending' &&
          entrega?.status === 'submitted' &&
          Number(ultima.attemptnumber) === Number(entrega.attemptnumber) &&
          Number(ultima.timecreated) >= Number(entrega.timemodified);

        const archivos = (entrega?.plugins || [])
          .filter(p => p.type === 'file')
          .flatMap(p => p.fileareas || [])
          .flatMap(a => a.files || []);

        return res.json({
          success: true,
          compatible: info.compatible === true,
          pendiente,
          solicitud: ultima,
          puedeSolicitar:
            info.compatible === true &&
            entrega?.status === 'submitted' &&
            intento?.graded === false &&
            intento?.gradingstatus === 'notgraded' &&
            intento?.locked === false &&
            archivos.length > 0 &&
            !pendiente
        });

      } catch (error) {
        console.error('Error consultando cancelacion:', error.message);

        return rechazar(
          502,
          'No fue posible consultar las solicitudes'
        );
      }
    }
  );

  app.post(
    '/api/auth/courses/:courseId/assignments/:assignmentId/cancellation',
    async (req, res) => {

      res.set('Cache-Control', 'no-store');

      const rechazar = (status, error) =>
        res.status(status).json({ success: false, error });

      if (!req.session?.usuario || !req.session?.moodleToken) {
        return rechazar(401, 'Sesion no activa');
      }

      if (!(process.env.WEB_ORIGINS || 'http://localhost:5173').split(',').map(o => o.trim()).includes(req.get('origin'))) {
        return rechazar(403, 'Origen no permitido');
      }

      try {
        const tarea = await obtenerTarea(req);

        if (!tarea) {
          return rechazar(404, 'Actividad no encontrada');
        }

        const token = req.session.moodleToken;

        const datos = await consultar(
          token,
          'mod_assign_get_submission_status',
          { assignid: String(tarea.id) }
        );

        const intento = datos.lastattempt;

        if (
          intento?.submission?.status !== 'submitted' ||
          intento?.graded !== false ||
          intento?.gradingstatus !== 'notgraded' ||
          intento?.locked !== false
        ) {
          return rechazar(
            409,
            'La entrega no permite solicitar cancelacion'
          );
        }

        const resultado = await consultar(
          token,
          'local_iinicia_request_cancel',
          { assignid: String(tarea.id) }
        );

        if (resultado.success !== true) {
          return rechazar(
            409,
            resultado.message || 'Moodle rechazo la solicitud'
          );
        }

        return res.json({
          success: true,
          requestid: resultado.requestid,
          estado: resultado.status,
          mensaje: resultado.message
        });

      } catch (error) {

        if (['nopermissions', 'accessexception'].includes(error.message)) {
          return rechazar(403, 'No tienes permiso para solicitar cancelacion');
        }

        console.error('Error solicitando cancelacion:', error.message);

        return rechazar(
          502,
          'No se pudo verificar la solicitud. Actualiza antes de reintentar'
        );
      }
    }
  );

  const recibirArchivo = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 20 * 1024 * 1024,
      files: 10,
      fields: 0,
      parts: 11
    }
  }).array('archivo', 10);

  app.post(
    '/api/auth/courses/:courseId/assignments/:assignmentId/submit',
    async (req, res) => {

      res.set('Cache-Control', 'no-store');

      if (!req.session?.usuario || !req.session?.moodleToken) {
        return res.status(401).json({
          success: false,
          error: 'Sesion no activa'
        });
      }

      const origen = req.get('origin');

      if (origen && !(process.env.WEB_ORIGINS ||
        'http://localhost:5173'
      ).split(',').map(o => o.trim()).includes(origen)) {
        return res.sendStatus(403);
      }

      try {

        const tarea = await obtenerTarea(req);

        if (!tarea) {
          return res.sendStatus(404);
        }

        const token = req.session.moodleToken;

        const estado = await consultar(
          token,
          'mod_assign_get_submission_status',
          { assignid: String(tarea.id) }
        );

        if (
          estado.lastattempt?.graded !== false ||
          estado.lastattempt?.gradingstatus !== 'notgraded'
        ) {
          return res.status(409).json({
            success: false,
            error: 'No puedes modificar una actividad ya calificada o cuyo estado no se pudo verificar'
          });
        }


        if (estado.lastattempt?.canedit !== true) {
          return res.status(403).json({
            success: false,
            error: 'Moodle no permite editar esta entrega'
          });
        }

        const anterior = estado.lastattempt?.submission;

        if (
          anterior &&
          anterior.status &&
          !['new', 'reopened'].includes(anterior.status)
        ) {
          return res.status(409).json({
            success: false,
            error: 'Ya existe una entrega. No se reemplazara automaticamente.'
          });
        }

        await new Promise((resolve, reject) => {
          recibirArchivo(req, res, error => {
            if (error) reject(error);
            else resolve();
          });
        });


        const seleccionados = req.files || [];
        const limites = limitesArchivos(tarea);

        if (
          !seleccionados.length ||
          seleccionados.length > limites.maxArchivos
        ) {
          return res.status(400).json({
            success: false,
            error: `Moodle permite hasta ${limites.maxArchivos} archivos`
          });
        }

        const nombres = new Set();

        for (const archivo of seleccionados) {
          const nombre = archivo.originalname.toLowerCase();

          if (nombres.has(nombre)) {
            return res.status(400).json({
              success: false,
              error: 'No se permiten nombres de archivo duplicados'
            });
          }

          nombres.add(nombre);

          if (archivo.size > limites.maxBytes) {
            return res.status(400).json({
              success: false,
              error: `Archivo demasiado grande: ${archivo.originalname}`
            });
          }

          if (
            nombre.endsWith('.pdf') &&
            archivo.buffer.subarray(0, 5).toString() !== '%PDF-'
          ) {
            return res.status(415).json({
              success: false,
              error: 'El archivo PDF no es valido'
            });
          }

          const formatos = limites.formatos.map(
            f => f.toLowerCase()
          );

          if (
            formatos.length &&
            formatos.every(f => f.startsWith('.')) &&
            !formatos.some(f => nombre.endsWith(f))
          ) {
            return res.status(415).json({
              success: false,
              error: `Formato no permitido: ${archivo.originalname}`
            });
          }
        }

        const totalBytes = seleccionados.reduce(
          (total, a) => total + a.size, 0
        );

        if (totalBytes > 50 * 1024 * 1024) {
          return res.status(400).json({
            success: false,
            error: 'La entrega supera el limite total de 50 MB'
          });
        }

        let itemid = 0;
        const nombresRegistrados = [];

        for (const archivo of seleccionados) {
          const formulario = new FormData();

          formulario.append('token', token);
          formulario.append('itemid', String(itemid));

          formulario.append(
            'file_1',
            new Blob(
              [archivo.buffer],
              { type: archivo.mimetype }
            ),
            archivo.originalname
          );

          const subida = await fetch(
            new URL('/webservice/upload.php', base),
            {
              method: 'POST',
              body: formulario,
              redirect: 'error',
              signal: AbortSignal.timeout(60000)
            }
          );

          if (!subida.ok) {
            throw new Error('Error HTTP subiendo archivo');
          }

          const resultado = await subida.json();
          const registrado = resultado?.[0];

          if (
            !Array.isArray(resultado) ||
            !registrado?.itemid ||
            registrado.error ||
            registrado.errortype ||
            !registrado.filename ||
            nombresRegistrados.includes(registrado.filename) ||
            (itemid && Number(registrado.itemid) !== Number(itemid))
          ) {
            throw new Error('Moodle rechazo uno de los archivos');
          }

          itemid = registrado.itemid;
          nombresRegistrados.push(registrado.filename);

          console.log('Archivo aceptado por Moodle:', {
            original: archivo.originalname,
            registrado: registrado.filename,
            bytes: archivo.size
          });
        }

        const guardado = await consultar(
          token,
          'mod_assign_save_submission',
          {
            assignmentid: String(tarea.id),
            'plugindata[files_filemanager]': String(itemid)
          }
        );

        if (
          (Array.isArray(guardado) && guardado.length > 0) ||
          guardado?.warnings?.length
        ) {
          return res.status(422).json({
            success: false,
            error: 'Moodle reporto advertencias al guardar. Revisa el estado de la tarea.'
          });
        }

        const final = await consultar(
          token,
          'mod_assign_get_submission_status',
          { assignid: String(tarea.id) }
        );

        const entrega = final.lastattempt?.submission;

        const archivos = (entrega?.plugins || [])
          .flatMap(p => p.fileareas || [])
          .flatMap(a => a.files || [])
          .map(f => f.filename);

        const verificado = nombresRegistrados.every(
          nombre => archivos.includes(nombre)
        ) && archivos.length === seleccionados.length &&
          entrega?.status === (
            Number(tarea.submissiondrafts) === 1
              ? 'draft'
              : 'submitted'
          );

        return res.status(verificado ? 200 : 502).json({
          success: verificado,
          archivo: seleccionados[0].originalname,
          estado: entrega?.status || 'desconocido',
          archivos,
          requiereConfirmacion: Boolean(tarea.submissiondrafts),
          mensaje: verificado
            ? 'Archivos registrados en Moodle'
            : 'No se pudieron verificar todos los archivos'
        });

      } catch (error) {

        if (error instanceof multer.MulterError) {
          return res.status(400).json({
            success: false,
            error: 'Archivo demasiado grande o formulario invalido'
          });
        }

        console.error('Error procesando entrega:', error.message);

        return res.status(502).json({
          success: false,
          error: 'No fue posible completar la entrega en Moodle'
        });
      }
    }
  );



  app.post(
    '/api/auth/courses/:courseId/assignments/:assignmentId/confirm',
    async (req, res) => {

      res.set('Cache-Control', 'no-store');

      const rechazar = (status, error) =>
        res.status(status).json({ success: false, error });

      if (!req.session?.usuario || !req.session?.moodleToken) {
        return rechazar(401, 'Sesion no activa');
      }

      if (!(process.env.WEB_ORIGINS || 'http://localhost:5173').split(',').map(o => o.trim()).includes(req.get('origin'))) {
        return rechazar(403, 'Origen no permitido');
      }

      try {
        const tarea = await obtenerTarea(req);

        if (!tarea) {
          return rechazar(404, 'Actividad no encontrada');
        }

        if (
          Number(tarea.submissiondrafts) !== 1 ||
          Number(tarea.teamsubmission) !== 0 ||
          Number(tarea.requiresubmissionstatement) !== 0
        ) {
          return rechazar(422, 'Configuracion de entrega no compatible');
        }

        const token = req.session.moodleToken;

        const consultarEstado = () => consultar(
          token,
          'mod_assign_get_submission_status',
          { assignid: String(tarea.id) }
        );

        const actual = await consultarEstado();
        const intento = actual.lastattempt;

        if (
          intento?.graded !== false ||
          intento?.gradingstatus !== 'notgraded'
        ) {
          return rechazar(409, 'Actividad calificada o estado no verificable');
        }

        if (
          intento?.submission?.status !== 'draft' ||
          intento?.cansubmit !== true
        ) {
          return rechazar(409, 'Moodle no permite confirmar esta entrega');
        }

        const obtenerArchivos = datos =>
          (datos.lastattempt?.submission?.plugins || [])
            .filter(p => p.type === 'file')
            .flatMap(p => p.fileareas || [])
            .flatMap(a => a.files || [])
            .map(f => JSON.stringify([
              f.filepath,
              f.filename,
              f.filesize
            ]))
            .sort();

        const archivosAntes = obtenerArchivos(actual);

        if (!archivosAntes.length) {
          return rechazar(400, 'No existen archivos guardados');
        }

        const resultado = await consultar(
          token,
          'mod_assign_submit_for_grading',
          {
            assignmentid: String(tarea.id),
            acceptsubmissionstatement: '0'
          }
        );

        if (
          (Array.isArray(resultado) && resultado.length) ||
          resultado?.warnings?.length
        ) {
          return rechazar(409, 'Moodle rechazo la confirmacion');
        }

        const actualizado = await consultarEstado();
        const archivosDespues = obtenerArchivos(actualizado);

        if (
          actualizado.lastattempt?.submission?.status !== 'submitted' ||
          JSON.stringify(archivosAntes) !== JSON.stringify(archivosDespues)
        ) {
          return rechazar(502, 'No se pudo verificar el envio. Consulta el estado antes de reintentar');
        }

        return res.json({
          success: true,
          estado: 'submitted',
          mensaje: 'Entrega confirmada correctamente en Moodle'
        });

      } catch (error) {
        console.error('Error confirmando entrega:', error.message);

        return rechazar(
          502,
          'No se pudo confirmar el resultado. Consulta el estado de la entrega'
        );
      }
    }
  );

  app.post(
    '/api/auth/courses/:courseId/assignments/:assignmentId/undo',
    async (req, res) => {

      res.set('Cache-Control', 'no-store');

      if (!req.session?.usuario || !req.session?.moodleToken) {
        return res.status(401).json({
          success: false,
          error: 'Sesion no activa'
        });
      }

      const origen = req.get('origin');

      if (origen && !(process.env.WEB_ORIGINS ||
        'http://localhost:5173'
      ).split(',').map(o => o.trim()).includes(origen)) {
        return res.sendStatus(403);
      }

      try {
        const tarea = await obtenerTarea(req);

        if (!tarea) return res.sendStatus(404);

        if (Number(tarea.teamsubmission) === 1) {
          return res.status(403).json({
            success: false,
            error: 'Las entregas grupales requieren otro procedimiento'
          });
        }

        const token = req.session.moodleToken;

        const actual = await consultar(
          token,
          'mod_assign_get_submission_status',
          { assignid: String(tarea.id) }
        );

        if (
          actual.lastattempt?.graded !== false ||
          actual.lastattempt?.gradingstatus !== 'notgraded'
        ) {
          return res.status(409).json({
            success: false,
            error: 'La entrega ya fue calificada o no se pudo verificar su calificacion'
          });
        }

        if (!['submitted', 'draft'].includes(
          actual.lastattempt?.submission?.status
        )) {
          return res.status(409).json({
            success: false,
            error: 'No existe una entrega activa para retirar'
          });
        }

        if (actual.lastattempt?.canedit !== true) {
          return res.status(403).json({
            success: false,
            error: 'Moodle no permite deshacer esta entrega'
          });
        }

        const resultado = await consultar(
          token,
          'mod_assign_remove_submission',
          {
            userid: String(req.session.usuario.id),
            assignid: String(tarea.id)
          }
        );

        if (resultado.status !== true) {
          return res.status(409).json({
            success: false,
            error: 'Moodle rechazo la solicitud de deshacer entrega'
          });
        }

        const actualizado = await consultar(
          token,
          'mod_assign_get_submission_status',
          { assignid: String(tarea.id) }
        );

        return res.json({
          success: true,
          estado: actualizado.lastattempt?.submission?.status || 'new',
          mensaje: 'Entrega retirada correctamente'
        });

      } catch (error) {
        console.error('Error retirando entrega:', error.message);

        return res.status(502).json({
          success: false,
          error: 'No fue posible verificar la retirada en Moodle'
        });
      }
    }
  );


  app.get(
    '/api/auth/courses/:courseId/assignments/:assignmentId/submission-files/:index',
    async (req, res) => {

      res.set('Cache-Control', 'no-store');

      if (!req.session?.usuario || !req.session?.moodleToken) {
        return res.sendStatus(401);
      }

      try {
        const tarea = await obtenerTarea(req);

        if (!tarea) return res.sendStatus(404);

        const token = req.session.moodleToken;

        const datos = await consultar(
          token,
          'mod_assign_get_submission_status',
          {
            assignid: String(tarea.id),
            userid: String(req.session.usuario.id)
          }
        );

        const archivos = (
          datos.lastattempt?.submission?.plugins || []
        )
          .filter(p => p.type === 'file')
          .flatMap(p => p.fileareas || [])
          .flatMap(a => a.files || []);

        const indice = Number(req.params.index);

        if (!Number.isSafeInteger(indice) || indice < 0) {
          return res.sendStatus(400);
        }

        const archivo = archivos[indice];

        if (!archivo?.fileurl) {
          return res.sendStatus(404);
        }

        const url = new URL(archivo.fileurl);

        if (
          url.origin !== base.origin ||
          !url.pathname.startsWith('/webservice/pluginfile.php/')
        ) {
          return res.sendStatus(403);
        }

        url.searchParams.set('token', token);

        const respuesta = await fetch(url, {
          redirect: 'error',
          signal: AbortSignal.timeout(30000)
        });

        if (!respuesta.ok) {
          return res.sendStatus(502);
        }

        const contenido = Buffer.from(
          await respuesta.arrayBuffer()
        );


        const tipo = (
          respuesta.headers.get('content-type') || ''
        ).split(';')[0].trim().toLowerCase();

        const esPDF =
          contenido.subarray(0, 5).toString() === '%PDF-';

        const imagen = [
          'image/png',
          'image/jpeg',
          'image/gif',
          'image/webp'
        ].includes(tipo);

        const visualizar =
          req.query.download !== '1' && (esPDF || imagen);

        res.set('X-Content-Type-Options', 'nosniff');

        if (visualizar) {
          res.set(
            'Content-Type',
            esPDF ? 'application/pdf' : tipo
          );
          res.set('Content-Disposition', 'inline');
        } else {
          res.attachment(archivo.filename);
          res.set('Content-Type', 'application/octet-stream');
        }

        return res.send(contenido);

      } catch (error) {
        console.error('Error consultando archivo entregado');
        return res.sendStatus(502);
      }
    }
  );

}
