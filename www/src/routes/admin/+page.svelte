<script lang="ts">
    import type { PageProps } from './$types';

    let { data }: PageProps = $props();
</script>

<div
    style="background-image: url(/accent_wave.svg);"
    class="hero bg-base-200 min-h-screen"
>
    <div class="hero-content flex-col lg:flex-row-reverse">
        <div class="text-center lg:text-left">
            <h1 class="text-5xl font-bold">User Directory</h1>
            <p class="py-6">
                View all registered users in the system. This table is only visible to authorized admins.
            </p>
            {#if data?.users}
                <p class="text-sm opacity-70">
                    Total users: <span class="font-semibold">{data.users.length}</span>
                </p>
            {/if}
        </div>

        <div class="card bg-base-100 w-full max-w-4xl shrink-0 shadow-2xl">
            <div class="card-body">
                <fieldset class="fieldset bg-base-200 border-base-300 rounded-box border p-4">
                    <legend class="fieldset-legend">All Users</legend>

                    {#if data?.users && data.users.length > 0}
                        <div class="overflow-x-auto max-h-96">
                            <table class="table table-zebra table-sm">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Email</th>
                                        <th>ID</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {#each data.users as user, i}
                                        <tr>
                                            <th>{i + 1}</th>
                                            <td>{user.email}</td>
                                            <td>{user.userId}</td>
                                            <td><a href="/admin/{user.userId}" class="btn btn-primary">View User</a></td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        </div>
                    {:else}
                        <p class="text-center text-base-content/70">
                            No users found.
                        </p>
                    {/if}
                </fieldset>
            </div>
        </div>
    </div>
</div>
