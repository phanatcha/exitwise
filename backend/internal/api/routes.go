package api

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"github.com/exitwise/backend/internal/poi"
	"github.com/exitwise/backend/internal/station"
	"github.com/exitwise/backend/internal/planner"
)

func SetupRoutes() *chi.Mux {
	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("ok"))
	})

	r.Get("/stations", station.GetStationsHandler)
	r.Get("/pois", poi.GetPOIsHandler)
	r.Post("/generate-itinerary", planner.PlanTripHandler)

	return r
}
