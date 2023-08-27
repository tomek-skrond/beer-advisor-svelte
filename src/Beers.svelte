<script>
    import { onMount } from "svelte";
    import Beer from "./Beer.svelte";

    export let pageNumber = 1;
    async function loadBeers(){
        const response = await fetch("http://localhost:4444/all");
        var beerList = await response.json();
        console.log(beerList[0])

        if (!response.ok){
            throw new Error("sth rong")
        }

        let beersubset = beerList.slice((pageNumber-1)*25,pageNumber*25);
        console.log(beersubset)

        return beersubset
    }

    const beerPromise = loadBeers();


</script>
<svelte:options tag="beers-component"/>

{#await beerPromise}
    <p>Loading...</p>
{:then beerList}
    {#each beerList as b}

    <div style="
    border: 5px dotted black;
    margin: 10px 10px 10px 10px;
    padding: 10px 10px 10px 10px;
    border-radius: 20px;
    text-align: center;
    background-color:beige;
    ">
        <h3>{b.name}</h3>
        <p style="font-style:italic;">{b.tagline}</p>
        <p>Alcohol: <b>{b.abv}%</b></p>
    </div>
    
    {/each}
{:catch error}
    <p style="color: red">{error.message}</p>
{/await}

<style>
</style>