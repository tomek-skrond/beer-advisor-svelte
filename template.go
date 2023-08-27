package main

import (
	"fmt"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/template/html/v2"
	"github.com/unrolled/render"
)

func NewTemplateServer(lp string, path string) *TemplateServer {
	return &TemplateServer{
		ListenPort:   lp,
		TemplatePath: path,
		Renderer: render.New(render.Options{
			Extensions: []string{".html"},
		}),
	}
}

func (ts *TemplateServer) Run() {

	engine := html.New("./templates", ".html")

	app := fiber.New(fiber.Config{Views: engine})

	app.Static("/public", "./public")
	//r.HandleFunc("/", MakeHTTPHandler(ts.Home))

	app.Get("/", ts.Home)
	app.Get("/allbeers/:id", ts.AllBeersID)
	app.Get("/randombeer", ts.RandomBeer)
	app.Get("/search/", ts.SearchBeer)
	fmt.Printf("Template Server listening at port: %v\n", ts.ListenPort)
	app.Listen(":3000")
}

func (ts *TemplateServer) Home(c *fiber.Ctx) error {

	return c.Render("index", nil)
}

type TemplateArgs struct {
	Iter    []int
	PageNum string
}

func (ts *TemplateServer) SearchBeer(c *fiber.Ctx) error {
	return c.Render("search", nil)
}
func (ts *TemplateServer) RandomBeer(c *fiber.Ctx) error {
	return c.Render("randombeer", nil)
}
func (ts *TemplateServer) AllBeersID(c *fiber.Ctx) error {
	pagenum := c.Params("id")

	return c.Render("allbeers", TemplateArgs{
		Iter: func() []int {
			a := make([]int, 13)
			for i := range a {
				a[i] = i + 1
			}
			return a
		}(),
		PageNum: pagenum,
	})
}
