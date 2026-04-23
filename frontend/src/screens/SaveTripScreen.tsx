import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pencil, MapPin } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { GradientBg } from '../components/GradientBg';
import { NeuCard } from '../components/NeuCard';
import { BackButton } from '../components/BackButton';
import { BottomNavPill, type NavTab } from '../components/BottomNavPill';
import { colors, fontFamily, fontSize } from '../theme';
import { listTrips, type Trip } from '../services/trips';
import type { MainStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'SaveTrip'>;

// Figma node 27:793. Teal-wash curved header + list of trip cards.

const MOCK: Trip[] = [
  {
    id: '1',
    title: 'Samyan Trip',
    walking_limit_m: 500,
    budget_baht: 500,
    cover_image_url: null,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Bang Wa Melon',
    walking_limit_m: 500,
    budget_baht: 500,
    cover_image_url: null,
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Khlong Bang Luang',
    walking_limit_m: 500,
    budget_baht: 500,
    cover_image_url: null,
    created_at: new Date().toISOString(),
  },
];

export const SaveTripScreen: React.FC<Props> = ({ navigation }) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    listTrips()
      .then((t) => {
        setTrips(t.length ? t : MOCK);
        setLoaded(true);
      })
      .catch(() => {
        setTrips(MOCK);
        setLoaded(true);
      });
  }, []);

  const handleNav = (tab: NavTab) => {
    if (tab === 'saved') return;
    if (tab === 'home') navigation.navigate('Home');
    if (tab === 'planner') navigation.navigate('AITripPlanner');
  };

  return (
    <GradientBg>
      <View style={styles.headerWash}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <BackButton onPress={() => navigation.goBack()} />
            <Text style={styles.headerTitle}>Save Trip Plan</Text>
            <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {!loaded ? null : trips.length === 0 ? (
          <NeuCard radius={24} style={styles.empty}>
            <Text style={styles.emptyTitle}>No saved trips yet</Text>
            <Text style={styles.emptyHint}>
              Generate a plan from the map, then tap Save Plan.
            </Text>
          </NeuCard>
        ) : (
          trips.map((trip) => (
            <NeuCard key={trip.id} radius={20} style={styles.tripCard}>
              <View style={styles.thumb}>
                <MapPin color={colors.primary} size={28} />
              </View>
              <View style={styles.tripBody}>
                <Text style={styles.tripTitle}>{trip.title}</Text>
                <Text style={styles.tripMeta}>
                  Walking Limit {trip.walking_limit_m} m
                </Text>
                <Text style={styles.tripMeta}>
                  Budget {trip.budget_baht ?? '—'} Baht
                </Text>
              </View>
              <Pressable style={styles.edit} hitSlop={8}>
                <Pencil color={colors.primary} size={18} />
              </Pressable>
            </NeuCard>
          ))
        )}
      </ScrollView>

      <View style={styles.navWrap}>
        <BottomNavPill current="saved" onSelect={handleNav} />
      </View>
    </GradientBg>
  );
};

const styles = StyleSheet.create({
  headerWash: {
    backgroundColor: colors.tealWash,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    paddingBottom: 18,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.primaryDeep,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 120,
    gap: 16,
  },
  tripCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 14,
  },
  thumb: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: 'rgba(63, 81, 181, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripBody: {
    flex: 1,
  },
  tripTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    color: colors.primaryDeep,
    marginBottom: 6,
  },
  tripMeta: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  edit: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    padding: 24,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    color: colors.primaryDeep,
  },
  emptyHint: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  navWrap: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
  },
});
