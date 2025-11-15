export interface Session {
	lastVerifiedAt: Date;
	createdAt: Date;
	userId: string
}

export interface SessionWithSessionId extends Session {
	sessionId: string
}

export interface SessionWithSecret extends Session {
  	secretHash: Uint8Array;
}

export enum SessionErrors {
  NoSession,
  UnableToRecordSession,
  UnableToValidateSession
}

export type SessionWithoutHash = Omit<Session, "secretHash">;


export const SessionErrorMessages: Record<SessionErrors, string> = {
  [SessionErrors.NoSession]: "No session is currently active.",
  [SessionErrors.UnableToRecordSession]: "The session could not be recorded in the control plane.",
  [SessionErrors.UnableToValidateSession]: "The session could not be validated.",
};

export interface SessionError {
  error: SessionErrors;
  msg: string;
}

export function createSessionError(error: SessionErrors): SessionError {
  return { error, msg: SessionErrorMessages[error] };
}


export interface SessionsRow {
	controlId: number,
	sessionId: string,
	userId: string
}