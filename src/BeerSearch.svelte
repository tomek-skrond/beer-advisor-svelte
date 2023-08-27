<svelte:options tag="search-beer"/>

<script>
	import Search from "./Search.svelte";
	import Form from "./Form.svelte"

	let keyword="";
	
	function handleOnSubmit() {
		console.log("I'm the handleOnSubmit() in App.svelte")
	}

</script>


<h1>Search for Beers</h1>

<Form on:submit={handleOnSubmit}/>

<style>
	/* It can be empty :) */
</style>