import type { User } from '@app/shared';
import type { PageServerLoad } from './$types';
import { getRequestEvent } from '$app/server';

export const load = (async () => {
    const { params, platform } = getRequestEvent();
    const user: User = await platform?.env.USER.getByName(params.userId).get_user();
    return user;
}) satisfies PageServerLoad;