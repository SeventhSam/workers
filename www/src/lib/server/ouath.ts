import { Google } from "arctic";
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, HOST, PORT, SCHEME } from "$env/static/private";

export const google = new Google(
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
	`${SCHEME}://${HOST}:${PORT}/google/callback`
);