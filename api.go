package main

import (
	"beercli"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

func NewAPIServer(port string) *APIServer {
	return &APIServer{
		ListenPort: port,
	}
}

func (s *APIServer) Run() {
	r := mux.NewRouter()

	r.HandleFunc("/randombeer", MakeHTTPHandler(s.RandomBeer)).Methods("GET")
	r.HandleFunc("/beer/{id}", MakeHTTPHandler(s.GetBeerByID)).Methods("GET")
	r.HandleFunc("/search/{keyword}", MakeHTTPHandler(s.GetBeerByKeyword)).Methods("GET")
	r.HandleFunc("/all", MakeHTTPHandler(s.AllBeers)).Methods("GET")

	fmt.Printf("API Server listening at port %s \n", s.ListenPort)

	if err := http.ListenAndServe(s.ListenPort, r); err != nil {
		panic(err)
	}

}

func (s *APIServer) enableCors(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
}

func (s *APIServer) AllBeers(w http.ResponseWriter, r *http.Request) error {
	s.enableCors(&w)
	allBeers, err := beercli.GetAllBeers()
	if err != nil {
		return err
	}

	return WriteJSON(w, http.StatusOK, allBeers)

}
func (s *APIServer) RandomBeer(w http.ResponseWriter, r *http.Request) error {
	s.enableCors(&w)
	rb, err := beercli.GetRandomBeer()
	if err != nil {
		return err
	}

	return WriteJSON(w, http.StatusOK, rb)
}

func (s *APIServer) GetBeerByID(w http.ResponseWriter, r *http.Request) error {
	s.enableCors(&w)
	id, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		return apiError{Err: "Access denied", Status: http.StatusBadRequest}
	}

	rb, err := beercli.GetBeerByID(id)
	if err != nil {
		return apiError{Err: "Access denied", Status: http.StatusBadRequest}
	}

	return WriteJSON(w, http.StatusOK, rb)
}

func (s *APIServer) GetBeerByKeyword(w http.ResponseWriter, r *http.Request) error {
	s.enableCors(&w)
	keyword := mux.Vars(r)["keyword"]

	b, err := beercli.SearchForBeer(keyword)
	if err != nil {
		return err
	}

	return WriteJSON(w, http.StatusOK, b)
}
