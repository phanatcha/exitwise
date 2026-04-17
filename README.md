# ExitWise Monorepo

Welcome to **ExitWise**, a Station-Based Life Helper designed to actively minimize urban walking distances using spatial databases and structural context routing.

This repository holds the entire full-stack monorepo.

## Project Structure

- **/frontend**: React Native / Expo application targeting iOS and Android. Built with NativeWind (Tailwind CSS) and mapped using Mapbox.
- **/backend**: Go / Chi server. Acts as the primary orchestrator, API gateway, and spatial query engine (`PostGIS`).
- **/ai_service**: Python FastAPI microservice dedicated to the "Lazy vs Explorer" trip planning generative algorithms. 
- **/db**: Contains the `init.sql` schema and `seed.sql` for standing up the PostgreSQL/Supabase database.

## For Frontend Developers

Your workspace is entirely inside the `/frontend` directory!
Please check out [frontend/README.md](frontend/README.md) for Expo-specific startup instructions and Mapbox token requirements.

### Quick Start (Frontend)
1. Provide your Mapbox token in `frontend/app.json`.
2. Build your local development client (since Mapbox doesn't work in Expo Go):
   ```bash
   cd frontend
   npm install
   npx expo run:android # (or run:ios)
   ```

## Global Backend Services

If you need to spin up the local backend servers (to test the full database proxy workflow):
1. Copy the `.env.example` inside `backend/` and provide your live `DATABASE_URL` and `GOOGLE_PLACES_API_KEY`.
2. Ensure Docker is running.
3. From the root directory, simply run:
   ```bash
   docker-compose up --build
   ```
   This will simultaneously boot the Go Backend, the Python AI Service, and the local PostGIS container.
