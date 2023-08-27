package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"text/template"
	"time"

	"github.com/unrolled/render"
)

type Server interface {
	Run()
}

type APIServer struct {
	ListenPort string
}

type TemplateServer struct {
	ListenPort   string
	TemplatePath string
	Renderer     *render.Render
}

type apiFunc func(http.ResponseWriter, *http.Request) error

type apiError struct {
	Err    string
	Status int
}

func (e apiError) Error() string {
	return e.Err
}

func MakeHTTPHandler(f apiFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if err := f(w, r); err != nil {
			if e, ok := err.(apiError); ok {
				WriteJSON(w, e.Status, e)
				return
			}
			WriteJSON(w, http.StatusInternalServerError, "internal server error")
		}
	}
}

func WriteJSON(w http.ResponseWriter, status int, v any) error {
	w.WriteHeader(status)
	w.Header().Add("Content-Type", "application/json")
	fmt.Printf("%v, Status: %v\n", time.Now(), status)
	return json.NewEncoder(w).Encode(v)
}

func HandleTemplate(w http.ResponseWriter, status int, t *template.Template, data any) error {
	fmt.Printf("%v, Status: %v\n", time.Now(), status)
	if err := t.Execute(w, data); err != nil {
		return err
	}
	return nil
}
