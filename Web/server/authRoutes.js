import { SQLiteSessionStore } from './sessionStore.js';
import { revocarIdentidad } from './revocarIdentidad.js';
import { consultarRoles } from './moodleRoles.js';
import express from 'express';
import session from 'express-session';
import { rateLimit } from 'express-rate-limit';
import { autenticarMoodle } from './moodleAuth.js';
import { resolverIdentidadInstitucional } from './identidadInstitucional.js';


export function configurarAutenticacion(app) {

    if (!process.env.SESSION_SECRET) {
        throw new Error('SESSION_SECRET no configurado');
    }

    // Las conexiones publicas deben utilizar HTTPS.
    app.use(session({
        store: new SQLiteSessionStore(),
        name: 'iinicia.sid',
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: 'auto',
            sameSite: 'lax',
            maxAge: 8 * 60 * 60 * 1000
        }
    }));



    app.use('/api/auth', (req, res, next) => {

        // Permitir renovar o cerrar una sesion vencida.
        if (
            req.method === 'POST' &&
            ['/institucional', '/login', '/logout'].includes(req.path)
        ) {
            return next();
        }

        const expira = req.session?.institucionalExpires;

        if (expira && expira <= Date.now() / 1000) {

            req.session.destroy(error => {

                if (error) {
                    return res.status(500).json({
                        success: false,
                        error: 'No se pudo cerrar la sesion vencida'
                    });
                }

                res.clearCookie('iinicia.sid', {
                    path: '/',
                    httpOnly: true,
                    sameSite: 'lax',
                    secure: req.secure
                });

                return res.status(401).json({
                    success: false,
                    error: 'Sesion institucional vencida'
                });
            });

            return;
        }

        next();
    });

    const router = express.Router();

    const limiteLogin = rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 10,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        message: {
            success: false,
            error: 'Demasiados intentos. Intenta mas tarde.'
        }
    });

    // Inicio de sesion real.
    router.post('/login', limiteLogin, async (req, res) => {

        res.set('Cache-Control', 'no-store');

        try {
            const {
                identificador,
                password,
                tipo
            } = req.body || {};

            if (
                typeof identificador !== 'string' ||
                typeof password !== 'string' ||
                !identificador.trim() ||
                !password ||
                identificador.length > 254 ||
                password.length > 1024 ||
                !['usuario', 'correo', 'matricula'].includes(tipo)
            ) {
                return res.status(400).json({
                    success: false,
                    error: 'Datos de inicio de sesion invalidos'
                });
            }

            const resultado = await autenticarMoodle(
                identificador,
                password,
                tipo
            );

            if (!resultado) {
                return res.status(401).json({
                    success: false,
                    error: 'Credenciales incorrectas'
                });
            }

            // Generar una nueva sesion al autenticar.
            if (req.session.institucionalOwner) {
                await revocarIdentidad(
                    req.session.moodleToken
                );
            }

            await new Promise((resolve, reject) => {
                req.session.regenerate(error => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            req.session.usuario = resultado.usuario;
            req.session.moodleToken = resultado.token;

            await new Promise((resolve, reject) => {
                req.session.save(error => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            return res.json({
                success: true,
                mensaje: 'Inicio de sesion exitoso',
                usuario: resultado.usuario
            });

        } catch (error) {
            console.error('Error interno de autenticacion');

            return res.status(500).json({
                success: false,
                error: 'No fue posible iniciar sesion'
            });
        }
    });


    // Intercambio de identidad Supabase por sesion institucional.
    const limiteInstitucional = rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 30,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        message: {
            success: false,
            error: 'Demasiadas solicitudes de autenticacion'
        }
    });

    router.post('/institucional', limiteInstitucional, async (req, res) => {

        res.set('Cache-Control', 'no-store');

        const authorization = req.get('Authorization') || '';

        const coincidencia = authorization.match(
            /^Bearer ([^ ]+)$/i
        );

        if (!coincidencia || coincidencia[1].length > 8192) {
            return res.status(401).json({
                success: false,
                error: 'Identidad requerida'
            });
        }

        try {
            const resultado =
                await resolverIdentidadInstitucional(
                    coincidencia[1]
                );

            if (req.session.institucionalOwner) {
                await revocarIdentidad(
                    req.session.moodleToken
                );
            }

            await new Promise((resolve, reject) => {
                req.session.regenerate(error => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            if (!resultado.institucional) {
                return res.json({
                    success: true,
                    institucional: false,
                    rol: 'aspirante'
                });
            }

            req.session.usuario = resultado.usuario;
            req.session.moodleToken = resultado.token;
            req.session.institucionalOwner = resultado.owner;
            req.session.institucionalExpires = resultado.expires;

            req.session.cookie.maxAge = Math.min(
                3600000,
                resultado.expires * 1000 - Date.now()
            );

            await new Promise((resolve, reject) => {
                req.session.save(error => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            return res.json({
                success: true,
                institucional: true,
                usuario: resultado.usuario,
                expires: resultado.expires
            });

        } catch (_) {

            console.error(
                'Intercambio institucional no completado'
            );

            return res.status(403).json({
                success: false,
                error: 'No fue posible verificar el acceso institucional'
            });
        }
    });

    // Consultar el usuario autenticado.
    router.get('/me', async (req, res) => {

        res.set('Cache-Control', 'no-store');

        if (!req.session.usuario) {
            return res.status(401).json({
                success: false,
                error: 'No existe una sesion activa'
            });
        }

        try {
            const identidad = await consultarRoles(
                req.session.moodleToken,
                req.session.usuario.id
            );

            if (!identidad.rol) {
                return res.status(403).json({
                    success: false,
                    error: 'Usuario sin rol institucional'
                });
            }

            Object.assign(req.session.usuario, identidad);

            return res.json({
                success: true,
                usuario: req.session.usuario
            });
        } catch (_) {
            return res.status(503).json({
                success: false,
                error: 'No se pudo verificar la identidad'
            });
        }
    });

    // Cerrar sesion.
    router.post('/logout', async (req, res) => {

        try {
            if (req.session.institucionalOwner) {
                await revocarIdentidad(
                    req.session.moodleToken
                );
            }
        } catch (_) {
            return res.status(503).json({
                success: false,
                error: 'No se pudo revocar la sesion. Intenta nuevamente.'
            });
        }


        res.set('Cache-Control', 'no-store');

        req.session.destroy(error => {

            if (error) {
                return res.status(500).json({
                    success: false,
                    error: 'No fue posible cerrar sesion'
                });
            }

            res.clearCookie('iinicia.sid', {
                path: '/',
                httpOnly: true,
                sameSite: 'lax',
                secure: req.secure
            });

            return res.json({
                success: true,
                mensaje: 'Sesion cerrada correctamente'
            });
        });
    });

    app.use('/api/auth', router);
}
