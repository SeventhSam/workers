// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import { User, Session } from "@app/shared";

declare global {
	namespace App {
        interface Platform {
            env: Env
            cf: CfProperties
            ctx: ExecutionContext
        }
		interface Locals {
			user: User | null;
			session: Session | null;
		}
    }
}

export {};