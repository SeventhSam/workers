import { Google, Facebook } from "arctic";
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, HOST, PORT, SCHEME, FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET } from "$env/static/private";
let callback_url = ""
if (PORT != "") {
	callback_url = `${SCHEME}://${HOST}:${PORT}`
} else {
	callback_url = `${SCHEME}://${HOST}`
}
export const google = new Google(
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
	callback_url + "/google/callback"
);

export const facebook = new Facebook(
	FACEBOOK_CLIENT_ID,
	FACEBOOK_CLIENT_SECRET,
	callback_url + "/facebook/callback"
);

