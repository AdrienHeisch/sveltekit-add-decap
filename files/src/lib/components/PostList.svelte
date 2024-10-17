<script lang="ts">
    import Post from "$lib/components/Post.svelte";

    export let data: PostListData;
</script>

<h2>Here's a list called {data.title}</h2>
<div id="list">
{#each data.list as postData}
        <Post data={postData}></Post>
    {/each}
</div>

<style>
    #list {
        border: solid black 1px;
        margin: 5px;
        width: fit-content;
        padding: 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
</style>