package services

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

// Route represents Mapbox directions response
type Route struct {
	Distance float64 `json:"distance"` // distance in meters
	Duration float64 `json:"duration"` // estimated duration in seconds
}

// GetWalkingRoute interacts with the Mapbox Navigation SDK API to calculate exact walking paths
func GetWalkingRoute(startLat, startLng, endLat, endLng float64) (*Route, error) {
	accessToken := os.Getenv("MAPBOX_ACCESS_TOKEN")
	if accessToken == "" {
		// Mock response if no token is present
		return &Route{Distance: 450.0, Duration: 360.0}, nil
	}

	url := fmt.Sprintf("https://api.mapbox.com/directions/v5/mapbox/walking/%f,%f;%f,%f?access_token=%s", startLng, startLat, endLng, endLat, accessToken)

	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to call Mapbox API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("bad status from Mapbox API: %d", resp.StatusCode)
	}

	var result struct {
		Routes []Route `json:"routes"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode mapbox response: %w", err)
	}

	if len(result.Routes) > 0 {
		return &result.Routes[0], nil
	}
	return nil, fmt.Errorf("no route found")
}
