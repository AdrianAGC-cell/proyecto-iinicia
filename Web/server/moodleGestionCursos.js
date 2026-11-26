import { activarEstudiante } from './activacionEstudiante.js';
import { exigirRoles } from './moodleRoles.js';

const academicos = [
    'superadmin',
    'admin_academico',
    'coordinador'
];

async function moodle(req, funcion, parametros = {}) {

    const respuesta = await fetch(
        new URL(
            '/webservice/rest/server.php',
            process.env.MOODLE_URL
        ),
        {
            method: 'POST',
            body: new URLSearchParams({
                ...parametros,
                wstoken: req.session.moodleToken,
                wsfunction: funcion,
                moodlewsrestformat: 'json'
            }),
            redirect: 'error',
            signal: AbortSignal.timeout(15000)
        }
    );

    if (!respuesta.ok) {
        throw new Error('Moodle no disponible');
    }

    const datos = await respuesta.json();

    if (datos?.exception || datos?.errorcode) {
        console.error('[IINICIA Moodle]', {
            funcion,
            exception: datos.exception,
            errorcode: datos.errorcode,
            mensaje: String(datos.message || '').slice(0, 500)
        });

        throw new Error('Moodle rechazo la operacion');
    }

    return datos;
}

function tieneAcceso(req, categoria) {

    const usuario = req.session.usuario;

    if (usuario.roles.some(r =>
        ['superadmin', 'admin_academico'].includes(r)
    )) {
        return true;
    }

    return usuario.ambitos.some(a =>
        a.rol === 'coordinador' &&
        a.contexto === 40 &&
        a.instancia === Number(categoria)
    );
}

function entero(valor) {
    const n = Number(valor);

    return Number.isSafeInteger(n) && n > 0
        ? n
        : null;
}

function validarOrigen(req, res, next) {

    if (
        req.get('origin') !== 'http://localhost:5173' ||
        !req.is('application/json')
    ) {
        return res.status(403).json({
            success: false,
            error: 'Origen o formato no autorizado'
        });
    }

    next();
}

async function buscarCurso(req, id) {

    const cursos = await moodle(
        req,
        'core_course_get_courses',
        { 'options[ids][0]': id }
    );

    if (!Array.isArray(cursos)) {
        throw new Error('Respuesta Moodle invalida');
    }

    return cursos.find(c => Number(c.id) === id);
}

export function configurarGestionCursos(app) {

    app.get(
        '/api/auth/admin/categorias',
        exigirRoles(...academicos),
        async (req, res) => {
            try {
                const datos = await moodle(
                    req,
                    'core_course_get_categories'
                );

                const categorias = datos
                    .filter(c => tieneAcceso(req, c.id))
                    .map(c => ({
                        id: c.id,
                        nombre: c.name
                    }));

                res.json({
                    success: true,
                    categorias
                });

            } catch (error) {
                console.error(
                    '[IINICIA Gestion]',
                    error.message
                );
                res.status(503).json({
                    success: false,
                    error: 'No se pudieron consultar las categorias'
                });
            }
        }
    );

    app.get(
        '/api/auth/admin/cursos',
        exigirRoles(...academicos),
        async (req, res) => {
            try {
                const categorias = await moodle(
                    req,
                    'core_course_get_categories'
                );

                if (!Array.isArray(categorias)) {
                    throw new Error('Categorias invalidas');
                }

                const permitidas = categorias.filter(
                    c => tieneAcceso(req, c.id)
                );

                const resultados = await Promise.all(
                    permitidas.map(async categoria => {
                        const datos = await moodle(
                            req,
                            'core_course_get_courses_by_field',
                            {
                                field: 'category',
                                value: String(categoria.id)
                            }
                        );

                        if (!Array.isArray(datos?.courses)) {
                            throw new Error('Cursos invalidos');
                        }

                        return datos.courses
                            .filter(c =>
                                Number(c.id) !== 1 &&
                                Number(c.categoryid) === Number(categoria.id) &&
                                tieneAcceso(req, c.categoryid)
                            )
                            .map(c => ({
                                id: c.id,
                                nombre: c.fullname,
                                nombreCorto: c.shortname,
                                categoria: c.categoryid,
                                categoriaId: c.categoryid,
                                categoriaNombre: categoria.name,
                                visible: Number(c.visible) === 1
                            }));
                    })
                );

                res.json({
                    success: true,
                    cursos: resultados.flat()
                });

            } catch (error) {
                console.error(
                    '[IINICIA Listar Cursos]',
                    error.message
                );

                res.status(503).json({
                    success: false,
                    error: 'No se pudieron consultar los cursos'
                });
            }
        }
    );

    app.post(
        '/api/auth/admin/cursos',
        validarOrigen,
        exigirRoles('superadmin', 'admin_academico'),

        async (req, res) => {

            const nombre = String(
                req.body.nombre || ''
            ).trim();

            const clave = String(
                req.body.clave || ''
            ).trim();

            const categoria = entero(req.body.categoria);

            if (
                !nombre || nombre.length > 254 ||
                !clave || clave.length > 100 ||
                !categoria
            ) {
                return res.status(400).json({
                    success: false,
                    error: 'Datos del curso invalidos'
                });
            }

            try {

                const datos = await moodle(
                    req,
                    'core_course_create_courses',
                    {
                        'courses[0][fullname]': nombre,
                        'courses[0][shortname]': clave,
                        'courses[0][categoryid]': categoria,
                        'courses[0][visible]': 0
                    }
                );

                if (!Array.isArray(datos) || !datos[0]?.id) {
                    throw new Error('Creacion no confirmada');
                }

                res.status(201).json({
                    success: true,
                    curso: datos[0]
                });

            } catch (error) {
                console.error(
                    '[IINICIA Gestion]',
                    error.message
                );
                res.status(422).json({
                    success: false,
                    error: 'No se pudo crear el curso en Moodle'
                });
            }
        }
    );

    app.patch(
        '/api/auth/admin/cursos/:id',
        validarOrigen,
        exigirRoles(...academicos),

        async (req, res) => {

            const id = entero(req.params.id);
            const nombre = String(
                req.body.nombre || ''
            ).trim();

            if (!id || id === 1 || !nombre || nombre.length > 254) {
                return res.status(400).json({
                    success: false,
                    error: 'Datos invalidos'
                });
            }

            try {

                const curso = await buscarCurso(req, id);

                if (!curso || !tieneAcceso(req, curso.categoryid)) {
                    return res.status(403).json({
                        success: false,
                        error: 'Curso fuera de tu ambito'
                    });
                }

                const resultado = await moodle(
                    req,
                    'core_course_update_courses',
                    {
                        'courses[0][id]': id,
                        'courses[0][fullname]': nombre
                    }
                );

                if (resultado?.warnings?.length) {
                    throw new Error('Actualizacion con advertencias');
                }

                const actualizado = await buscarCurso(req, id);

                if (actualizado?.fullname !== nombre) {
                    throw new Error('Actualizacion no confirmada');
                }

                res.json({
                    success: true,
                    curso: {
                        id,
                        nombre: actualizado.fullname
                    }
                });

            } catch (error) {
                console.error(
                    '[IINICIA Gestion]',
                    error.message
                );
                res.status(422).json({
                    success: false,
                    error: 'No se pudo actualizar el curso'
                });
            }
        }
    );

    app.get(
        '/api/auth/admin/cursos/:id/participantes',
        exigirRoles(...academicos),

        async (req, res) => {

            const id = entero(req.params.id);

            if (!id || id === 1) {
                return res.status(400).json({
                    success: false,
                    error: 'Curso invalido'
                });
            }

            try {

                const curso = await buscarCurso(req, id);

                if (!curso || !tieneAcceso(req, curso.categoryid)) {
                    return res.status(403).json({
                        success: false,
                        error: 'Curso fuera de tu ambito'
                    });
                }

                const datos = await moodle(
                    req,
                    'core_enrol_get_enrolled_users',
                    { courseid: id }
                );

                const participantes = datos.map(u => ({
                    id: u.id,
                    nombre: u.fullname,
                    roles: (u.roles || []).map(r => r.shortname)
                }));

                res.json({
                    success: true,
                    participantes
                });

            } catch (error) {
                console.error(
                    '[IINICIA Gestion]',
                    error.message
                );
                res.status(503).json({
                    success: false,
                    error: 'No se pudieron consultar los participantes'
                });
            }
        }
    );

    app.post(
        '/api/auth/admin/cursos/:id/matriculas',
        validarOrigen,
        exigirRoles('superadmin', 'admin_academico'),

        async (req, res) => {

            const cursoId = entero(req.params.id);
            const usuarioId = entero(req.body.usuarioId);

            if (!cursoId || cursoId === 1 || !usuarioId) {
                return res.status(400).json({
                    success: false,
                    error: 'Identificadores invalidos'
                });
            }

            try {

                const curso = await buscarCurso(req, cursoId);

                if (!curso || !tieneAcceso(req, curso.categoryid)) {
                    return res.status(403).json({
                        success: false,
                        error: 'Curso no autorizado'
                    });
                }

                async function verificar() {
                    const v = await moodle(
                        req,
                        'local_iinicia_enrolment_status',
                        {
                            courseid: cursoId,
                            userid: usuarioId
                        }
                    );

                    if (
                        Number(v.courseid) !== cursoId ||
                        Number(v.userid) !== usuarioId
                    ) {
                        throw new Error('Verificacion incompatible');
                    }

                    return v.enrolled === true &&
                        v.student === true;
                }

                let matriculado = await verificar();

                if (!matriculado) {
                    await moodle(
                        req,
                        'enrol_manual_enrol_users',
                        {
                            'enrolments[0][roleid]': 5,
                            'enrolments[0][userid]': usuarioId,
                            'enrolments[0][courseid]': cursoId
                        }
                    );

                    matriculado = await verificar();
                }

                if (!matriculado) {
                    throw new Error('Matricula no confirmada');
                }

                let activacion;

                try {
                    activacion = await activarEstudiante(usuarioId);
                } catch (error) {
                    console.error(
                        '[IINICIA Activacion]',
                        error.message
                    );

                    return res.status(409).json({
                        success: false,
                        matriculado: true,
                        activado: false,
                        error: 'Matricula confirmada en Moodle. Activacion institucional pendiente; puedes reintentar.'
                    });
                }

                return res.json({
                    success: true,
                    cursoId,
                    usuarioId,
                    matriculado: true,
                    ...activacion
                });

            } catch (error) {
                console.error(
                    '[IINICIA Gestion]',
                    error.message
                );
                return res.status(422).json({
                    success: false,
                    error: 'No se pudo confirmar la matricula'
                });
            }
        }
    );


    app.get(
        '/api/auth/admin/cohortes',
        exigirRoles('superadmin', 'admin_academico'),
        async (req, res) => {
            try {
                const datos = await moodle(
                    req,
                    'core_cohort_get_cohorts'
                );

                if (!Array.isArray(datos)) {
                    throw new Error('Respuesta invalida');
                }

                res.json({
                    success: true,
                    cohortes: datos.map(c => ({
                        id: c.id,
                        nombre: c.name,
                        clave: c.idnumber
                    }))
                });

            } catch (error) {
                console.error(
                    '[IINICIA Gestion]',
                    error.message
                );
                res.status(503).json({
                    success: false,
                    error: 'No se pudieron consultar las cohortes'
                });
            }
        }
    );

    app.post(
        '/api/auth/admin/cohortes',
        validarOrigen,
        exigirRoles('superadmin', 'admin_academico'),
        async (req, res) => {

            const nombre = String(
                req.body.nombre || ''
            ).trim();

            const clave = String(
                req.body.clave || ''
            ).trim();

            if (
                !nombre || nombre.length > 254 ||
                !clave || clave.length > 100
            ) {
                return res.status(400).json({
                    success: false,
                    error: 'Datos invalidos'
                });
            }

            try {
                const datos = await moodle(
                    req,
                    'core_cohort_create_cohorts',
                    {
                        'cohorts[0][categorytype][type]': 'system',
                        'cohorts[0][categorytype][value]': '',
                        'cohorts[0][name]': nombre,
                        'cohorts[0][idnumber]': clave,
                        'cohorts[0][description]': '',
                        'cohorts[0][descriptionformat]': 1
                    }
                );

                if (!Array.isArray(datos) || !datos[0]?.id) {
                    throw new Error('Creacion no confirmada');
                }

                res.status(201).json({
                    success: true,
                    cohorte: datos[0]
                });

            } catch (error) {
                console.error(
                    '[IINICIA Gestion]',
                    error.message
                );
                res.status(422).json({
                    success: false,
                    error: 'No se pudo crear la cohorte'
                });
            }
        }
    );

    app.get(
        '/api/auth/admin/cohortes/:id/integrantes',
        exigirRoles('superadmin', 'admin_academico'),
        async (req, res) => {

            const id = entero(req.params.id);

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: 'Cohorte invalida'
                });
            }

            try {
                const datos = await moodle(
                    req,
                    'core_cohort_get_cohort_members',
                    {
                        'cohortids[0]': id
                    }
                );

                const cohorte = datos.find(
                    c => Number(c.cohortid) === id
                );

                if (!cohorte) {
                    throw new Error('Cohorte no disponible');
                }

                res.json({
                    success: true,
                    integrantes: cohorte.userids || []
                });

            } catch (error) {
                console.error(
                    '[IINICIA Gestion]',
                    error.message
                );
                res.status(422).json({
                    success: false,
                    error: 'No se pudieron consultar los integrantes'
                });
            }
        }
    );

    app.post(
        '/api/auth/admin/cohortes/:id/integrantes',
        validarOrigen,
        exigirRoles('superadmin', 'admin_academico'),
        async (req, res) => {

            const id = entero(req.params.id);
            const usuarioId = entero(req.body.usuarioId);

            if (!id || !usuarioId) {
                return res.status(400).json({
                    success: false,
                    error: 'Identificadores invalidos'
                });
            }

            try {

                const resultado = await moodle(
                    req,
                    'core_cohort_add_cohort_members',
                    {
                        'members[0][cohorttype][type]': 'id',
                        'members[0][cohorttype][value]': id,
                        'members[0][usertype][type]': 'id',
                        'members[0][usertype][value]': usuarioId
                    }
                );

                if (resultado?.warnings?.length) {
                    throw new Error('Operacion con advertencias');
                }

                const datos = await moodle(
                    req,
                    'core_cohort_get_cohort_members',
                    {
                        'cohortids[0]': id
                    }
                );

                const cohorte = datos.find(
                    c => Number(c.cohortid) === id
                );

                if (!cohorte?.userids?.some(
                    u => Number(u) === usuarioId
                )) {
                    throw new Error('Integracion no confirmada');
                }

                res.json({
                    success: true,
                    integrantes: cohorte.userids
                });

            } catch (error) {
                console.error(
                    '[IINICIA Gestion]',
                    error.message
                );
                res.status(422).json({
                    success: false,
                    error: 'No se pudo confirmar el integrante'
                });
            }
        }
    );

}
