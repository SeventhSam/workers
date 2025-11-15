import { generateSessionSecret, setSessionTokenCookie } from "$lib/server/session";
import { google } from "$lib/server/ouath";
import { decodeIdToken } from "arctic";

import type { RequestEvent } from "@sveltejs/kit";
import type { OAuth2Tokens } from "arctic";
import { provder, type SessionWithSessionId, type User, type UserError, type SessionError } from "@app/shared";

export async function GET(event: RequestEvent): Promise<Response> {
    const code = event.url.searchParams.get("code");
    const state = event.url.searchParams.get("state");
    const storedState = event.cookies.get("google_oauth_state") ?? null;
    const codeVerifier = event.cookies.get("google_code_verifier") ?? null;
    if (code === null || state === null || storedState === null || codeVerifier === null) {
        return new Response(null, {
            status: 400
        });
    }
    if (state !== storedState) {
        return new Response(null, {
            status: 400
        });
    }

    let tokens: OAuth2Tokens;
    try {
        tokens = await google.validateAuthorizationCode(code, codeVerifier);
    } catch (e) {
        // Invalid code or client credentials
        return new Response(null, {
            status: 400
        });
    }
    const claims: any = decodeIdToken(tokens.idToken());
    const googleUserId = claims.sub
    const email: string = claims.email;
    const picture = claims.picture;
    const name = claims.name;
    const verified = claims.email_verified;
    const now = new Date();

    const secret = generateSessionSecret();
    let stub = event.platform?.env.USER.getByName(googleUserId);
    if (stub) {
        let user: User | UserError = await stub.get_user();
        console.log("User res >>>\n", user)
        if ("error" in user) {
            const session: SessionWithSessionId = await event.platform?.env.SESSIONS.createSession(secret, googleUserId);
            let newUser: User = {
                userId: googleUserId,
                email: email,
                displayName: name,
                avatarUrl: picture,
                provider: provder.Google,
                verified: verified,
                region: "",
                createdAt: now.getTime(),
                updatedAt: now.getTime(),
                passwordHash: undefined,
            }
            console.log(`Creating User\n${JSON.stringify(newUser)}`)
            let res = await event.platform?.env.USERS.createUser(newUser);
            if ("error" in res) {
                return new Response(res.msg, {
                    status: 400
                });
            }
            let token = session.sessionId + "." + secret
            setSessionTokenCookie(event, token, new Date(session.createdAt.getTime() + (60 * 60 * 24 * 5 * 1000)));
            return new Response(null, {
                status: 302,
                headers: {
                    Location: "/thanks"
                }
            });

        }

        console.log("Establishing Session for Existing User " + googleUserId)
        const session: SessionWithSessionId = await event.platform?.env.SESSIONS.createSession(secret, googleUserId);
        let token = session.sessionId + "." + secret
        setSessionTokenCookie(event, token, new Date(session.createdAt.getTime() + (60 * 60 * 24 * 5 * 1000)));
        return new Response(null, {
            status: 302,
            headers: {
                Location: "/thanks"
            }
        });



    } else {
        return new Response("Unable to connect to Data Plane", {
            status: 500,
            headers: {
                Location: "/"
            }
        })
    }
}