import type { PageServerLoad } from './$types';
import { getRequestEvent } from '$app/server';
import { fail, redirect } from "@sveltejs/kit";
import type { User } from '@app/shared';
export const load: PageServerLoad = async () => {
    const { locals } = getRequestEvent();
    console.log(locals.user)
    console.log(locals.session)
	if (locals.session === null || locals.user === null) {
        return redirect(302, "/");
	}else{
        const user: User = locals.user;
        return user
    }
} 