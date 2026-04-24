import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Mapbox from '@rnmapbox/maps';
import {
  ArrowRight,
  Compass,
  DoorOpen,
  Locate,
  X,
} from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { NeuCard } from '../components/NeuCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, fontFamily, fontSize, neuFab } from '../theme';
import {
  getBackendDirections,
  getMapboxRouteGeometry,
  type BackendDirections,
  type RouteGeometry,
} from '../services/directions';
import type { MainStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'Navigation'>;

// The ONLY screen that loads the Mapbox MapView. Draws the walking route
// between the two selected stations, shows the bottom card with origin →
// destination + recommended exit from the backend.
export const NavigationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { start, destination } = route.params;
  const cameraRef = useRef<Mapbox.Camera>(null);

  const [geometry, setGeometry] = useState<RouteGeometry | null>(null);
  const [directions, setDirections] = useState<BackendDirections | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const from = { latitude: start.latitude, longitude: start.longitude };
      const to = {
        latitude: destination.latitude,
        longitude: destination.longitude,
      };
      const [g, d] = await Promise.all([
        getMapboxRouteGeometry(from, to),
        getBackendDirections(from, to),
      ]);
      if (cancelled) return;
      setGeometry(g);
      setDirections(d);
      setLoading(false);

      // Frame both endpoints.
      const padding = { paddingLeft: 60, paddingRight: 60, paddingTop: 120, paddingBottom: 340 };
      cameraRef.current?.fitBounds(
        [
          Math.min(start.longitude, destination.longitude),
          Math.min(start.latitude, destination.latitude),
        ],
        [
          Math.max(start.longitude, destination.longitude),
          Math.max(start.latitude, destination.latitude),
        ],
        [padding.paddingTop, padding.paddingRight, padding.paddingBottom, padding.paddingLeft],
        800,
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [start.id, destination.id]);

  const recenter = () => {
    cameraRef.current?.fitBounds(
      [
        Math.min(start.longitude, destination.longitude),
        Math.min(start.latitude, destination.latitude),
      ],
      [
        Math.max(start.longitude, destination.longitude),
        Math.max(start.latitude, destination.latitude),
      ],
      [120, 60, 340, 60],
      600,
    );
  };

  const routeGeoJson = geometry
    ? {
        type: 'FeatureCollection' as const,
        features: [
          {
            type: 'Feature' as const,
            properties: {},
            geometry: {
              type: 'LineString' as const,
              coordinates: geometry.coordinates,
            },
          },
        ],
      }
    : null;

  // Fallback straight line so the map is never empty even if Mapbox Directions
  // fails (e.g. offline, bad pk token).
  const fallbackGeoJson = {
    type: 'FeatureCollection' as const,
    features: [
      {
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'LineString' as const,
          coordinates: [
            [start.longitude, start.latitude],
            [destination.longitude, destination.latitude],
          ],
        },
      },
    ],
  };

  const etaMin = directions
    ? Math.max(1, Math.round(directions.duration_seconds / 60))
    : geometry
    ? Math.max(1, Math.round(geometry.duration_s / 60))
    : null;

  return (
    <View style={styles.root}>
      <Mapbox.MapView
        style={StyleSheet.absoluteFillObject}
        styleURL={Mapbox.StyleURL.Light}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={false}
      >
        <Mapbox.Camera
          ref={cameraRef}
          zoomLevel={13}
          centerCoordinate={[start.longitude, start.latitude]}
          animationMode="flyTo"
          animationDuration={600}
        />

        <Mapbox.ShapeSource id="route" shape={routeGeoJson ?? fallbackGeoJson}>
          <Mapbox.LineLayer
            id="routeLine"
            style={{
              lineColor: colors.primary,
              lineWidth: 5,
              lineOpacity: 0.9,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        </Mapbox.ShapeSource>

        <Mapbox.PointAnnotation
          id="start-pin"
          coordinate={[start.longitude, start.latitude]}
        >
          <View style={[styles.pin, styles.pinStart]}>
            <View style={styles.pinStartInner} />
          </View>
        </Mapbox.PointAnnotation>

        <Mapbox.PointAnnotation
          id="end-pin"
          coordinate={[destination.longitude, destination.latitude]}
        >
          <View style={[styles.pin, styles.pinEnd]}>
            <View style={styles.pinEndInner} />
          </View>
        </Mapbox.PointAnnotation>
      </Mapbox.MapView>

      <SafeAreaView style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <View pointerEvents="box-none" style={styles.topBar}>
          <Pressable
            style={[styles.iconBtn, neuFab]}
            onPress={() => navigation.goBack()}
          >
            <X color={colors.primary} size={20} />
          </Pressable>
          <View style={[styles.navPill, neuFab]}>
            <Compass color={colors.primary} size={16} />
            <Text style={styles.navPillText}>Navigating</Text>
          </View>
          <Pressable style={[styles.iconBtn, neuFab]} onPress={recenter}>
            <Locate color={colors.primary} size={20} />
          </Pressable>
        </View>

        <View pointerEvents="box-none" style={styles.bottomSheet}>
          <NeuCard radius={30} style={styles.sheetCard}>
            <View style={styles.sheetRow}>
              <View style={[styles.sheetDot, styles.sheetDotStart]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetName}>{start.name}</Text>
                <Text style={styles.sheetSub}>Start station</Text>
              </View>
            </View>

            <View style={styles.sheetStats}>
              {loading ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <>
                  <Text style={styles.sheetEta}>
                    ETA: {etaMin != null ? `${etaMin} min` : '—'}
                  </Text>
                  {directions?.exit_instruction ? (
                    <View style={styles.exitRow}>
                      <DoorOpen color={colors.accentPink} size={14} />
                      <Text style={styles.exitText}>
                        {directions.exit_instruction}
                      </Text>
                    </View>
                  ) : null}
                </>
              )}
            </View>

            <View style={styles.sheetRow}>
              <View style={[styles.sheetDot, styles.sheetDotEnd]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetName}>{destination.name}</Text>
                <Text style={styles.sheetSub}>Destination</Text>
              </View>
              <View style={styles.directionPill}>
                <Text style={styles.directionPillText}>Direction</Text>
                <ArrowRight color={colors.surface} size={14} />
              </View>
            </View>

            <View style={{ height: 4 }} />
            <PrimaryButton
              label="Finish & Save Trip"
              variant="pink"
              onPress={() => navigation.navigate('SaveTrip')}
            />
          </NeuCard>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgStart },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  navPillText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.primaryDeep,
  },
  pin: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    backgroundColor: colors.surface,
  },
  pinStart: { borderColor: colors.primary },
  pinStartInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  pinEnd: {
    borderColor: colors.accentPink,
    backgroundColor: colors.accentPink,
  },
  pinEndInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surface,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  sheetCard: {
    padding: 18,
    gap: 14,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sheetDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
  },
  sheetDotStart: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  sheetDotEnd: {
    borderColor: colors.accentPink,
    backgroundColor: colors.accentPink,
  },
  sheetName: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    color: colors.primaryDeep,
  },
  sheetSub: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  sheetStats: {
    marginLeft: 26,
    gap: 4,
  },
  sheetEta: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  exitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  exitText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.accentPink,
  },
  directionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accentPink,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  directionPillText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xs,
    color: colors.surface,
  },
});
