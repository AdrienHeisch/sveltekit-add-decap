<script lang="ts">
    import Post from "$lib/Post.svelte";

    export let data;
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
<Post {data}></Post>
