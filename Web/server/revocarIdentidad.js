export async function revocarIdentidad(token) {
    if (!token) return;

    const url = new URL(
        '/webservice/rest/server.php',
        process.env.MOODLE_URL
    );

    const body = new URLSearchParams({
        wstoken: process.env.MOODLE_BRIDGE_TOKEN,
        wsfunction: 'local_iinicia_revoke_identity',
        moodlewsrestformat: 'json',
        token
    });

    const respuesta = await fetch(url, {
        method: 'POST',
        body,
        signal: AbortSignal.timeout(10000)
    });

    const datos = await respuesta.json();

    if (
        !respuesta.ok ||
        datos.exception ||
        datos.success !== true
    ) {
        throw new Error(
            'No se pudo revocar la sesion institucional'
        );
    }
}
