<script>
</script>
<svelte:options tag="my-app"/>
  
<div class="header">
	🍺 Beer Advisor 🍺
</div>

<div class="flex-container">

	<a class="tiles" id="beerimage" href="/randombeer">Random Beer</a>

	<a class="tiles" id="searchimage" href="/search">Search</a>

	<a class="tiles" id="listimage" href="/allbeers/1">All Beers</a>
	

</div>


<div class="footer">
	<div>
		<p>Thanks for visiting this website!</p>
		<p style="font-size: medium;">Created By</p>
		<p style="font-size: medium;">Tomasz Skrond</p>
		<p style="font-size: small;">Github: <a href="https://www.google.com">tomek-skrond</a></p>
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
		justify-content: center;
		background-color: #f1f1f1;
		flex-direction:row;
		height: 100%;
		width: 100%;
	}

	.flex-container > div {
		background-color: #f1f1f1;
		text-align: center;
		line-height: 75px;
		font-size: 30px;
		height: 100%;
		width: 100%;
	}

	.footer > div {
		flex-direction: row;
		background-color: #885f21c4;
		text-align: center;
		padding: 10px;
		height: 100%;
		width: 100%;
		align-self: flex-end;
	}
	
	a.tiles {
		background-color: #4CAF50; /* Green */
		border: solid black 10px;
		color: red;
		padding: 15px 32px;
		text-align: center;
		text-decoration: none;
		display: inline-block;
		font-size: 16px;
		font-weight: bolder;
		font-family: 'Inconsolata', monospace;
		font-size: 23px;
		width: 30%;
		height: 700px;
		margin: 10px;
		opacity: 0.6;
		border-radius: 8px;
		transition: 0.5s;
	}
	
	#beerimage{
		background: #000 center/cover url("https://media.istockphoto.com/id/1142851443/vector/cartoon-beer-glass-icon-isolated-on-white-background.jpg?s=612x612&w=0&k=20&c=EsD32U2J6jve8V3MDYW_Nf95H7WH3a8NXshYvc9Y7aQ=") no-repeat;
	}

	#searchimage{
		background: white center/cover url("https://images.emojiterra.com/openmoji/v13.1/512px/1f50e.png") no-repeat;
	}

	#listimage{
		background: white center url("https://cdn-icons-png.flaticon.com/512/181/181627.png") no-repeat;
	}

	a.tiles:active {
		filter: blur(4px);
		-webkit-filter: blur(4px);
		transition: 0.2s;
	}
	a.tiles:disabled{
		transition:0.2s;
	}
	a.tiles:hover {
		font-size: larger;
		cursor: pointer;
		opacity: 0.7;
	}
	/* Responsive layout - makes the three columns stack on top of each other instead of next to each other on smaller screens (600px wide or less) */
	@media screen and (max-width: 600px) {
	.flex-container {
		flex-direction: column;
		align-items: center;
	}
	.flex-container > div{
		flex-direction: column;
	}
	a.tiles{
		width: 100%;
	}
	}
</style>