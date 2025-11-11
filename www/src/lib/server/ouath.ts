import { Google } from "arctic";
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, HOST, PORT, SCHEME } from "$env/static/private";
let callback_url = ""
if (PORT) {
	callback_url = `${SCHEME}://${HOST}:${PORT}/google/callback`
} else {
	callback_url = `${SCHEME}://${HOST}/google/callback`
}
export const google = new Google(
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
	callback_url
);