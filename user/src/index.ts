import { DurableObject } from "cloudflare:workers";
import { User, UserError, UserErrors, Session } from "@app/shared"
/**
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/durable-objects
 */
export class UserDataPlane extends DurableObject<Env> {
	/**
	 * The constructor is invoked once upon creation of the Durable Object, i.e. the first call to
	 * 	`DurableObjectStub::get` for a given identifier (no-op constructors can be omitted)
	 *
	 * @param ctx - The interface for interacting with Durable Object state
	 * @param env - The interface to reference bindings declared in wrangler.jsonc
	 */
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
	}

	/**
	 *  Returns a users data
	 * 
	 * @returns The greeting to be sent back to the Worker
	 */
	async get_user(): Promise<User | UserError> {
		const user: User | undefined = await this.ctx.storage.get("user");
		if (user) {
			return user
		} else {
			return {
				error: UserErrors.NoUser,
				msg: "No User Data"
			}
		}
	}

	async put_user(u: User): Promise<void> {
		return await this.ctx.storage.put("user", u)
	}

	async get_session(): Promise<Session | UserError> {
		const session: Session | undefined = await this.ctx.storage.get("session");
		if (session) {
			return session
		} else {
			return {
				error: UserErrors.NoSession,
				msg: "Unable to retrieve user session"
			}
		}
	}

	async put_session(s: Session): Promise<void> {
		return await this.ctx.storage.put("session", s)
	}

	async del_session(): Promise<boolean> {
		return await this.ctx.storage.delete("session")
	}

}

export class UserControlPlane extends DurableObject<Env> {
	/**
	 * The constructor is invoked once upon creation of the Durable Object, i.e. the first call to
	 * 	`DurableObjectStub::get` for a given identifier (no-op constructors can be omitted)
	 *
	 * @param ctx - The interface for interacting with Durable Object state
	 * @param env - The interface to reference bindings declared in wrangler.jsonc
	 */
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env)
	}

	async get(): Promise<string> {
		return `list all users`;
	}

	async put(user: string): Promise<string> {
		return user
	}
}

export default {
	/**
	 * This is the standard fetch handler for a Cloudflare Worker
	 *
	 * @param request - The request submitted to the Worker from the client
	 * @param env - The interface to reference bindings declared in wrangler.jsonc
	 * @param ctx - The execution context of the Worker
	 * @returns The response to be sent back to the client
	 */
	async fetch(request, env, ctx): Promise<Response> {
		// Create a stub to open a communication channel with the Durable Object
		// instance named "foo".
		//
		// Requests from all Workers to the Durable Object instance named "foo"
		// will go to a single remote Durable Object instance.
		const stub = env.USER_CONTROL_PLANE.getByName("user-control-plane");

		// Call the `sayHello()` RPC method on the stub to invoke the method on
		// the remote Durable Object instance.
		const users = await stub.get();

		return new Response(users);
	},
} satisfies ExportedHandler<Env>;
