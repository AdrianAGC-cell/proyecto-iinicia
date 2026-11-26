import { createClient } from '@supabase/supabase-js';
import { exigirRoles } from './moodleRoles.js';

export function configurarSoporte(app) {

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

    const tabla = 'iinicia_support_tickets';
    const ruta = '/api/auth/soporte';

    const usuario = exigirRoles(
        'superadmin',
        'admin_tecnico',
        'admin_academico',
        'coordinador',
        'profesor',
        'estudiante',
        'aspirante',
        'soporte'
    );

    const personal = exigirRoles(
        'superadmin',
        'soporte'
    );

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

    function fallo(res) {
        return res.status(503).json({
            success: false,
            error: 'Servicio de incidencias no disponible'
        });
    }

    app.get(ruta + '/mis-tickets', usuario, async (req, res) => {
        try {
            const { data, error } = await db
                .from(tabla)
                .select('*')
                .eq('requester_source', 'moodle')
                .eq('requester_id', String(req.session.usuario.id))
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) return fallo(res);

            res.json({ success: true, tickets: data });
        } catch {
            fallo(res);
        }
    });

    app.post(ruta + '/mis-tickets', origen, usuario, async (req, res) => {
        const { asunto, descripcion, categoria } = req.body || {};

        if (
            typeof asunto !== 'string' ||
            asunto.trim().length < 5 ||
            asunto.length > 200 ||
            typeof descripcion !== 'string' ||
            descripcion.trim().length < 10 ||
            descripcion.length > 5000 ||
            !['ACCESO', 'MOODLE', 'PLATAFORMA', 'OTRO'].includes(categoria)
        ) {
            return res.status(400).json({
                success: false,
                error: 'Datos de incidencia invalidos'
            });
        }

        try {
            const { data, error } = await db
                .from(tabla)
                .insert({
                    requester_id: String(req.session.usuario.id),
                    requester_source: 'moodle',
                    subject: asunto.trim(),
                    description: descripcion.trim(),
                    category: categoria,
                    priority: 'MEDIA',
                    status: 'ABIERTO'
                })
                .select()
                .single();

            if (error) return fallo(res);

            res.status(201).json({
                success: true,
                ticket: data
            });
        } catch {
            fallo(res);
        }
    });

    app.get(ruta + '/tickets', personal, async (req, res) => {
        try {
            const { data, error } = await db
                .from(tabla)
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) return fallo(res);

            res.json({ success: true, tickets: data });
        } catch {
            fallo(res);
        }
    });

    app.patch(ruta + '/tickets/:id', origen, personal, async (req, res) => {
        const { estado, prioridad, resolucion } = req.body || {};

        const transiciones = {
            'EN PROCESO': ['ABIERTO'],
            'RESUELTO': ['EN PROCESO'],
            'CERRADO': ['RESUELTO']
        };

        if (
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id) ||
            !Object.hasOwn(transiciones, estado || '') ||
            !['BAJA', 'MEDIA', 'ALTA'].includes(prioridad) ||
            typeof resolucion !== 'string' ||
            resolucion.length > 5000 ||
            (estado === 'RESUELTO' && resolucion.trim().length < 5)
        ) {
            return res.status(400).json({
                success: false,
                error: 'Actualizacion invalida'
            });
        }

        const cambios = {
            status: estado,
            priority: prioridad,
            assigned_moodle_id: Number(req.session.usuario.id),
            updated_at: new Date().toISOString()
        };

        if (estado === 'RESUELTO') {
            cambios.resolution = resolucion.trim();
            cambios.resolved_at = new Date().toISOString();
        }

        try {
            const { data, error } = await db
                .from(tabla)
                .update(cambios)
                .eq('id', req.params.id)
                .in('status', transiciones[estado])
                .select()
                .maybeSingle();

            if (error) return fallo(res);

            if (!data) {
                return res.status(409).json({
                    success: false,
                    error: 'Ticket inexistente o cambio de estado no permitido'
                });
            }

            res.json({ success: true, ticket: data });
        } catch {
            fallo(res);
        }
    });
}
