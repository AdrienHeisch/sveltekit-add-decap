<script lang="ts">
    import Home from "$lib/pages/Home.svelte";

    export let data;
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
<Home {data}></Home>