// For local development on an emulator, localhost usually won't work to reach the host.
// Update this to your local Wi-Fi IP address or 10.0.2.2 (Android Emulator loopback)
const BASE_URL = "http://localhost:8080";

export const fetchStations = async () => {
  try {
    const res = await fetch(`${BASE_URL}/stations`);
    return await res.json();
  } catch (err) {
    console.error("API error fetching stations", err);
    return null;
  }
};

export const generateItinerary = async (payload: any) => {
  try {
    const res = await fetch(`${BASE_URL}/generate-itinerary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err) {
    console.error("API error generating itinerary", err);
    return null;
  }
};
