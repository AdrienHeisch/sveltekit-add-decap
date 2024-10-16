<script lang="ts">
    import { page } from "$app/stores";
    import { onMount } from "svelte";

    let Component: Promise<any>;
    let data: any | null = null;

    const modules = import.meta.glob([
        `$lib/*.svelte`,
        `$lib/*/*.svelte`,
        `$lib/*/*/*.svelte`,
        `$lib/*/*/*/*.svelte`,
        `$lib/*/*/*/*/*.svelte`,
        `$lib/*/*/*/*/*/*.svelte`,
        `$lib/*/*/*/*/*/*/*.svelte`,
        `$lib/*/*/*/*/*/*/*/*.svelte`,
        `$lib/*/*/*/*/*/*/*/*/*.svelte`,
        `$lib/*/*/*/*/*/*/*/*/*/*.svelte`,
    ]);

    onMount(() => {
        const componentPath = $page.url.searchParams.get("path");
        if (componentPath) {
            try {
                Component = modules[`/src/${componentPath}.svelte`]();
            } catch {
                throw `There is no component at /src/${componentPath}.svelte`;
            }
        }

        const handleMessage = async (event: MessageEvent<any>) => {
            if (window.location.host !== event.origin.split("/").pop()) return;
            data = event.data;
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    });
</script>

{#if data}
    {#await Component then Component}
        <svelte:component this={Component.default} {data} />
    {:catch}
        <p>{`Component ${$page.params.name} not found`}</p>
    {/await}
{/if}
