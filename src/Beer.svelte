<script>
    export let beer;
    console.log(typeof beer)
</script>
<svelte:options tag="beer-component"/>

<article>
    {#await beer}
    <p>Loading...</p>
    {:then b}
        <h4>{b}</h4>
    {:catch error}
    <p style="color: red">{error.message}</p>
{/await}
</article>
<style>
	/* It can be empty :) */
</style>