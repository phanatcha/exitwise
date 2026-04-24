import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, Clock, DoorOpen, MapPin, Wallet } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { BackButton } from '../components/BackButton';
import { NeuCard } from '../components/NeuCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { BottomNavPill, type NavTab } from '../components/BottomNavPill';
import { colors, fontFamily, fontSize } from '../theme';
import { fetchStations, type Station } from '../services/stations';
import { generateItinerary, type PlannerResult } from '../services/planner';
import { getOnboarding } from '../lib/onboarding';
import type { MainStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'TripConfirm'>;

// Inclusive list of blue-line stations between `start` and `destination` —
// renders as a connected dot chain so the user sees where they're going before
// Mapbox takes over. We fetch the full list so we can draw stations in between
// even if our initial Home screen only cached a subset.
export const TripConfirmScreen: React.FC<Props> = ({ navigation, route }) => {
  const { start, destination } = route.params;
  const [plan, setPlan] = useState<PlannerResult | null>(null);
  const [allStations, setAllStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const prefs = await getOnboarding();
      try {
        const [stations, planResult] = await Promise.all([
          fetchStations().catch(() => [] as Station[]),
          generateItinerary({
            start_station_id: start.id,
            end_station_id: destination.id,
            budget: prefs.budget_baht ?? 500,
            max_walking_distance: prefs.walking_limit_m ?? 500,
            travel_mode: 'walking',
          }).catch(() => null),
        ]);
        if (cancelled) return;
        setAllStations(stations);
        setPlan(planResult);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [start.id, destination.id]);

  // Build the in-between chain (inclusive).
  const chain = React.useMemo(() => {
    if (allStations.length === 0) return [start, destination];
    const line = allStations
      .filter((s) => s.line_code === start.line_code)
      .sort((a, b) => a.id - b.id);
    const si = line.findIndex((s) => s.id === start.id);
    const di = line.findIndex((s) => s.id === destination.id);
    if (si === -1 || di === -1) return [start, destination];
    const [lo, hi] = si < di ? [si, di] : [di, si];
    const slice = line.slice(lo, hi + 1);
    return si <= di ? slice : slice.reverse();
  }, [allStations, start, destination]);

  const handleStart = () => {
    navigation.navigate('Navigation', { start, destination });
  };

  const handleAI = () => {
    navigation.navigate('AITripPlanner', { start, destination });
  };

  const handleNav = (tab: NavTab) => {
    if (tab === 'home') navigation.navigate('Home');
    if (tab === 'planner') navigation.navigate('AITripPlanner');
    if (tab === 'saved') navigation.navigate('SaveTrip');
    if (tab === 'profile') navigation.navigate('Profile');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Trip Confirmation</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <NeuCard radius={24} style={styles.endpointsCard}>
          <View style={styles.endpoint}>
            <View style={[styles.endpointDot, styles.endpointDotStart]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.endpointLabel}>From</Text>
              <Text style={styles.endpointName}>{start.name}</Text>
            </View>
          </View>
          <View style={styles.arrowWrap}>
            <ArrowRight color={colors.primary} size={18} />
          </View>
          <View style={styles.endpoint}>
            <View style={[styles.endpointDot, styles.endpointDotEnd]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.endpointLabel}>To</Text>
              <Text style={styles.endpointName}>{destination.name}</Text>
            </View>
          </View>
        </NeuCard>

        <Text style={styles.sectionLabel}>Blue Line route</Text>
        <NeuCard radius={24} style={styles.chainCard}>
          {chain.map((s, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === chain.length - 1;
            const isEndpoint = isFirst || isLast;
            return (
              <View key={s.id} style={styles.chainRow}>
                <View style={styles.chainRail}>
                  <View
                    style={[styles.railSeg, isFirst && { opacity: 0 }]}
                  />
                  <View
                    style={[
                      styles.chainDot,
                      isEndpoint && styles.chainDotEndpoint,
                    ]}
                  />
                  <View
                    style={[styles.railSeg, isLast && { opacity: 0 }]}
                  />
                </View>
                <Text
                  style={[
                    styles.chainName,
                    isEndpoint && styles.chainNameEndpoint,
                  ]}
                >
                  {s.name}
                </Text>
                {isEndpoint ? (
                  <Text style={styles.chainTag}>
                    {isFirst ? 'Start' : 'End'}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </NeuCard>

        <NeuCard radius={24} style={styles.statsCard}>
          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.loadingText}>
                Asking the AI for the best route…
              </Text>
            </View>
          ) : plan ? (
            <View style={styles.statGrid}>
              <Stat
                Icon={Clock}
                label="ETA"
                value={`${plan.estimated_duration_min} min`}
              />
              <Stat
                Icon={MapPin}
                label="Distance"
                value={`${(plan.total_distance_m / 1000).toFixed(1)} km`}
              />
              <Stat
                Icon={Wallet}
                label="Budget"
                value={plan.estimated_total_cost != null
                  ? `฿${plan.estimated_total_cost}`
                  : '—'}
              />
              <Stat
                Icon={DoorOpen}
                label="Best exit"
                value={plan.recommended_exit ?? 'Exit 1'}
              />
            </View>
          ) : (
            <View style={styles.statGrid}>
              <Stat Icon={Clock} label="ETA" value="— min" />
              <Stat Icon={MapPin} label="Distance" value="— km" />
              <Stat Icon={Wallet} label="Budget" value="—" />
              <Stat Icon={DoorOpen} label="Best exit" value="—" />
            </View>
          )}
        </NeuCard>

        <View style={styles.actions}>
          <PrimaryButton label="Start Navigation" onPress={handleStart} />
          <SecondaryButton
            label="Explore with AI first"
            variant="outline"
            onPress={handleAI}
          />
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        <BottomNavPill current="home" onSelect={handleNav} />
      </View>
    </SafeAreaView>
  );
};

const Stat: React.FC<{
  Icon: React.ComponentType<any>;
  label: string;
  value: string;
}> = ({ Icon, label, value }) => (
  <View style={styles.stat}>
    <View style={styles.statIcon}>
      <Icon color={colors.primary} size={18} />
    </View>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgStart },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.primaryDeep,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 140,
    gap: 16,
  },
  endpointsCard: {
    padding: 18,
  },
  endpoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  endpointDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
  },
  endpointDotStart: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  endpointDotEnd: {
    borderColor: colors.accentPink,
    backgroundColor: colors.accentPink,
  },
  endpointLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  endpointName: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    color: colors.primaryDeep,
  },
  arrowWrap: {
    alignItems: 'center',
    paddingLeft: 5,
  },
  sectionLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  chainCard: {
    padding: 18,
    gap: 2,
  },
  chainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  chainRail: {
    width: 22,
    alignItems: 'center',
  },
  railSeg: {
    width: 3,
    height: 10,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  chainDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  chainDotEndpoint: {
    backgroundColor: colors.primary,
  },
  chainName: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  chainNameEndpoint: {
    fontFamily: fontFamily.semiBold,
    color: colors.primaryDeep,
  },
  chainTag: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.primary,
  },
  statsCard: {
    padding: 18,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  stat: {
    width: '47%',
    alignItems: 'flex-start',
    gap: 6,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(63, 81, 181, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  statValue: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    color: colors.primaryDeep,
  },
  loading: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  loadingText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  actions: {
    gap: 10,
    marginTop: 4,
  },
  bottom: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
});
