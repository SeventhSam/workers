import { DurableObject, WorkerEntrypoint } from "cloudflare:workers";
import { User, UsersRow, UserError, UserErrors, Session } from "@app/shared";

export class UserDataPlane extends DurableObject<Env> {
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
	}

	/**
	 * Returns the user data stored in this DO instance
	 */
	async get_user(): Promise<User | UserError> {
		const user: User | undefined = await this.ctx.storage.get("user");
		if (user) {
			return user;
		} else {
			return {
				error: UserErrors.NoUser,
				msg: "No User Data",
			};
		}
	}

	async put_user(u: User): Promise<void> {
		return await this.ctx.storage.put("user", u);
	}

	async del_user(): Promise<boolean> {
		return await this.ctx.storage.delete("user");
	}
}


export default class UserControlPlane extends WorkerEntrypoint<Env> {
	async fetch(_request: Request): Promise<Response> {
		// You can later add HTTP routing here if you want.
		return new Response("Hello from User Control Plane");
	}

	/**
	 * Fetch **all users**:
	 *   1. SELECT all userIds from USER_CONTROL_PLANE
	 *   2. For each userId, fetch user data from its UserDataPlane DO
	 *   3. Return array of User objects (skip those with missing DO data)
	 */
	async getAllUsers(): Promise<UsersRow[]> {
		// 1. Query every user entry from the control-plane SQL DB
		const result = await this.env.USER_CONTROL_PLANE
			.prepare(`SELECT * FROM USERS`)
			.all<UsersRow>();

		const rows = result.results ?? [];
		if (rows.length === 0) {
			return [];
		}

		// 2. Fetch each user's data plane object
		const users: UsersRow[] = [];

		for (const row of rows) {
			users.push(row)
		}

		return users;
	}


	/**
	 * Create a new user:
	 *  - store the full User object in the UserDataPlane DO
	 *  - record the userId in the USER_CONTROL_PLANE D1 database
	 *
	 * Assumes User has a `userId` field.
	 */
	async createUser(user: User): Promise<User | UserError> {
		const stub = this.env.USER.getByName(user.userId);

		try {

			// 2. Write to SQL DB (control plane)
			const result = await this.env.USER_CONTROL_PLANE
				.prepare(
					`INSERT INTO USERS (userId, createdAt, email) VALUES (?, ?, ?)`
				)
				.bind(user.userId, user.createdAt, user.email)
				.run();

			if (result.error) {
				throw result.error;
			}
			await stub.put_user(user);
			return user;

		} catch (err: any) {
			// roll back DO
			const msg = String(err?.message || "");
			// Email already taken → UNIQUE index failure
			console.error(err)
			if (msg.includes("UNIQUE constraint failed: USERS.email")) {
				return {
					error: UserErrors.UnableToCreateUser,
					msg: "Email is already taken",
				};
			}

			return {
				error: UserErrors.UnableToCreateUser,
				msg: "Unable to record user in control-plane database",
			};
		}
	}

	/**
	 * Fetch a user by userId:
	 *  - verify existence in the SQL USERS table
	 *  - then read from the user’s Durable Object
	 */
	async getUserById(userId: string): Promise<User | UserError> {
		// 1. Check we have a row in USERS, so the user is tracked
		const row = await this.env.USER_CONTROL_PLANE.prepare(
			`SELECT userId, createdAt FROM USERS WHERE userId = ?`
		)
			.bind(userId)
			.first<UsersRow>();

		if (!row) {
			const err: UserError = {
				error: UserErrors.NoUser,
				msg: "User not found in control-plane database",
			};
			return err;
		}

		// 2. Load the actual user data from the DO
		const stub = this.env.USER.getByName(row.userId);
		const userOrErr = await stub.get_user();

		// get_user already returns User | UserError
		return userOrErr;
	}

	/**
	 * Convenience: fetch user from a Session object
	 * (like you do for sessions → user mapping via userId).
	 */
	async getUserForSession(session: Session): Promise<User | UserError> {
		return this.getUserById(session.userId);
	}

	/**
	 * Delete a user from both:
	 *  - the UserDataPlane DO
	 *  - the USER_CONTROL_PLANE D1 USERS table
	 */
	async deleteUser(userId: string): Promise<null | UserError> {
		// 1. Delete DO state
		const stub = this.env.USER.getByName(userId);
		await stub.del_user();

		// 2. Delete DB row
		const result = await this.env.USER_CONTROL_PLANE.prepare(
			`DELETE FROM USERS WHERE userId = ?`
		)
			.bind(userId)
			.run();

		if (result.error) {
			// NOTE: adjust error enum value as needed
			const err: UserError = {
				error: UserErrors.UnableToDeleteUser, // define this in @app/shared
				msg: "Failed to delete user from control-plane database",
			};
			return err;
		}

		return null;
	}
}
