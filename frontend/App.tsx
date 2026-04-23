import './global.css';
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Mapbox from '@rnmapbox/maps';

import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/lib/auth';
import { useOutfitFonts } from './src/lib/fonts';
import { colors } from './src/theme';

// Mapbox needs its PUBLIC token (pk.*) before any <MapView /> mounts.
// The secret download token in app.config.ts is ONLY for build-time SDK downloads.
const MAPBOX_PUBLIC_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
if (MAPBOX_PUBLIC_TOKEN) {
  Mapbox.setAccessToken(MAPBOX_PUBLIC_TOKEN);
} else if (__DEV__) {
  // eslint-disable-next-line no-console
  console.warn(
    '[ExitWise] EXPO_PUBLIC_MAPBOX_TOKEN is not set. Map views will fail to load.',
  );
}

export default function App() {
  // Wait for Outfit fonts before mounting the tree; otherwise text flashes
  // in the system font and then reflows — really jarring on the landing screen.
  const [fontsLoaded] = useOutfitFonts();

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bgStart,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
