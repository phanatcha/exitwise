import React, { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Mapbox from '@rnmapbox/maps';
import { Locate, Layers, Search } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { BottomNavPill, type NavTab } from '../components/BottomNavPill';
import { colors, fontFamily, fontSize, neuFab, neuRaised } from '../theme';
import { INITIAL_REGION } from '../constants/stations';
import { fetchStations, type Station } from '../services/stations';
import type { MainStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'Home'>;

// Figma node 25:789. Full-screen Mapbox canvas with:
//   - top neumorphic search pill
//   - two floating circular actions on the right
//   - bottom rounded-50 nav pill
//
// We load the MRT Blue Line stations from the Go backend as soon as we mount
// and drop markers. If the backend is unreachable we fall back silently — the
// map alone is still useful.

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [stations, setStations] = useState<Station[]>([]);
  const cameraRef = useRef<Mapbox.Camera>(null);

  useEffect(() => {
    fetchStations()
      .then(setStations)
      .catch(() => setStations([]));
  }, []);

  const visible = stations.filter((s) =>
    !query ? true : s.name.toLowerCase().includes(query.toLowerCase()),
  );

  const handleNav = (tab: NavTab) => {
    if (tab === 'home') return;
    if (tab === 'planner') navigation.navigate('AITripPlanner');
    if (tab === 'saved') navigation.navigate('SaveTrip');
  };

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
          zoomLevel={12.5}
          centerCoordinate={[INITIAL_REGION.longitude, INITIAL_REGION.latitude]}
          animationMode="flyTo"
          animationDuration={600}
        />

        {visible.map((s) => (
          <Mapbox.PointAnnotation
            key={String(s.id)}
            id={`station-${s.id}`}
            coordinate={[s.longitude, s.latitude]}
            onSelected={() =>
              navigation.navigate('AITripPlanner', {
                origin_station_code: s.code,
              })
            }
          >
            <View style={styles.pin}>
              <View style={styles.pinInner} />
            </View>
          </Mapbox.PointAnnotation>
        ))}
      </Mapbox.MapView>

      <SafeAreaView pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <View pointerEvents="box-none" style={styles.top}>
          <View style={[styles.search, neuRaised]}>
            <Search color={colors.textSecondary} size={20} />
            <TextInput
              placeholder="Search stations"
              placeholderTextColor={colors.textMuted}
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
            />
          </View>
        </View>

        <View pointerEvents="box-none" style={styles.fabs}>
          <Pressable
            style={[styles.fab, neuFab]}
            onPress={() => {
              cameraRef.current?.setCamera({
                centerCoordinate: [
                  INITIAL_REGION.longitude,
                  INITIAL_REGION.latitude,
                ],
                zoomLevel: 14,
                animationDuration: 600,
              });
            }}
          >
            <Locate color={colors.primary} size={20} />
          </Pressable>
          <Pressable style={[styles.fab, neuFab]}>
            <Layers color={colors.primary} size={20} />
          </Pressable>
        </View>

        <View pointerEvents="box-none" style={styles.bottom}>
          <BottomNavPill current="home" onSelect={handleNav} />
          <Text style={styles.brand}>ExitWise · MRT Blue Line</Text>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgStart },
  top: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.textPrimary,
    padding: 0,
  },
  fabs: {
    position: 'absolute',
    right: 16,
    top: '35%',
    gap: 12,
  },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
    gap: 8,
  },
  brand: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  pin: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
});
