# ExitWise

A "**Station-Based Life Helper**" designed to minimize urban walking.

## The Problem
Bangkok heat is brutal. Being told your destination is "only 300m from the station" is great—unless it's actually 300m from Exit 1, but you took Exit 4. 

## The Solution
ExitWise calculates the absolute best exit for your destination, filtering PoIs strictly by your walking threshold and budget.

### Getting Started (Development)

This Expo app relies on **Mapbox SDK**, meaning it cannot run in the default Expo Go app. 
You must build a custom development client.

1. Ensure Android Studio + Emulator is ready.
2. Ensure you have your `RNMapboxMapsDownloadToken` added to `app.json`.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Build and start your local Dev Client:
   ```bash
   npx expo run:android
   ```
   *(Or `npx expo run:ios` if you are on a Mac with Xcode open).*

### Tech Stack
- Expo / React Native
- NativeWind (Tailwind CSS)
- Mapbox SDK for React Native
- Lucide React Native Icons
