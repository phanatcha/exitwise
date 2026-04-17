-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    absolute_walking_limit INTEGER DEFAULT 1000, -- in meters
    budget_range INTEGER DEFAULT 100, -- in Baht
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Stations Table
CREATE TABLE IF NOT EXISTS stations (
    id SERIAL PRIMARY KEY,
    name_en VARCHAR(100) NOT NULL,
    name_th VARCHAR(100),
    line VARCHAR(50) NOT NULL, -- e.g., BTS Sukhumvit, MRT Blue
    location GEOMETRY(Point, 4326) NOT NULL -- Central location of the station
);
CREATE INDEX IF NOT EXISTS idx_stations_location ON stations USING GIST(location);

-- Station Exits Table
CREATE TABLE IF NOT EXISTS station_exits (
    id SERIAL PRIMARY KEY,
    station_id INTEGER REFERENCES stations(id) ON DELETE CASCADE,
    exit_number VARCHAR(10),
    description TEXT,
    location GEOMETRY(Point, 4326) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_station_exits_location ON station_exits USING GIST(location);

-- POIs (Points of Interest) Table
CREATE TABLE IF NOT EXISTS pois (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50), -- e.g., cafe, restaurant, park
    price_level INTEGER, -- e.g., 1 to 4 roughly matching budget
    location GEOMETRY(Point, 4326) NOT NULL,
    description TEXT
);
CREATE INDEX IF NOT EXISTS idx_pois_location ON pois USING GIST(location);

-- Trips Table (Saved itineraries)
CREATE TABLE IF NOT EXISTS trips (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    start_station_exit_id INTEGER REFERENCES station_exits(id) ON DELETE SET NULL,
    recommended_exit VARCHAR(50),
    estimated_total_cost INTEGER,
    travel_mode VARCHAR(20),
    itinerary_data JSONB NOT NULL, -- To store the full stops/route response
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

