export async function autenticarMoodle(identificador, password, tipo) {
    const moodleUrl = process.env.MOODLE_URL;
    const moodleToken = process.env.MOODLE_TOKEN;

    if (!moodleUrl || !moodleToken) {
        throw new Error('Configuracion de Moodle incompleta');
    }

    if (
        typeof identificador !== 'string' ||
        typeof password !== 'string' ||
        !identificador.trim() ||
        !password ||
        !['usuario', 'correo', 'matricula'].includes(tipo)
    ) {
        return null;
    }

    identificador = identificador.trim();

    let username = identificador;

    // Buscar al estudiante mediante su matricula.
    if (tipo === 'matricula') {
        const consulta = await fetch(
            new URL('/webservice/rest/server.php', moodleUrl),
            {
                method: 'POST',
                body: new URLSearchParams({
                    wstoken: moodleToken,
                    wsfunction: 'core_user_get_users_by_field',
                    moodlewsrestformat: 'json',
                    field: 'idnumber',
                    'values[0]': identificador
                }),
                signal: AbortSignal.timeout(10000)
            }
        );

        if (!consulta.ok) {
            throw new Error('Error consultando Moodle');
        }

        const usuarios = await consulta.json();

        if (!Array.isArray(usuarios)) {
            throw new Error('Respuesta inesperada de Moodle');
        }

        if (
            usuarios.length !== 1 ||
            !usuarios[0].username ||
            usuarios[0].idnumber !== identificador
        ) {
            return null;
        }

        username = usuarios[0].username;
    }

    // Validar las credenciales directamente en Moodle.
    const respuesta = await fetch(
        new URL('/login/token.php', moodleUrl),
        {
            method: 'POST',
            body: new URLSearchParams({
                username: username,
                password: password,
                service: 'moodle_mobile_app'
            }),
            signal: AbortSignal.timeout(10000)
        }
    );

    if (!respuesta.ok) {
        throw new Error('Error de comunicacion con Moodle');
    }

    const datos = await respuesta.json();

    if (typeof datos.token !== 'string' || !datos.token) {
        return null;
    }

    // Consultar la identidad real del usuario autenticado.
    const perfilRespuesta = await fetch(
        new URL('/webservice/rest/server.php', moodleUrl),
        {
            method: 'POST',
            body: new URLSearchParams({
                wstoken: datos.token,
                wsfunction: 'core_webservice_get_site_info',
                moodlewsrestformat: 'json'
            }),
            signal: AbortSignal.timeout(10000)
        }
    );

    if (!perfilRespuesta.ok) {
        throw new Error('Error consultando el perfil');
    }

    const perfil = await perfilRespuesta.json();

    if (perfil.exception || !perfil.userid) {
        throw new Error('No se pudo consultar el perfil');
    }

    return {
        usuario: {
            id: perfil.userid,
            username: perfil.username,
            nombre: perfil.fullname,
            imagen: perfil.userpictureurl
        },
        token: datos.token
    };
}
