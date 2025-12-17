package main

import (
	"log"
	"net/http"

	"sajudating_api/api/admgql"
	"sajudating_api/api/admgql/admgql_generated"
	"sajudating_api/api/config"
	"sajudating_api/api/dao"
	"sajudating_api/api/middleware"
	"sajudating_api/api/routes"
	"sajudating_api/api/service"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/go-chi/chi/v5"
)

func main() {
	if err := config.LoadConfig(); err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	if err := dao.InitDatabase(); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer dao.CloseDatabase()

	// Chi Router
	r := chi.NewRouter()

	r.Use(middleware.CORSMiddleware)

	// admin management graphql
	gqlAdmService := handler.NewDefaultServer(
		admgql_generated.NewExecutableSchema(admgql_generated.Config{Resolvers: &admgql.Resolver{}}),
	)
	r.Post("/api/admgql", func(w http.ResponseWriter, r *http.Request) {
		gqlAdmService.ServeHTTP(w, r)
	})
	r.Get("/api/admimg/*", service.GetAdminImage)
	log.Println("Initializing admin management graphql")

	// init user api route
	routes.InitRoutes()
	r.Route("/api/saju_profile", routes.RouteSajuProfile)

	port := config.AppConfig.Server.Port
	log.Fatal(http.ListenAndServe(":"+port, r))
}
