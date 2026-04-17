package planner

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"

	"github.com/exitwise/backend/internal/db"
)

// GenerateItineraryRequest represents the incoming user request
type GenerateItineraryRequest struct {
	UserID             int    `json:"user_id"`
	StartStationID     int    `json:"start_station_id"`
	EndStationID       int    `json:"end_station_id"`
	Budget             int    `json:"budget"`
	MaxWalkingDistance int    `json:"max_walking_distance"`
	TravelMode         string `json:"travel_mode"`
}

func PlanTripHandler(w http.ResponseWriter, r *http.Request) {
	// Parse incoming request
	var reqBody GenerateItineraryRequest
	if err := json.NewDecoder(r.Body).Decode(&reqBody); err != nil {
		http.Error(w, "Invalid request format", http.StatusBadRequest)
		return
	}

	// Proxy request to the Python AI Microservice
	aiServiceURL := os.Getenv("AI_SERVICE_URL")
	if aiServiceURL == "" {
		aiServiceURL = "http://localhost:8000" // Fallback for local development
	}

	payloadBytes, _ := json.Marshal(reqBody)
	resp, err := http.Post(aiServiceURL+"/plan", "application/json", bytes.NewBuffer(payloadBytes))
	if err != nil {
		http.Error(w, "Failed to contact AI service", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		http.Error(w, "Failed to read AI service response", http.StatusInternalServerError)
		return
	}

	if resp.StatusCode == http.StatusOK && db.Pool != nil {
		// Attempt to persist the itinerary if the DB is running
		var aiData map[string]interface{}
		if err := json.Unmarshal(responseBody, &aiData); err == nil {
			cost, _ := aiData["estimated_total_cost"].(float64)
			recommendedExit, _ := aiData["recommended_exit"].(string)

			insertQuery := `
				INSERT INTO trips (user_id, recommended_exit, estimated_total_cost, travel_mode, itinerary_data)
				VALUES ($1, $2, $3, $4, $5)
			`
			_, dbErr := db.Pool.Exec(context.Background(), insertQuery,
				reqBody.UserID, recommendedExit, int(cost), reqBody.TravelMode, string(responseBody),
			)
			if dbErr != nil {
				fmt.Printf("Warning: failed to persist trip: %v\n", dbErr)
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	w.Write(responseBody)
}
