import { Session, SessionError, SessionErrors, SessionsRow, SessionWithSessionId, createSessionError, SessionWithSecret } from "@app/shared";
import { DurableObject, WorkerEntrypoint } from "cloudflare:workers";
/**
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/durable-objects
 */
export class SessionDataPlane extends DurableObject<Env> {
    /**
     * The constructor is invoked once upon creation of the Durable Object, i.e. the first call to
     * 	`DurableObjectStub::get` for a given identifier (no-op constructors can be omitted)
     *
     * @param ctx - The interface for interacting with Durable Object state
     * @param env - The interface to reference bindings declared in wrangler.jsonc
     */
    constructor(ctx: DurableObjectState, env: Env) {
        super(ctx, env);
    }

    /**
     * 
     * @returns Session
     */
    async get_session(): Promise<SessionWithSecret | SessionError> {
        const session: SessionWithSecret | undefined = await this.ctx.storage.get("session");
        if (session) {
            return session
        } else {
            return createSessionError(SessionErrors.NoSession)
        }
    }

    async put_session(s: SessionWithSecret): Promise<void> {
        return await this.ctx.storage.put("session", s)
    }

    async del_session(): Promise<boolean> {
        return await this.ctx.storage.delete("session")
    }

}


export default class extends WorkerEntrypoint   {
    async fetch() {
        return new Response("Hello from Worker B");
    }

    async generateSecureRandomString(): Promise<string> {
        // Human readable alphabet (a-z, 0-9 without l, o, 0, 1 to avoid confusion)
        const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";

        // Generate 24 bytes = 192 bits of entropy.
        // We're only going to use 5 bits per byte so the total entropy will be 192 * 5 / 8 = 120 bits
        const bytes = new Uint8Array(24);
        crypto.getRandomValues(bytes);

        let id = "";
        for (let i = 0; i < bytes.length; i++) {
            // >> 3 "removes" the right-most 3 bits of the byte
            id += alphabet[bytes[i] >> 3];
        }
        return id;
    }

    async hashSecret(secret: string): Promise<Uint8Array> {
        const secretBytes = new TextEncoder().encode(secret);
        const secretHashBuffer = await crypto.subtle.digest("SHA-256", secretBytes);
        return new Uint8Array(secretHashBuffer);

    }

    async constantTimeEqual(a: Uint8Array, b: Uint8Array): Promise<boolean> {
        if (a.byteLength !== b.byteLength) {
            return false;
        }
        let c = 0;
        for (let i = 0; i < a.byteLength; i++) {
            c |= a[i] ^ b[i];
        }
        return c === 0;
    }

    async createSession(secret: string, userId: string): Promise<SessionWithSessionId | SessionError> {
        const now = new Date();
        const id = await this.generateSecureRandomString();
        const secretHash = await this.hashSecret(secret);


        const new_session: SessionWithSecret = {
            secretHash,
            lastVerifiedAt: now,
            createdAt: now,
            userId: userId
        };

        let stub = this.env.SESSION.getByName(id);

        await stub.put_session(new_session)
        let result = await this.env.SESSION_CONTROL_PLANE.prepare(
            `INSERT INTO SESSIONS (sessionId, userId) values (?, ?)`,
        ).bind(id, userId).run();

        if (result.error) {
            await stub.del_session()
            let res = createSessionError(SessionErrors.UnableToRecordSession)
            return res

        }

        const res: SessionWithSessionId = {
            lastVerifiedAt: now,
            createdAt: now,
            sessionId: id,
            userId: userId
        }

        return res;
    }

    async validateSessionToken(token: string): Promise<Session | SessionError> {
        const activityCheckIntervalSeconds = 60 * 60; // 1 hour
        const now = new Date();

        const tokenParts = token.split(".");
        if (tokenParts.length !== 2) {
            return createSessionError(SessionErrors.UnableToValidateSession)
        }
        const sessionId = tokenParts[0];
        const sessionSecret = tokenParts[1];

        let stub = this.env.SESSION.getByName(sessionId);

        const session: SessionWithSecret | SessionError = await stub.get_session();
        if ("error" in session) {
            return createSessionError(SessionErrors.UnableToValidateSession)
        } else {
            const tokenSecretHash = await this.hashSecret(sessionSecret);
            const validSecret = await this.constantTimeEqual(tokenSecretHash, session.secretHash);
            if (!validSecret) {
                return createSessionError(SessionErrors.UnableToValidateSession)
            }
            if (now.getTime() - session.lastVerifiedAt.getTime() >= activityCheckIntervalSeconds * 1000) {
                session.lastVerifiedAt = now;
                const response = await stub.put_session(session);
            }

        }
        const pubSession: Session = {
            createdAt: session.createdAt,
            lastVerifiedAt: session.lastVerifiedAt,
            userId: session.userId
        }
        return pubSession;
    }

    async deleteSession(token: string): Promise<null | void> {
        const tokenParts = token.split(".");
        if (tokenParts.length !== 2) {
            return null;
        }
        const sessionId = tokenParts[0];

        let stub = this.env.SESSION.getByName(sessionId);
        await stub.del_session()
    }
}