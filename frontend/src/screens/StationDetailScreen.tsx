import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  Polygon,
  Stop,
  Rect,
  G,
} from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, MapPin, Star } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { NeuCard } from '../components/NeuCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { BackButton } from '../components/BackButton';
import { BottomNavPill, type NavTab } from '../components/BottomNavPill';
import { colors, fontFamily, fontSize } from '../theme';
import type { MainStackParamList } from '../navigation/types';
import { fetchNearbyPois, type POI } from '../services/pois';

type Props = NativeStackScreenProps<MainStackParamList, 'StationDetail'>;

// Figma node 27:791 — "Home (Map Layer) (Select Building)".
//
// Because we picked the "static 3D-looking illustration per station" option
// instead of bringing in three.js / Mapbox extrusions, the top half of the
// screen is a lightweight SVG scene: isometric blocks for the neighbourhood,
// a highlighted building in the accent pink, and the station pin.
export const StationDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { station, pickMode, start } = route.params;
  const [featured, setFeatured] = useState<POI | null>(null);
  const [loadingPoi, setLoadingPoi] = useState(true);

  useEffect(() => {
    setLoadingPoi(true);
    fetchNearbyPois({
      lat: station.latitude,
      lng: station.longitude,
      radius: 400,
    })
      .then((pois) => setFeatured(pois[0] ?? null))
      .catch(() => setFeatured(null))
      .finally(() => setLoadingPoi(false));
  }, [station.id]);

  // Simple deterministic "rating" placeholder based on the station ID so
  // different stations feel different while the POI backend fills in.
  const fallbackRating = useMemo(() => {
    const r = 4.2 + ((station.id * 17) % 9) / 10;
    return Math.min(4.9, Number(r.toFixed(1)));
  }, [station.id]);

  const rating = featured?.rating ?? fallbackRating;
  const category = featured?.category ?? 'Station exit';
  const title = featured?.name ?? station.name;
  const subtitle = featured?.name ? station.name : station.name_local ?? '';

  const handlePrimary = () => {
    if (pickMode === 'start') {
      navigation.navigate('Home', {
        pickMode: 'destination',
        start: station,
      });
    } else if (pickMode === 'destination' && start) {
      navigation.navigate('TripConfirm', {
        start,
        destination: station,
      });
    }
  };

  const handlePlanAI = () => {
    navigation.navigate('AITripPlanner', { start: station });
  };

  const handleNav = (tab: NavTab) => {
    if (tab === 'home') navigation.navigate('Home');
    if (tab === 'planner') navigation.navigate('AITripPlanner');
    if (tab === 'saved') navigation.navigate('SaveTrip');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.illo}>
        <IsometricStation label={station.name} />
        <View style={styles.headerOverlay}>
          <BackButton onPress={() => navigation.goBack()} />
          <View style={styles.pickBadge}>
            <Text style={styles.pickBadgeText}>
              {pickMode === 'start'
                ? 'Pick start station'
                : 'Pick destination'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <NeuCard radius={24} style={styles.card}>
          <View style={styles.photoWrap}>
            {featured?.image_url ? (
              <Image
                source={{ uri: featured.image_url }}
                style={styles.photo}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.photo, styles.photoFallback]}>
                <MapPin color={colors.primary} size={28} />
                <Text style={styles.photoFallbackText}>
                  {station.name}
                </Text>
              </View>
            )}
            <View style={styles.photoCategory}>
              <Text style={styles.photoCategoryText}>{category}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaLeft}>
              <Clock color={colors.textSecondary} size={14} />
              <Text style={styles.metaText}>10 AM–10 PM </Text>
              <Text style={styles.metaOpen}>Open</Text>
            </View>
            <Text style={styles.metaEta}>ETA: 1 hour 12 minutes</Text>
          </View>

          <Text style={styles.stationTitle}>{title}</Text>
          {subtitle ? (
            <Text style={styles.stationSubtitle}>{subtitle}</Text>
          ) : null}

          <View style={styles.ratingRow}>
            <Star
              color={'#F4B400'}
              fill={'#F4B400'}
              size={16}
            />
            <Text style={styles.ratingText}>
              {loadingPoi ? '—' : rating.toFixed(1)}
            </Text>
            {loadingPoi ? (
              <ActivityIndicator size="small" color={colors.textSecondary} />
            ) : (
              <Text style={styles.ratingCount}>(13,625)</Text>
            )}
          </View>

          <View style={styles.dotsRow}>
            {[0, 1, 2, 3, 4].map((i) => (
              <View
                key={i}
                style={[styles.dot, i === 0 && styles.dotActive]}
              />
            ))}
          </View>

          <View style={styles.actions}>
            <PrimaryButton
              label={
                pickMode === 'start'
                  ? 'Set as Start'
                  : 'Set as Destination'
              }
              onPress={handlePrimary}
            />
            <SecondaryButton
              label="Plan an AI trip from here"
              variant="outline"
              onPress={handlePlanAI}
            />
          </View>
        </NeuCard>
      </ScrollView>

      <View style={styles.bottom}>
        <BottomNavPill current="home" onSelect={handleNav} />
      </View>
    </SafeAreaView>
  );
};

// --- Illustrated station scene --------------------------------------------
// Cheap "3D" effect built from tilted rectangles + a highlight block. Swap
// this for real PNGs per station when assets are ready.

const IsometricStation: React.FC<{ label: string }> = ({ label }) => (
  <View style={styles.svgWrap}>
    <Svg viewBox="0 0 402 420" width="100%" height="100%">
      <Defs>
        <SvgLinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#E8EAF6" />
          <Stop offset="1" stopColor="#E0FFF9" />
        </SvgLinearGradient>
        <SvgLinearGradient id="highlight" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#F9A1CB" stopOpacity="0.9" />
          <Stop offset="1" stopColor="#F15BB5" stopOpacity="0.9" />
        </SvgLinearGradient>
      </Defs>

      <Rect x="0" y="0" width="402" height="420" fill="url(#sky)" />

      {/* Road diagonal */}
      <Polygon points="0,360 120,80 160,80 40,360" fill="#F1F3F9" />

      {/* Block 1 (background) */}
      <G opacity="0.85">
        <Polygon points="70,260 150,220 150,300 70,340" fill="#E9ECF5" />
        <Polygon points="150,220 230,260 230,340 150,300" fill="#D9DEEC" />
        <Polygon points="70,260 150,220 230,260 150,300" fill="#FFFFFF" />
      </G>

      {/* Block 2 (background) */}
      <G opacity="0.85">
        <Polygon points="250,200 330,160 330,240 250,280" fill="#ECEEF6" />
        <Polygon points="330,160 402,200 402,280 330,240" fill="#D9DEEC" />
        <Polygon points="250,200 330,160 402,200 330,240" fill="#FFFFFF" />
      </G>

      {/* Highlighted building (pink) */}
      <G>
        <Polygon
          points="150,180 260,120 260,250 150,310"
          fill="url(#highlight)"
        />
        <Polygon
          points="260,120 330,150 330,280 260,250"
          fill="#D8468D"
          opacity="0.85"
        />
        <Polygon
          points="150,180 260,120 330,150 220,210"
          fill="#FFC5DE"
        />
      </G>

      {/* Station pin on the highlighted roof */}
      <G>
        <Polygon
          points="210,205 220,195 230,205 220,235"
          fill="#F15BB5"
        />
        <Rect x="212" y="188" width="16" height="16" rx="8" fill="#F15BB5" />
        <Rect x="217" y="193" width="6" height="6" rx="3" fill="#FFFFFF" />
      </G>
    </Svg>
    <View style={styles.labelPill}>
      <MapPin color={colors.accentPink} size={12} />
      <Text style={styles.labelPillText}>{label}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgStart },
  illo: {
    height: 360,
    position: 'relative',
  },
  svgWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  headerOverlay: {
    position: 'absolute',
    top: 8,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickBadge: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pickBadgeText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.primaryDeep,
  },
  labelPill: {
    position: 'absolute',
    left: 180,
    top: 230,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 4,
  },
  labelPillText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xs,
    color: colors.accentPink,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 140,
  },
  card: {
    padding: 18,
    gap: 12,
  },
  photoWrap: {
    position: 'relative',
    borderRadius: 18,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: 170,
    borderRadius: 18,
    backgroundColor: '#DCE0EC',
  },
  photoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  photoFallbackText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    color: colors.primaryDeep,
  },
  photoCategory: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    backgroundColor: 'rgba(18, 16, 42, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  photoCategoryText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.textInverse,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  metaOpen: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.success,
  },
  metaEta: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  stationTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    color: colors.primaryDeep,
  },
  stationSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: -4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.primaryDeep,
  },
  ratingCount: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textMuted,
    opacity: 0.35,
  },
  dotActive: {
    backgroundColor: colors.primary,
    opacity: 1,
    width: 18,
  },
  actions: {
    gap: 10,
    marginTop: 8,
  },
  bottom: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
});
