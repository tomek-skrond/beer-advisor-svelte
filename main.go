package main

import (
	"log"
	"os"
)

func main() {
	templatePath, err := os.Getwd()
	if err != nil {
		log.Fatalln(err)
	}
	templatePath = templatePath + "/templates"

	api := NewAPIServer(":4444")
	templates := NewTemplateServer(":3333", templatePath)

	go func() {
		templates.Run()
	}()

	go func() {
		api.Run()
	}()
	select {}
}
