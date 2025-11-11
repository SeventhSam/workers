import type { Session } from "@app/shared";
import type { RequestEvent } from "@sveltejs/kit";
import { encodeBase32 } from "@oslojs/encoding";

export const inactivityTimeoutSeconds = 60 * 60 * 24 * 5; // 5 days
export const activityCheckIntervalSeconds = 60 * 60; // 1 hour
export function generateSecureRandomString(): string {
	// Human readable alphabet (a-z, 0-9 without l, o, 0, 1 to avoid confusion)
	const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";

	// Generate 24 bytes = 192 bits of entropy.
	// We're only going to use 5 bits per byte so the total entropy will be 192 * 5 / 8 = 120 bits
	const bytes = new Uint8Array(24);
	crypto.getRandomValues(bytes);

	let id = "";
	for (let i = 0; i < bytes.length; i++) {
		// >> 3 "removes" the right-most 3 bits of the byte
		id += alphabet[bytes[i] >> 3];
	}
	return id;
}

export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
	if (a.byteLength !== b.byteLength) {
		return false;
	}
	let c = 0;
	for (let i = 0; i < a.byteLength; i++) {
		c |= a[i] ^ b[i];
	}
	return c === 0;
}


export async function hashSecret(secret: string): Promise<Uint8Array> {
	const secretBytes = new TextEncoder().encode(secret);
	const secretHashBuffer = await crypto.subtle.digest("SHA-256", secretBytes);
	return new Uint8Array(secretHashBuffer);

}

export async function createSession(stub: DurableObjectStub, userId: string): Promise<Session> {
	const now = new Date();

	const secret = generateSecureRandomString();
	const secretHash = await hashSecret(secret);


	const session: Session = {
		secretHash,
		lastVerifiedAt: now,
		createdAt: now,
	};

	const response  = await stub.put_session(session);

	return session;
}

export async function validateSessionToken(stub: DurableObjectStub, token: string, userId: string): Promise<Session | null> {
	const now = new Date();

	const tokenParts = token.split(".");
	if (tokenParts.length !== 2) {
		return null;
	}
	const sessionId = tokenParts[0];
	const sessionSecret = tokenParts[1];

	const session: Session = await stub.get_session();

	const tokenSecretHash = await hashSecret(sessionSecret);
	const validSecret = constantTimeEqual(tokenSecretHash, session.secretHash);
	if (!validSecret) {
		return null;
	}

	if (now.getTime() - session.lastVerifiedAt.getTime() >= activityCheckIntervalSeconds * 1000) {
		session.lastVerifiedAt = now;
		const response  = await stub.put_session(session);
	}

	return session;
}

export async function getSession(stub: DurableObjectStub, userId: string): Promise<Session | null> {
	const now = new Date();
	const session: Session = await stub.get_session();

	// Inactivity timeout
	if (now.getTime() - session.lastVerifiedAt.getTime() >= inactivityTimeoutSeconds * 1000) {
		await stub.del_session();
		return null;
	}

	return session;
}

export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date): void {
	event.cookies.set("session", token, {
		httpOnly: true,
		path: "/",
		secure: import.meta.env.PROD,
		sameSite: "lax",
		expires: expiresAt
	});
}

export function deleteSessionTokenCookie(event: RequestEvent): void {
	event.cookies.set("session", "", {
		httpOnly: true,
		path: "/",
		secure: import.meta.env.PROD,
		sameSite: "lax",
		maxAge: 0
	});
}

export function generateSessionToken(): string {
	const tokenBytes = new Uint8Array(20);
	crypto.getRandomValues(tokenBytes);
	const token = encodeBase32(tokenBytes).toLowerCase();
	return token;
}

