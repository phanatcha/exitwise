# ExitWise: Station-Based Life Helper

**ExitWise** is a full-stack, AI-powered "Station-Based Life Helper" application tightly designed to actively minimize urban walking distances using spatial databases and structural context routing. Specifically curated for systems like the MRT in Bangkok, Thailand, the application simplifies commuting, navigating transit hubs, and discovering nearby locations.

## Core Features & Functionality

- **Context-Aware Spatial Routing:** Instead of guiding users to a generic station center, ExitWise calculates routes specifically based on station exits, significantly optimizing real-world walking paths in dense urban areas.
- **AI-Powered Itinerary Generation ("Lazy" vs. "Explorer"):**
  - **Lazy Mode:** Provides the absolute shortest walk to exactly ONE highly-rated location (such as a nearby café or restaurant), perfect for users who want minimal physical effort.
  - **Explorer Mode:** Curates a comprehensive 2-3 stop walking tour (e.g., eat -> shop -> sightsee). It utilizes more walking time to maximize value but operates strictly within user-defined budgets and walking constraints.
- **Constraint Matching:** Dynamically grabs real-world Points of Interest (POIs) within a tight radius limit (e.g., 1km) and filters them based on user variables such as max walking distance and budget.

## Architecture and Technology Stack

The project is structured as a full-stack monorepo featuring loosely coupled microservices:

### 1. Mobile Frontend (`/frontend`)
- **Framework:** React Native using the Expo framework, targeting both iOS and Android.
- **Styling:** NativeWind (Tailwind CSS tailored for React Native).
- **Mapping:** Integrated with **Mapbox** (`@rnmapbox/maps`) to provide advanced map visualization, routing, and specialized map layers.

### 2. Primary API Backend (`/backend`)
- **Technology:** Developed in Go using the Chi router.
- **Role:** Acts as the primary orchestrator, API gateway, and spatial query engine. It handles standard endpoints for station metadata and connects directly to the core POI database.

### 3. AI Service (`/ai_service`)
- **Technology:** Python using the FastAPI framework.
- **Role:** A dedicated microservice handling generative operations.
- **LLM Integration:** Powered by the Google Gemini API (`gemini-1.5-flash`). It parses constraints alongside physical database POI data to produce strictly formatted JSON itineraries. The service also features graceful fallback logic if the LLM API is unavailable.

### 4. Database Infrastructure (`/db`)
- **Technology:** PostgreSQL enriched with the **PostGIS** extension.
- **Role:** Handles robust geometric and spatial queries. Seeded locally during development and optimized for geographic proximity algorithms.

## Developer Workflow

To ensure seamless coordination between services, the project heavily employs containerization. Using `docker-compose.yml`, a developer can instantly spin up the Go Backend, the Python AI Service, and the PostGIS database container alongside each other. The frontend is run locally utilizing the Expo CLI workflow.
