<script lang="ts">
	import type { PageProps } from './$types';
    import { provderName } from "@app/shared"
	let { data }: PageProps = $props();



</script>

<div style="background-image: url(/accent_wave.svg);" class="hero bg-base-200 min-h-screen">
	<div class="hero-content flex-col lg:flex-row-reverse">
		<div class="text-center lg:text-left">
			<h1 class="text-5xl font-bold">{data.displayName}</h1>
			<table class="table-zebra table-sm table">
				<thead>
					<tr>
                        <th>ID</th>
						<th>Email</th>
                        <th>Name</th>
                        <th>Provider</th>
                        <th>Verified</th>
                        <th>Region</th>
                        <th>Created</th>
                        <th>Updated</th>
					</tr>
				</thead>
                <tbody>
                    <tr>
                        <td>{data.userId}</td>
                        <td>{data.email}</td>
                        <td>{data.displayName}</td>
                        <td>{provderName[data.provider]}</td>
                        <td>{data.verified}</td>
                        <td>{data.region}</td>
                        <td>{new Date(data.createdAt)}</td>
                        <td>{new Date(data.updatedAt)}</td>
                    </tr>
                </tbody>
			</table>
		</div>
	</div>
</div>
