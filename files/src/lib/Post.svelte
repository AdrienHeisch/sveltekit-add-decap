<script lang="ts">
    export let data: PostData;
</script>

<div>
    <h1>{data.title}</h1>
    <p>{data.date}</p>
    <img src={data.thumbnail} height="100" alt="" />
    <p>{data.body}</p>
</div>
