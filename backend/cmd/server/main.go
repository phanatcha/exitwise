package main

import (
	"log"
	"net/http"

	"github.com/exitwise/backend/internal/api"
)

func main() {
	router := api.SetupRoutes()

	port := "8080"
	log.Printf("Starting server on port %s...", port)
	
	if err := http.ListenAndServe(":"+port, router); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
