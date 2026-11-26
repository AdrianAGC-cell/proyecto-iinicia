import { createClient } from '@supabase/supabase-js';

export async function activarEstudiante(usuarioId, cursoId, soloValidar = false) {

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

    const { data: mapeo, error: errorMapeo } = await db
        .from('moodle_user_mappings')
        .select('iinicia_user_id,moodle_user_id')
        .eq('moodle_user_id', usuarioId)
        .eq('iinicia_protected', true)
        .eq('sync_status', 'SYNCED')
        .maybeSingle();

    if (errorMapeo) {
        throw new Error('No se pudo consultar el mapeo');
    }

    if (!mapeo) {
        return { activado: false, motivo: 'Sin perfil protegido' };
    }

    const { data: perfil, error: errorPerfil } = await db
        .from('users')
        .select('id,role_id,status,iinicia_auth_owner,program_id')
        .eq('id', mapeo.iinicia_user_id)
        .not('iinicia_auth_owner', 'is', null)
        .maybeSingle();

    if (errorPerfil || !perfil) {
        throw new Error('Perfil institucional no verificable');
    }

    const { data: curso, error: errorCurso } = await db
        .from('iinicia_program_courses')
        .select('program_id,moodle_course_id')
        .eq('program_id', perfil.program_id)
        .eq('moodle_course_id', cursoId)
        .eq('is_active', true)
        .maybeSingle();

    if (errorCurso || !curso) {
        throw new Error(
            'El curso no pertenece al programa academico autorizado'
        );
    }

    const { data: solicitudes, error: errorSolicitud } = await db
        .from('admission_applications')
        .select('id')
        .eq('user_id', perfil.id)
        .eq('iinicia_auth_owner', perfil.iinicia_auth_owner)
        .eq('program_id', perfil.program_id)
        .eq('moodle_user_id', usuarioId)
        .eq('status', 'ADMITIDO')
        .eq('moodle_synced', true)
        .eq('iinicia_sync_state', 'SYNCED');

    if (errorSolicitud || !solicitudes?.length) {
        throw new Error('Admision institucional no verificable');
    }

    if (
        perfil.role_id === 'estudiante' &&
        perfil.status === 'activo'
    ) {
        return { activado: true, previamenteActivo: true };
    }

    if (
        perfil.role_id !== 'aspirante' ||
        perfil.status !== 'pendiente'
    ) {
        throw new Error('Perfil no autorizado para activacion');
    }

    if (soloValidar) {
        return {
            activado: false,
            autorizado: true
        };
    }

    const { data: actualizado, error: errorActualizacion } = await db
        .from('users')
        .update({
            role_id: 'estudiante',
            status: 'activo',
            updated_at: new Date().toISOString()
        })
        .eq('id', perfil.id)
        .eq('iinicia_auth_owner', perfil.iinicia_auth_owner)
        .eq('role_id', 'aspirante')
        .eq('status', 'pendiente')
        .select('id')
        .maybeSingle();

    if (errorActualizacion || !actualizado) {
        throw new Error('No se pudo activar el perfil institucional');
    }

    return { activado: true, previamenteActivo: false };
}
