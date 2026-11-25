const equivalencias = {
    iinicia_tecnico: 'admin_tecnico',
    iinicia_academico: 'admin_academico',
    iinicia_coordinador: 'coordinador',
    editingteacher: 'profesor',
    teacher: 'profesor',
    student: 'estudiante',
    iinicia_aspirante: 'aspirante',
    iinicia_soporte: 'soporte'
};

const prioridad = [
    'superadmin',
    'admin_tecnico',
    'admin_academico',
    'coordinador',
    'profesor',
    'estudiante',
    'aspirante',
    'soporte'
];

export function resolverRoles(datos) {
    if (
        !datos ||
        datos.exception ||
        !Number.isSafeInteger(datos.userid) ||
        !Array.isArray(datos.roles) ||
        typeof datos.siteadmin !== 'boolean'
    ) {
        throw new Error('Identidad Moodle no verificable');
    }

    const ambitos = datos.roles.flatMap(asignacion => {
        const rol = equivalencias[asignacion.shortname];

        if (!rol) return [];

        const nivel = Number(asignacion.contextlevel);
        const instancia = Number(asignacion.instanceid);

        const valido =
            rol === 'coordinador'
                ? nivel === 40 && instancia > 0
                : ['profesor', 'estudiante'].includes(rol)
                    ? nivel === 50 && instancia > 0
                    : nivel === 10 && instancia === 0;

        if (!valido) return [];

        return [{
            rol,
            contexto: nivel,
            instancia
        }];
    });

    const roles = prioridad.filter(rol =>
        ambitos.some(a => a.rol === rol)
    );

    if (datos.siteadmin === true) {
        roles.unshift('superadmin');

        ambitos.unshift({
            rol: 'superadmin',
            contexto: 10,
            instancia: 0
        });
    }

    return {
        rol: roles[0] || null,
        roles,
        ambitos
    };
}

export async function consultarRoles(token, userid) {
    const respuesta = await fetch(
        new URL(
            '/webservice/rest/server.php',
            process.env.MOODLE_URL
        ),
        {
            method: 'POST',
            body: new URLSearchParams({
                wstoken: token,
                wsfunction: 'local_iinicia_user_roles',
                moodlewsrestformat: 'json'
            }),
            redirect: 'error',
            signal: AbortSignal.timeout(10000)
        }
    );

    if (!respuesta.ok) {
        throw new Error('No se pudieron consultar los roles');
    }

    const datos = await respuesta.json();

    if (Number(datos.userid) !== Number(userid)) {
        throw new Error('Identidad Moodle inconsistente');
    }

    return resolverRoles(datos);
}

export function exigirRoles(...permitidos) {
    return async (req, res, next) => {
        res.set('Cache-Control', 'no-store');

        if (!req.session?.usuario || !req.session?.moodleToken) {
            return res.status(401).json({
                success: false,
                error: 'Sesion requerida'
            });
        }

        try {
            const identidad = await consultarRoles(
                req.session.moodleToken,
                req.session.usuario.id
            );

            if (!identidad.roles.some(r => permitidos.includes(r))) {
                return res.status(403).json({
                    success: false,
                    error: 'Permisos insuficientes'
                });
            }

            Object.assign(req.session.usuario, identidad);

            next();

        } catch (_) {
            return res.status(503).json({
                success: false,
                error: 'No fue posible verificar los permisos'
            });
        }
    };
}
