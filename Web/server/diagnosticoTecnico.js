import { createClient } from '@supabase/supabase-js';
import { exigirRoles } from './moodleRoles.js';

export function configurarDiagnosticoTecnico(app) {

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

    app.get(
        '/api/auth/admin/diagnostico',
        exigirRoles('superadmin', 'admin_tecnico'),
        async (req, res) => {

            const inicio = Date.now();

            let conectado = false;

            try {
                const { error } = await db
                    .from('programs')
                    .select('id', { head: true })
                    .limit(1)
                    .abortSignal(AbortSignal.timeout(10000));

                conectado = !error;

            } catch {
                conectado = false;
            }

            return res.json({
                success: true,
                backend: {
                    conectado: true,
                    uptime: Math.floor(process.uptime()),
                    versionNode: process.version
                },
                supabase: {
                    conectado,
                    latencia: Date.now() - inicio
                },
                fecha: new Date().toISOString()
            });
        }
    );
}
