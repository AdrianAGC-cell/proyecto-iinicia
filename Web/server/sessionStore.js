import session from 'express-session';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export class SQLiteSessionStore extends session.Store {
    constructor() {
        super();

        const directory = join(
            homedir(), '.local', 'share', 'iinicia', 'sessions'
        );

        mkdirSync(directory, {
            recursive: true,
            mode: 0o700
        });

        this.db = new DatabaseSync(
            join(directory, 'sessions.sqlite')
        );

        this.db.exec('PRAGMA journal_mode = WAL');

        this.db.exec(`
            CREATE TABLE IF NOT EXISTS sessions (
                sid TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                expires INTEGER NOT NULL
            );

            CREATE INDEX IF NOT EXISTS sessions_expires
            ON sessions(expires);
        `);

        this.cleanup();

        this.timer = setInterval(
            () => this.cleanup(),
            15 * 60 * 1000
        );

        this.timer.unref();
    }

    expiration(data) {
        let expires = data.cookie?.expires
            ? new Date(data.cookie.expires).getTime()
            : Date.now() + 8 * 60 * 60 * 1000;

        if (data.institucionalExpires) {
            expires = Math.min(
                expires,
                data.institucionalExpires * 1000
            );
        }

        return expires;
    }

    get(sid, callback) {
        let result;

        try {
            const row = this.db.prepare(`
                SELECT data FROM sessions
                WHERE sid = ? AND expires > ?
            `).get(sid, Date.now());

            result = row ? JSON.parse(row.data) : null;
        } catch (error) {
            return callback(error);
        }

        callback(null, result);
    }

    set(sid, data, callback = () => {}) {
        try {
            this.db.prepare(`
                INSERT INTO sessions (sid, data, expires)
                VALUES (?, ?, ?)
                ON CONFLICT(sid) DO UPDATE SET
                    data = excluded.data,
                    expires = excluded.expires
            `).run(
                sid,
                JSON.stringify(data),
                this.expiration(data)
            );
        } catch (error) {
            return callback(error);
        }

        callback(null);
    }

    destroy(sid, callback = () => {}) {
        try {
            this.db.prepare(`
                DELETE FROM sessions WHERE sid = ?
            `).run(sid);
        } catch (error) {
            return callback(error);
        }

        callback(null);
    }

    touch(sid, data, callback = () => {}) {
        try {
            this.db.prepare(`
                UPDATE sessions SET expires = ?
                WHERE sid = ? AND expires > ?
            `).run(
                this.expiration(data),
                sid,
                Date.now()
            );
        } catch (error) {
            return callback(error);
        }

        callback(null);
    }

    cleanup() {
        try {
            this.db.prepare(`
                DELETE FROM sessions WHERE expires <= ?
            `).run(Date.now());
        } catch {
            console.error(
                '[IINICIA] Error limpiando sesiones vencidas'
            );
        }
    }
}
