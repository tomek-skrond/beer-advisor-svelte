FROM golang:1.20.5-alpine

RUN mkdir /src

COPY src/go.mod /src
COPY src/go.sum /src

COPY ./src/ /src

WORKDIR /src

RUN apk update && apk add --no-cache git && apk add --no-cache bash && apk add build-base

RUN go mod download

RUN go build -o beeradvisor .

CMD ["/src/beeradvisor"]
