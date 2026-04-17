package services

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

// PlaceDetails represents relevant data from Google Places
type PlaceDetails struct {
	Name         string  `json:"name"`
	Rating       float64 `json:"rating"`
	PriceLevel   int     `json:"price_level"`
	OpeningHours struct {
		OpenNow bool `json:"open_now"`
	} `json:"opening_hours"`
}

// FetchPOIDetails interacts with the Google Places API to retrieve POI metadata
func FetchPOIDetails(placeID string) (*PlaceDetails, error) {
	apiKey := os.Getenv("GOOGLE_PLACES_API_KEY")
	if apiKey == "" {
		// Mock response if no key is present (e.g. local dev)
		return &PlaceDetails{Name: "Mock Place", Rating: 4.8, PriceLevel: 2}, nil
	}

	url := fmt.Sprintf("https://maps.googleapis.com/maps/api/place/details/json?place_id=%s&fields=name,rating,price_level,opening_hours&key=%s", placeID, apiKey)
	
	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to call Google Places: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("bad status from Google Places: %d", resp.StatusCode)
	}

	var result struct {
		Result PlaceDetails `json:"result"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode places response: %w", err)
	}

	return &result.Result, nil
}

