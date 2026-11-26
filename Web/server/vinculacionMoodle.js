import { randomBytes } from 'node:crypto';


const vinculacionesActivas = new Set();

export async function vincularAspirante(db, folio, token) {

    if (vinculacionesActivas.has(folio)) {
        throw new Error('Vinculacion en proceso');
    }

    vinculacionesActivas.add(folio);

    try {
        return await ejecutarVinculacion(db, folio, token);
    } finally {
        vinculacionesActivas.delete(folio);
    }
}

async function ejecutarVinculacion(db, folio, token) {


    const { data: solicitud, error } = await db
        .from('admission_applications')
        .select('*')
        .eq('id', folio)
        .eq('status', 'ADMITIDO')
        .not('iinicia_auth_owner', 'is', null)
        .maybeSingle();

    if (error || !solicitud) {
        throw new Error('Solicitud admitida no disponible');
    }

    if (solicitud.moodle_synced) {
        throw new Error('La solicitud ya esta vinculada');
    }

    const owner = solicitud.iinicia_auth_owner;

    const { data: identidad, error: errorIdentidad } =
        await db.auth.admin.getUserById(owner);

    if (
        errorIdentidad ||
        !identidad?.user?.email_confirmed_at ||
        identidad.user.email?.toLowerCase() !==
            solicitud.email.toLowerCase()
    ) {
        throw new Error('Identidad no verificable');
    }

    const identificador = owner.replaceAll('-', '');
    const username = 'iinicia_' + identificador;
    const matricula = 'IIN-' + identificador.toUpperCase();

    const { data: perfil, error: errorPerfil } = await db
        .from('users')
        .select('id,email,role_id,status,program_id')
        .eq('iinicia_auth_owner', owner)
        .maybeSingle();

    if (errorPerfil) {
        throw new Error('No se pudo verificar el perfil');
    }

    if (perfil && (
        perfil.role_id !== 'estudiante' ||
        perfil.status !== 'activo' ||
        perfil.program_id !== solicitud.program_id ||
        perfil.email.toLowerCase() !== solicitud.email.toLowerCase()
    )) {
        throw new Error('Perfil institucional incompatible');
    }

    if (perfil) {
        throw new Error(
            'Existe un perfil previo: requiere reconciliacion administrativa'
        );
    }

    const { data: coincidencias, error: errorCorreo } = await db
        .from('users')
        .select('id')
        .ilike('email', solicitud.email.replace(
            /[\\%_]/g, c => '\\' + c
        ));

    if (errorCorreo || coincidencias?.length) {
        throw new Error('El correo requiere revision administrativa');
    }

    async function moodle(funcion, parametros) {

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
                signal: AbortSignal.timeout(20000)
            }
        );

        if (!respuesta.ok) {
            throw new Error('Moodle no disponible');
        }

        const datos = await respuesta.json();

        if (datos?.exception || datos?.errorcode) {
            console.error(
                'Vinculacion Moodle:',
                datos.errorcode || 'error'
            );
            throw new Error('Moodle rechazo la operacion');
        }

        return datos;
    }

    const existentes = await moodle(
        'core_user_get_users_by_field',
        {
            field: 'username',
            'values[0]': username
        }
    );

    if (!Array.isArray(existentes) || existentes.length) {
        throw new Error(
            'Cuenta Moodle previa: requiere reconciliacion'
        );
    }

    const correos = await moodle(
        'core_user_get_users_by_field',
        {
            field: 'email',
            'values[0]': solicitud.email
        }
    );

    if (!Array.isArray(correos) || correos.length) {
        throw new Error('Correo existente en Moodle');
    }

    const nombres = solicitud.full_name.trim().split(/\s+/);
    const firstname = nombres.shift();
    const lastname = nombres.join(' ') || firstname;

    const creados = await moodle(
        'core_user_create_users',
        {
            'users[0][username]': username,
            'users[0][firstname]': firstname,
            'users[0][lastname]': lastname,
            'users[0][email]': solicitud.email,
            'users[0][auth]': 'manual',
            'users[0][password]':
                'Ii9!' + randomBytes(32).toString('hex'),
            'users[0][idnumber]': matricula
        }
    );

    const moodleId = Number(creados?.[0]?.id);

    if (!Number.isSafeInteger(moodleId) || moodleId <= 0) {
        throw new Error('Creacion Moodle no confirmada');
    }

    const { data: nuevo, error: errorNuevo } = await db
        .from('users')
        .insert({
            iinicia_auth_owner: owner,
            email: solicitud.email,
            full_name: solicitud.full_name,
            phone: solicitud.phone,
            role_id: 'estudiante',
            status: 'pendiente',
            matricula,
            program_id: solicitud.program_id,
            program_name: solicitud.program_name
        })
        .select('id')
        .single();

    if (errorNuevo || !nuevo) {
        console.error('Reconciliacion requerida:', folio, moodleId);
        throw new Error('Perfil pendiente de reconciliacion');
    }

    const { error: errorMapeo } = await db
        .from('moodle_user_mappings')
        .insert({
            iinicia_user_id: nuevo.id,
            moodle_user_id: moodleId,
            moodle_username: username,
            sync_status: 'SYNCED',
            iinicia_protected: true
        });

    if (errorMapeo) {
        throw new Error('Mapeo pendiente de reconciliacion');
    }

    const { data: finalizada, error: errorFinal } = await db
        .from('admission_applications')
        .update({
            user_id: nuevo.id,
            moodle_user_id: moodleId,
            moodle_synced: true,
            moodle_sync_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq('id', folio)
        .eq('status', 'ADMITIDO')
        .eq('moodle_synced', false)
        .select('id')
        .single();

    if (errorFinal || !finalizada) {
        throw new Error('Solicitud pendiente de reconciliacion');
    }

    return {
        matricula,
        moodleId,
        username
    };
}
