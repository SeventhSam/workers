import type { Actions } from './$types'
import { provder, type SessionWithSessionId, type User, type UserError } from "@app/shared";
import { generateSessionSecret, setSessionTokenCookie } from "$lib/server/session";
import { error, fail, redirect } from '@sveltejs/kit';

export const actions = {
    register: async (event) => {
        const data = await event.request.formData();
        const email = data.get('email');
        const password = data.get('password');
        const confirmPassword = data.get('confirmPassword')

        if (password != confirmPassword) {
            return fail(400, { error: 'Passwords do not match' });
        }

        // Basic field validation
        if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
            return fail(400, { error: 'Email and password are required' });
        }

        // Ensure platform/env bindings are available
        const userNamespace = event.platform?.env.USER;
        const usersService = event.platform?.env.USERS;
        const sessionsService = event.platform?.env.SESSIONS;

        if (!userNamespace || !usersService || !sessionsService) {
            console.error('Missing platform env bindings', {
                hasUSER: !!userNamespace,
                hasUSERS: !!usersService,
                hasSESSIONS: !!sessionsService
            });

            return fail(500, { error: 'Internal Server Error' });

        }

        let userId;
        try {
            userId = userNamespace.idFromName(email);
        } catch (err) {
            console.error('Failed to derive user id from name', err);
            return fail(500, { error: 'Internal User ID Error' });
        }

        if (!userId) {
            return fail(500, { error: 'Could not generate userId' });
        }

        const stub = userNamespace.get(userId);
        if (!stub) {
            console.error('Failed to get USER stub for userId', userId.toString());
            return fail(400, { error: 'Internal User Error' });
        }

        let user: User | UserError;
        try {
            // if get_user is async in your implementation, add `await` here
            // e.g. `user = await stub.get_user(userId.toString());`
            // Leaving as-is to match your existing signature:
            // @ts-expect-error depends on your stub typings
            user = await stub.get_user(userId.toString());
        } catch (err) {
            console.error('Error while calling stub.get_user', err);
            return fail(500, { error: 'Internal User Error' });

        }

        // If user exists, prevent duplicate registration
        if (!("error" in user)) {
            return fail(400, { error: 'A User with this email already exists' });

        }

        // At this point, we can create a new user
        const now = new Date();

        let secretHashBuffer: ArrayBuffer;
        try {
            const secretBytes = new TextEncoder().encode(password);
            secretHashBuffer = await crypto.subtle.digest("SHA-256", secretBytes);
        } catch (err) {
            console.error('Error hashing password', err);
            return fail(500, { error: 'Failed to store password' });
        }

        const newUser: User = {
            userId: userId.toString(),
            email,
            displayName: email,
            avatarUrl: "",
            provider: provder.Local,
            verified: false,
            region: "",
            createdAt: now.getTime(),
            updatedAt: now.getTime(),
            passwordHash: new Uint8Array(secretHashBuffer),
        };

        try {
            let res = await usersService.createUser(newUser);
            if ("error" in res) {
                return fail(400, { error: res.msg })
            }
        } catch (err) {
            console.error('Error creating user', err);
            return fail(500, { error: 'Failed to create User' });

        }

        let session: SessionWithSessionId;
        let sessionSecret: string;

        try {
            sessionSecret = generateSessionSecret();
            session = await sessionsService.createSession(sessionSecret, userId.toString());
        } catch (err) {
            console.error('Error creating session', err);
            return fail(500, { error: 'Failed to create Session' });

        }

        try {
            const token = `${session.sessionId}.${sessionSecret}`;
            const expiry = new Date(session.createdAt.getTime() + (60 * 60 * 24 * 5 * 1000));
            setSessionTokenCookie(event, token, expiry);
        } catch (err) {
            console.error('Error setting session cookie', err);
            return fail(500, { error: 'Failed to set Session cookie' });

        }

        // Successful registration -> redirect
        redirect(302, "/thanks")
    }
} satisfies Actions;
