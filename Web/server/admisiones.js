import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { exigirRoles } from './moodleRoles.js';

export function configurarAdmisiones(app) {
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

    const tabla = 'admission_applications';
    const base = '/api/auth/admisiones';
    const campos = 'id,full_name,email,phone,program_id,program_name,previous_school,average_grade,status,moodle_synced,created_at';

    const academico = exigirRoles(
        'superadmin',
        'admin_academico'
    );

    function fallo(res) {
        return res.status(503).json({
            success: false,
            error: 'Servicio de admisiones no disponible'
        });
    }

    function origen(req, res, next) {
        const permitidos = (
            process.env.WEB_ORIGINS ||
            'http://localhost:5173'
        ).split(',').map(s => s.trim());

        if (!permitidos.includes(req.get('origin'))) {
            return res.status(403).json({
                success: false,
                error: 'Origen no autorizado'
            });
        }

        if (!req.is('application/json')) {
            return res.status(415).json({
                success: false,
                error: 'Se requiere JSON'
            });
        }

        next();
    }

    async function aspirante(req, res, next) {
        try {
            const token = req.get('authorization') || '';

            if (!token.startsWith('Bearer ')) {
                return res.status(401).json({
                    success: false,
                    error: 'Inicia sesion con tu cuenta de aspirante'
                });
            }

            const { data, error } = await db.auth.getUser(
                token.slice(7)
            );

            if (error || !data.user ||
                !data.user.email ||
                !data.user.email_confirmed_at) {
                return res.status(401).json({
                    success: false,
                    error: 'Cuenta no verificada'
                });
            }

            req.aspirante = data.user;
            next();
        } catch {
            fallo(res);
        }
    }

    app.get(base + '/mis-solicitudes', aspirante,
        async (req, res) => {
            try {
                const { data, error } = await db
                    .from(tabla)
                    .select(campos)
                    .eq('iinicia_auth_owner', req.aspirante.id)
                    .order('created_at', { ascending: false });

                if (error) return fallo(res);

                res.json({
                    success: true,
                    solicitudes: data
                });
            } catch {
                fallo(res);
            }
        }
    );

    app.post(base + '/solicitudes', origen, aspirante,
        async (req, res) => {
            try {
                const {
                    fullName,
                    phone,
                    programId,
                    previousSchool,
                    averageGrade,
                    acceptedTerms
                } = req.body || {};

                const promedio = Number(averageGrade);

                if (
                    typeof fullName !== 'string' ||
                    fullName.trim().length < 3 ||
                    fullName.length > 150 ||
                    typeof programId !== 'string' ||
                    !programId ||
                    typeof previousSchool !== 'string' ||
                    !previousSchool.trim() ||
                    previousSchool.length > 150 ||
                    typeof phone !== 'string' ||
                    phone.length > 20 ||
                    averageGrade === '' ||
                    averageGrade == null ||
                    !Number.isFinite(promedio) ||
                    promedio < 0 ||
                    promedio > 10 ||
                    acceptedTerms !== true
                ) {
                    return res.status(400).json({
                        success: false,
                        error: 'Completa correctamente el formulario'
                    });
                }

                const { data: programa, error: errorPrograma } =
                    await db.from('programs')
                        .select('id')
                        .eq('id', programId)
                        .maybeSingle();

                if (errorPrograma) return fallo(res);

                if (!programa) {
                    return res.status(400).json({
                        success: false,
                        error: 'Programa academico inexistente'
                    });
                }

                const folio = 'SOL-' + randomUUID();

                const { data, error } = await db
                    .from(tabla)
                    .insert({
                        id: folio,
                        iinicia_auth_owner: req.aspirante.id,
                        full_name: fullName.trim(),
                        email: req.aspirante.email,
                        phone: phone.trim() || null,
                        program_id: programa.id,
                        previous_school: previousSchool.trim(),
                        average_grade: promedio,
                        status: 'PENDIENTE',
                        moodle_synced: false
                    })
                    .select(campos)
                    .single();

                if (error) {
                    if (error.code === '23505') {
                        return res.status(409).json({
                            success: false,
                            error: 'Ya existe una solicitud para este programa'
                        });
                    }
                    console.error('Error admisiones:', error.code);
                    return fallo(res);
                }

                res.status(201).json({
                    success: true,
                    solicitud: data
                });
            } catch {
                fallo(res);
            }
        }
    );

    app.get(base + '/admin/solicitudes', academico,
        async (req, res) => {
            try {
                const { data, error } = await db
                    .from(tabla)
                    .select(campos)
                    .not('iinicia_auth_owner', 'is', null)
                    .order('created_at', { ascending: false })
                    .limit(100);

                if (error) return fallo(res);

                res.json({
                    success: true,
                    solicitudes: data
                });
            } catch {
                fallo(res);
            }
        }
    );

    app.patch(base + '/admin/solicitudes/:id',
        origen, academico, async (req, res) => {
            try {
                const { estado } = req.body || {};

                const transiciones = {
                    'EN REVISION': ['PENDIENTE'],
                    'ADMITIDO': ['EN REVISION'],
                    'RECHAZADO': ['EN REVISION']
                };

                if (!Object.hasOwn(transiciones, estado || '')) {
                    return res.status(400).json({
                        success: false,
                        error: 'Estado invalido'
                    });
                }

                const { data, error } = await db
                    .from(tabla)
                    .update({ status: estado })
                    .eq('id', req.params.id)
                    .not('iinicia_auth_owner', 'is', null)
                    .in('status', transiciones[estado])
                    .select(campos)
                    .maybeSingle();

                if (error) return fallo(res);

                if (!data) {
                    return res.status(409).json({
                        success: false,
                        error: 'Cambio de estado no permitido'
                    });
                }

                res.json({
                    success: true,
                    solicitud: data
                });
            } catch {
                fallo(res);
            }
        }
    );
}
