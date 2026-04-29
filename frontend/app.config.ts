import type { ExpoConfig } from 'expo/config';

// ---------------------------------------------------------------------------
// Build-time secrets
// ---------------------------------------------------------------------------
// MAPBOX_DOWNLOAD_TOKEN — a Mapbox *secret* token with DOWNLOADS:READ scope,
// used by Gradle during prebuild/build to fetch the native SDK. This value is
// NEVER bundled into the JS that ships on-device; it only touches the native
// build pipeline (or EAS build servers).
//
// If it's missing at the moment a native build is happening, fail loudly so we
// don't end up shipping a broken APK. During plain `expo start` (JS-only dev
// server) we just warn, since the token isn't actually needed for Metro.
// ---------------------------------------------------------------------------
const MAPBOX_DOWNLOAD_TOKEN = process.env.MAPBOX_DOWNLOAD_TOKEN;

const isNativeBuildStep =
  process.env.EAS_BUILD === 'true' ||
  process.argv.some(
    (a: string) =>
      a.includes('prebuild') ||
      a.includes('run:android') ||
      a.includes('run:ios'),
  );

if (!MAPBOX_DOWNLOAD_TOKEN) {
  const msg =
    'MAPBOX_DOWNLOAD_TOKEN is not set. Put a Mapbox secret (sk.*) token ' +
    'with DOWNLOADS:READ scope in frontend/.env or EAS secrets.';
  if (isNativeBuildStep) {
    throw new Error(msg);
  } else {
    // eslint-disable-next-line no-console
    console.warn(`[ExitWise] ${msg}`);
  }
}

const config: ExpoConfig = {
  name: 'frontend',
  slug: 'frontend',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    permissions: [
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.ACCESS_FINE_LOCATION',
    ],
    package: 'com.anonymous.frontend',
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    [
      '@rnmapbox/maps',
      { RNMapboxMapsDownloadToken: MAPBOX_DOWNLOAD_TOKEN ?? '' },
    ],
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'Allow $(PRODUCT_NAME) to use your location for walking navigation.',
      },
    ],
  ],
};

export default config;
