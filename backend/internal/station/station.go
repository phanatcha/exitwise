package station

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/exitwise/backend/internal/db"
)

// StationExit represents an exit and its computed distance
type StationExit struct {
	ID          int     `json:"id"`
	StationID   int     `json:"station_id"`
	ExitNumber  string  `json:"exit_number"`
	Description string  `json:"description"`
	DistanceMeters float64 `json:"distance_meters,omitempty"`
}

var (
	stationCache sync.Map
	lastCacheTime time.Time
)

func GetStationsHandler(w http.ResponseWriter, r *http.Request) {
	// Dummy cache check - clear cache every hour
	if time.Since(lastCacheTime) > time.Hour {
		// Populate cache from DB
		if db.Pool != nil {
			rows, _ := db.Pool.Query(r.Context(), "SELECT name_en FROM stations")
			if rows != nil {
				defer rows.Close()
				var stations []string
				for rows.Next() {
					var s string
					if err := rows.Scan(&s); err == nil {
						stations = append(stations, s)
					}
				}
				stationCache.Store("all_stations", stations)
				lastCacheTime = time.Now()
			}
		}
	}

	cached, ok := stationCache.Load("all_stations")
	if !ok {
		cached = []string{"BTS Siam", "MRT Silom"} // Fallback
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"stations": cached,
	})
}

// FindOptimalExit queries PostGIS to find the nearest exit to a destination
func FindOptimalExit(ctx context.Context, destLat, destLng float64) (*StationExit, error) {
	if db.Pool == nil {
		return nil, fmt.Errorf("database not initialized")
	}

	query := `
		SELECT id, station_id, exit_number, description, 
		       ST_Distance(location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as dist
		FROM station_exits
		ORDER BY dist ASC
		LIMIT 1;
	`
	// Note: ST_MakePoint takes (longitude, latitude)
	row := db.Pool.QueryRow(ctx, query, destLng, destLat)

	var exit StationExit
	err := row.Scan(&exit.ID, &exit.StationID, &exit.ExitNumber, &exit.Description, &exit.DistanceMeters)
	if err != nil {
		return nil, fmt.Errorf("failed to find optimal exit: %w", err)
	}

	return &exit, nil
}

