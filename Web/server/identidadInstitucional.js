import { createClient } from '@supabase/supabase-js';
import { consultarRoles } from './moodleRoles.js';

export async function resolverIdentidadInstitucional(accessToken) {

    const db = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false
            }
        }
    );

    const { data, error } = await db.auth.getUser(accessToken);

    const identidad = data?.user;

    if (
        error ||
        !identidad?.id ||
        !identidad.email ||
        !identidad.email_confirmed_at
    ) {
        throw new Error('Identidad no verificada');
    }

    const owner = identidad.id;

    const { data: perfil, error: errorPerfil } = await db
        .from('users')
        .select('id,email,role_id,status,program_id,matricula')
        .eq('iinicia_auth_owner', owner)
        .maybeSingle();

    if (errorPerfil) {
        throw new Error('No se pudo consultar el perfil');
    }

    if (!perfil || (
        perfil.role_id === 'aspirante' &&
        perfil.status === 'pendiente'
    )) {
        return {
            institucional: false,
            rol: 'aspirante'
        };
    }

    if (
        perfil.role_id !== 'estudiante' ||
        perfil.status !== 'activo' ||
        perfil.email?.toLowerCase() !==
            identidad.email.toLowerCase()
    ) {
        throw new Error('Perfil institucional no autorizado');
    }

    const { data: mapeo, error: errorMapeo } = await db
        .from('moodle_user_mappings')
        .select('moodle_user_id,moodle_username')
        .eq('iinicia_user_id', perfil.id)
        .eq('iinicia_protected', true)
        .eq('sync_status', 'SYNCED')
        .maybeSingle();

    if (errorMapeo || !mapeo) {
        throw new Error('Vinculacion Moodle no verificada');
    }

    const identificador = owner.replaceAll('-', '');

    const username = 'iinicia_' + identificador;

    const matricula =
        'IIN-' + identificador.slice(0, 16).toUpperCase();

    const moodleId = Number(mapeo.moodle_user_id);

    if (
        !Number.isSafeInteger(moodleId) ||
        moodleId <= 0 ||
        mapeo.moodle_username !== username ||
        perfil.matricula !== matricula
    ) {
        throw new Error('Vinculacion institucional inconsistente');
    }

    const { data: solicitudes, error: errorSolicitud } = await db
        .from('admission_applications')
        .select('id')
        .eq('iinicia_auth_owner', owner)
        .eq('user_id', perfil.id)
        .eq('program_id', perfil.program_id)
        .eq('moodle_user_id', moodleId)
        .eq('status', 'ADMITIDO')
        .eq('moodle_synced', true)
        .eq('iinicia_sync_state', 'SYNCED');

    if (errorSolicitud || !solicitudes?.length) {
        throw new Error('Admision institucional no verificada');
    }

    const bridgeToken = process.env.MOODLE_BRIDGE_TOKEN;

    if (!bridgeToken) {
        throw new Error('Puente institucional no configurado');
    }

    async function moodle(funcion, token, parametros = {}) {

        const respuesta = await fetch(
            new URL(
                '/webservice/rest/server.php',
                process.env.MOODLE_URL
            ),
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
            throw new Error('Moodle no disponible');
        }

        const datos = await respuesta.json();

        if (datos?.exception || datos?.errorcode) {
            throw new Error('Moodle rechazo la identidad');
        }

        return datos;
    }

    const intercambio = await moodle(
        'local_iinicia_exchange_identity',
        bridgeToken,
        {
            userid: String(moodleId),
            owner
        }
    );

    if (
        intercambio.success !== true ||
        Number(intercambio.userid) !== moodleId ||
        typeof intercambio.token !== 'string' ||
        !intercambio.token ||
        Number(intercambio.expires) <= Date.now() / 1000
    ) {
        throw new Error('Intercambio institucional invalido');
    }

    const roles = await consultarRoles(
        intercambio.token,
        moodleId
    );

    if (
        roles.rol !== 'estudiante' ||
        roles.roles.length !== 1 ||
        roles.roles[0] !== 'estudiante'
    ) {
        throw new Error('Rol institucional incompatible');
    }

    const info = await moodle(
        'core_webservice_get_site_info',
        intercambio.token
    );

    if (
        Number(info.userid) !== moodleId ||
        info.username !== username
    ) {
        throw new Error('Identidad Moodle inconsistente');
    }

    return {
        institucional: true,
        owner,
        token: intercambio.token,
        expires: Number(intercambio.expires),
        usuario: {
            ...roles,
            id: moodleId,
            username,
            nombre: info.fullname,
            imagen: info.userpictureurl,
            email: identidad.email,
            matricula
        }
    };
}
