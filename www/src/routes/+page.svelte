<script lang="ts">
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let password = $state('');
	let confirmPassword = $state('');

	// Basic password rules — adjust as needed
	function isStrong(pw: string) {
		return (
			pw.length >= 8 &&
			/[A-Z]/.test(pw) &&
			/[a-z]/.test(pw) &&
			/\d/.test(pw) &&
			/[^A-Za-z0-9]/.test(pw)
		);
	}

	let strongPassword = $derived(isStrong(password));
	let passwordsMatch = $derived(password === confirmPassword);

	let errorMessage = $derived.by(() => {
		if (password && !strongPassword) {
			return 'Password must be at least 8 characters and include uppercase, lowercase, number, and a symbol.';
		}
		if (confirmPassword && !passwordsMatch) {
			return 'Passwords do not match.';
		}
		return '';
	});
</script>

<div style="background-image: url(/accent_wave.svg);" class="hero bg-base-200 min-h-screen">
	<div class="hero-content flex-col lg:flex-row-reverse">
		<div class="text-center lg:text-left">
			<h1 class="text-5xl text-neutral font-bold">Join the Revolution</h1>
			<p class="py-6 text-neutral">
				Local meat. lower prices. That's it. Join the community of farmers and consumers who are
				changing the way we buy and sell meat
			</p>
		</div>
		<div class="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
			<div class="card-body">
				<form method="POST" action="?/register">
					<fieldset class="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4">
						<legend class="fieldset-legend">Signup</legend>

						{#if errorMessage}
							<p class="text-error">{errorMessage}</p>
						{/if}
						{#if form?.error}
							<p class="text-error">{form?.error}</p>
						{/if}

						<label class="label">Email</label>
						<input name="email" type="email" class="input" placeholder="Email" />

						<label class="label">Password</label>
						<input
							bind:value={password}
							name="password"
							type="password"
							class="input"
							placeholder="Password"
						/>

						<label class="label">Confirm Password</label>
						<input
							bind:value={confirmPassword}
							name="confirmPassword"
							type="password"
							class="input"
							placeholder="Confirm Password"
						/>

						<button type="submit" class="btn btn-primary mt-4">Signup</button>

						<div class="divider">OR</div>

						<!-- Google -->
						<a href="/google/" class="btn mt-2 border-[#e5e5e5] bg-white text-black">
							<svg
								aria-label="Google logo"
								width="16"
								height="16"
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 512 512"
								><g
									><path d="m0 0H512V512H0" fill="#fff"></path><path
										fill="#34a853"
										d="M153 292c30 82 118 95 171 60h62v48A192 192 0 0190 341"
									></path><path
										fill="#4285f4"
										d="m386 400a140 175 0 0053-179H260v74h102q-7 37-38 57"
									></path><path fill="#fbbc02" d="m90 341a208 200 0 010-171l63 49q-12 37 0 73"
									></path><path
										fill="#ea4335"
										d="m153 219c22-69 116-109 179-50l55-54c-78-75-230-72-297 55"
									></path></g
								></svg
							>
							Signup with Google
						</a>

						<!-- Facebook -->
						<a
							href="/facebook/"
							class="btn btn-disabled mt-2 border-[#005fd8] bg-[#1A77F2] text-white opacity-20"
						>
							<svg
								aria-label="Facebook logo"
								width="16"
								height="16"
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 32 32"
								><path
									fill="white"
									d="M8 12h5V8c0-6 4-7 11-6v5c-4 0-5 0-5 3v2h5l-1 6h-4v12h-6V18H8z"
								></path></svg
							>
							Signup with Facebook
						</a>
					</fieldset>
				</form>
			</div>
		</div>
	</div>
</div>
