### Description

My first contact with Svelte Frontend Framework.

Backend for this app is written in Go.

There are two separate servers running in the application:
- API Server (port 4444)
- Template Server (port 3000)

Template server is written in Go Fiber and is used for generating templates and passing data to Svelte.

API Server has following endpoints:
- `/randombeer` (GET) -> returns one random beer from Punk API
- `/beer/{id}` (GET) -> returns a beer with given ID
- `/search/{keyword}` (GET) -> returns an array of beers that match provided keyword
- `/all`(GET) -> returns an array of all beers


Before lauch, run `npm install` from command line.

To start, enter `make run` in working directory of the project.