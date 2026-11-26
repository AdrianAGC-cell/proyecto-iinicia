import { exigirRoles } from './moodleRoles.js';

async function consultarMoodle(token, funcion, parametros = {}) {

    const respuesta = await fetch(
        new URL(
            '/webservice/rest/server.php',
            process.env.MOODLE_URL
        ),
        {
            method: 'POST',
            body: new URLSearchParams({
                ...parametros,
                wstoken: token,
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

    if (datos.exception || datos.errorcode) {
        throw new Error('Operacion Moodle no disponible');
    }

    return datos;
}

export function configurarAdministracionMoodle(app) {

    app.get(
        '/api/auth/admin/resumen',

        exigirRoles(
            'superadmin',
            'admin_tecnico',
            'admin_academico',
            'coordinador',
            'soporte'
        ),

        async (req, res) => {

            const usuario = req.session.usuario;
            const inicio = Date.now();

            try {

                const sitio = await consultarMoodle(
                    req.session.moodleToken,
                    'core_webservice_get_site_info'
                );

                return res.json({
                    success: true,
                    usuario,
                    moodle: {
                        conectado: true,
                        sitio: sitio.sitename,
                        version: sitio.release || sitio.version || null,
                        latencia: Date.now() - inicio
                    }
                });

            } catch (_) {

                return res.status(503).json({
                    success: false,
                    error: 'No se pudo consultar Moodle'
                });
            }
        }
    );


}
