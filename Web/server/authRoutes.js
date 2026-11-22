import express from 'express';
import session from 'express-session';
import { rateLimit } from 'express-rate-limit';
import { autenticarMoodle } from './moodleAuth.js';

export function configurarAutenticacion(app) {

    if (!process.env.SESSION_SECRET) {
        throw new Error('SESSION_SECRET no configurado');
    }

    app.use(session({
        name: 'iinicia.sid',
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 8 * 60 * 60 * 1000
        }
    }));

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

    // Consultar el usuario autenticado.
    router.get('/me', (req, res) => {

        res.set('Cache-Control', 'no-store');

        if (!req.session.usuario) {
            return res.status(401).json({
                success: false,
                error: 'No existe una sesion activa'
            });
        }

        return res.json({
            success: true,
            usuario: req.session.usuario
        });
    });

    // Cerrar sesion.
    router.post('/logout', (req, res) => {

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
                secure: process.env.NODE_ENV === 'production'
            });

            return res.json({
                success: true,
                mensaje: 'Sesion cerrada correctamente'
            });
        });
    });

    app.use('/api/auth', router);
}
