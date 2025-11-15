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
            <h1 class="text-5xl font-bold">Thank You { data.displayName }!</h1>
            <p class="py-6">
                We appreciate you being part of our community.
            </p>
        </div>
    </div>
</div>
