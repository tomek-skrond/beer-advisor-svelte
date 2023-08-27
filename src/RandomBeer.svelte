<svelte:options tag="random-beer"/>
<script>
    import { onMount } from "svelte";
    import Beer from "./Beer.svelte";

    async function loadBeers(){
        const response = await fetch("http://localhost:4444/randombeer");
        var beer = await response.json();


        if (!response.ok){
            throw new Error("sth rong")
        }


        return beer
    }

    const beerPromise = loadBeers();
</script>

    {#await beerPromise}
        <p>Loading...</p>
    {:then beer}
        <div class="header">{beer.name}</div>
        
        <div class="flex-container">
            <div class="bottle" style="background-image: url({beer.image_url});"></div>
            <div class="description">
                <p>ID: {beer.id}</p>
                <p>Alcohol %vol: {beer.alcohol}</p>
                <p>{beer.tagline}</p>
                <p>{beer.description}</p>
            </div>
        </div>

    {:catch error}
        <p style="color: red">{error.message}</p>
    {/await}
 
    <div class="footer">
        <div class="flex-container">
            <p class="bigger-footer">Thanks for visiting this website!</p>
        </div>
        <div class="flex-container">
            <p style="font-size: medium;">Created By</p>
        </div>
        <div class="flex-container">
            <p style="font-size: medium;">sampletext</p>
        </div>
        <div class="flex-container">
            <p style="font-size: small;">Github: <a href="https://www.google.com">tomek-skrond</a></p>
        </div>
        <div class="flex-container">
            <p style="font-size: small;">Linkedin: <a href="https://www.google.com">/in</a></p>
        </div>
    </div>

<style>
    
    * { 
        box-sizing: border-box;
    }
    html, body {
        font-family: 'Inconsolata', monospace;
        font-weight: bold;
        min-height: 100%;
        background: #fff;
        color: #000;
    }
        /* sets the body height of the browser, so that backgrounds and div heights work correctly. Color and background will almost certainly be altered; they are just placeholders */
        
    body {
        font-size: 1.4rem;
        text-rendering: optimizeLegibility;
        height: 100%;
        width: 100%;
    }
    body, ul, ol, dl {
        margin: 0;
    }

    .header {
        background-color: #885f21c4;
        text-align: center;
        font-size: 35px;
        padding: 40px;
    }

    /* Create three equal columns that float next to each other */
    .flex-container {
        display: flex;
        justify-content: space-between;
        background-color: #f1f1f1;
        flex-direction:row;
        height: 600px;
        margin: 5px 5px 5px 5px;
    }

    .flex-container > p {
        height: 20px;
        margin: 0px 0px 0px 0px;
    }

    .bigger-footer {
        height: 50px;
    }

    .footer > div {
        flex-direction: row;
        background-color: #885f21c4;
        text-align: center;
        align-items: center;
        justify-content: center;
        height: 45px;
        width: 100%;
        margin:0;
        align-self: flex-end;
    }

    .bottle {
        width: 30%;
        background-color: rgb(226, 199, 109);
        background-position: center;
        background-size: 15vh;
        background-repeat: no-repeat;
        border: solid black 10px;
        border-radius: 10px;
    }
    
    .description {
        width: 69%;
        border: dotted black 10px;
        border-radius: 10px;
        padding: 10px 10px 10px 10px;
        overflow: scroll;
    }
            /* Responsive layout - makes the three columns stack on top of each other instead of next to each other on smaller screens (600px wide or less) */
    @media screen and (max-width: 600px){
    
    .flex-container {
        flex-direction: column;
        justify-content: center;
        height: 1000px;

    }
    
    .bottle {
        width: 100%;
        height: 60%;
    }
    .description{
        width: 100%;
        height: 40%;
    }
    }

</style>