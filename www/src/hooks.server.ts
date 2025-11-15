import { setSessionTokenCookie, deleteSessionTokenCookie } from "$lib/server/session";
import { type Session, type SessionError } from "@app/shared";
import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get("session") ?? null;
	if (token === null) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}
        
    const session: Session | SessionError = await event.platform?.env.SESSIONS.validateSessionToken(token);
    if ("error" in session){
		deleteSessionTokenCookie(event);
	} else {
		setSessionTokenCookie(event, token, new Date(session.lastVerifiedAt.getTime() + (60 * 60 * 24 * 5 * 1000)));
		event.locals.session = session;
		event.locals.user = await event.platform?.env.USER.getByName(session.userId).get_user();
	}

	return resolve(event);
};

