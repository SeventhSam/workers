import type { PageServerLoad } from './$types';
import { getRequestEvent } from '$app/server';
import { fail, redirect } from "@sveltejs/kit";
import UsersRow from "@app/shared"
export const load: PageServerLoad = async () => {
    const { locals, platform } = getRequestEvent();
    if (locals.session != null || locals.user != null) {
        if (locals.user?.email == "haydenbassett02@gmail.com" || locals.user?.email == "woodstocksamuel7@gmail.com") {
            const allUsers: UsersRow[] = await platform?.env.USERS.getAllUsers()
            return { users: allUsers }
        } else {
            return redirect(302, "/");
        }
    }else {
        return redirect(302, "/");
    }

} 
 