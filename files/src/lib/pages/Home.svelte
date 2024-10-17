<script lang="ts">
    import Post from "$lib/components/Post.svelte";
    import PostList from "$lib/components/PostList.svelte";

    export let data: HomeData;
</script>

<svelte:head>
    <title>{data.title}</title>
</svelte:head>

<h1>Welcome to SvelteKit</h1>
<p>
    Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation
</p>
<Post data={data.postChild}></Post>
<PostList data={data.postListRelation}></PostList>
