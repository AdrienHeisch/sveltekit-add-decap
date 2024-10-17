<script lang="ts">
    import Post from "$lib/components/Post.svelte";

    export let data: HomeData;
</script>

<h1>Welcome to SvelteKit</h1>
<p>
    Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation
</p>
<Post data={data.post}></Post>
