export interface Session {
	secretHash: Uint8Array;
	lastVerifiedAt: Date;
	createdAt: Date;
}

export interface SessionWithToken extends Session {
	token: string
}