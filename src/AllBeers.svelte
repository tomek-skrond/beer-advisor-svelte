<svelte:options tag="all-beers"/>
<script>
	import { onMount } from "svelte";
	import Beer from "./Beer.svelte";
	import Beers from "./Beers.svelte";
    
	let beers;
	let beer;
    export let pagenum = 1;

</script>

<Beers pageNumber={pagenum}/>

<style>
    
</style>