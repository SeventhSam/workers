import { generateSessionToken, createSession, setSessionTokenCookie, inactivityTimeoutSeconds } from "$lib/server/session";
import { google } from "$lib/server/ouath";
import { decodeIdToken } from "arctic";

import type { RequestEvent } from "@sveltejs/kit";
import type { OAuth2Tokens } from "arctic";
import { provder, type User, type UserError } from "@app/shared";

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
    // TODO: Replace this with your own DB query.
    let stub = event.platform?.env.USER_DATA_PLANE.getByName(googleUserId);
    if (stub) {
        let user: User | UserError = await stub.get_user();
        if ("No User Data" in user) {
            const sessionToken = generateSessionToken();
            const session = await createSession(stub, sessionToken);
            let newUser: User = {
                email: email,
                displayName: name,
                avatarUrl: picture,
                provider: provder.Google,
                verified: verified,
                region: "",
                createdAt: now,
                updatedAt: now,
                passwordHash: undefined,
            }
            stub.put_user(newUser)
            setSessionTokenCookie(event, sessionToken, new Date(session.createdAt.getTime() + (inactivityTimeoutSeconds * 1000)));
            return new Response(null, {
                status: 302,
                headers: {
                    Location: "/"
                }
            });
        }
        const sessionToken = generateSessionToken();
        const session = await createSession(stub, sessionToken);
        setSessionTokenCookie(event, sessionToken, new Date(session.createdAt.getTime() + (inactivityTimeoutSeconds * 1000)));
        return new Response(null, {
            status: 302,
            headers: {
                Location: "/"
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