export enum UserErrors {
	NoUser,
	NoSession
}

export enum provder {
	Google,
	Apple,
	Facebook
}

export interface UserError {
	error: UserErrors
	msg: string
}

export interface User {
	email: string,
    displayName: string,
    avatarUrl: string,
    provider: provder,
    verified: boolean,
    region: string,
    createdAt: Date,
    updatedAt: Date,
    passwordHash: Uint8Array | undefined,
}