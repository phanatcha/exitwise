package poi

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/exitwise/backend/internal/db"
)

// POI represents a Point of Interest from the database
type POI struct {
	ID         int     `json:"id"`
	Name       string  `json:"name"`
	Category   string  `json:"category"`
	PriceLevel int     `json:"price_level"`
	Distance   float64 `json:"distance,omitempty"`
}

func GetPOIsHandler(w http.ResponseWriter, r *http.Request) {
	// HTTP handler stub for direct fetch
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"pois": []map[string]string{
			{"name": "Local Cafe", "category": "cafe"},
		},
	})
}

// GetPOIsWithinLimit fetches POIs within a certain distance of an exit, filtered by budget index
func GetPOIsWithinLimit(ctx context.Context, startLat, startLng float64, limitMeters, maxPriceLevel int) ([]POI, error) {
	if db.Pool == nil {
		return nil, fmt.Errorf("database not initialized")
	}

	query := `
		SELECT id, name, category, price_level,
		       ST_Distance(location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as dist
		FROM pois
		WHERE ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
		  AND price_level <= $4
		ORDER BY dist ASC;
	`
	
	rows, err := db.Pool.Query(ctx, query, startLng, startLat, limitMeters, maxPriceLevel)
	if err != nil {
		return nil, fmt.Errorf("failed to query pois: %w", err)
	}
	defer rows.Close()

	var pois []POI
	for rows.Next() {
		var p POI
		if err := rows.Scan(&p.ID, &p.Name, &p.Category, &p.PriceLevel, &p.Distance); err == nil {
			pois = append(pois, p)
		}
	}

	return pois, nil
}

