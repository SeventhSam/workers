export enum UserErrors {
    NoUser,
    UnableToCreateUser,
    UnableToDeleteUser
}

export enum provder {
    Google,
    Facebook,
    Local
}

export const provderName = {
    0: "Google",
    1: "Facebook",
    2: "Local"
}

export interface UserError {
    error: UserErrors
    msg: string
}

export interface User {
    userId: string,
    email: string,
    displayName: string,
    avatarUrl: string,
    provider: provder,
    verified: boolean,
    region: string,
    createdAt: number,
    updatedAt: number,
    passwordHash: Uint8Array | undefined,
}

export interface UsersRow {
    email: string,
    createdAt: number,
    userId: string
}