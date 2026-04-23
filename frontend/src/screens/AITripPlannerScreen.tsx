import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Coffee, Utensils, ShoppingBag, MapPin } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { GradientBg } from '../components/GradientBg';
import { NeuCard } from '../components/NeuCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { BackButton } from '../components/BackButton';
import { BottomNavPill, type NavTab } from '../components/BottomNavPill';
import { colors, fontFamily, fontSize } from '../theme';
import {
  generateItinerary,
  type PlannerResult,
  type PlannerStop,
} from '../services/planner';
import { getOnboarding } from '../lib/onboarding';
import { createTrip } from '../services/trips';
import type { MainStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'AITripPlanner'>;

// Figma node 27:794. Fallback example while the backend isn't live.
const FALLBACK: PlannerResult = {
  total_distance_m: 1100,
  estimated_duration_min: 180,
  stops: [
    { name: 'Leave Exit 3', distance_m: 0, kind: 'exit' },
    { name: 'The Coffee Club', distance_m: 200, kind: 'food' },
    { name: 'Paa Noi Boat Noodle', distance_m: 600, kind: 'food' },
    { name: 'Ari Market', distance_m: 900, kind: 'landmark' },
  ],
};

const iconFor = (kind: PlannerStop['kind']) => {
  switch (kind) {
    case 'exit':
      return MapPin;
    case 'food':
      return Utensils;
    case 'poi':
      return Coffee;
    case 'landmark':
      return ShoppingBag;
    default:
      return MapPin;
  }
};

export const AITripPlannerScreen: React.FC<Props> = ({ navigation, route }) => {
  const origin = route.params?.origin_station_code ?? 'BL-Ari';
  const [plan, setPlan] = useState<PlannerResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const prefs = await getOnboarding();
      try {
        const res = await generateItinerary({
          origin_station_code: origin,
          walking_limit_m: prefs.walking_limit_m ?? 500,
          budget_baht: prefs.budget_baht ?? 500,
        });
        setPlan(res);
      } catch {
        // Backend not available yet — show the Figma reference payload so the
        // screen is still usable for design QA.
        setPlan(FALLBACK);
      } finally {
        setLoading(false);
      }
    })();
  }, [origin]);

  const handleSave = async () => {
    if (!plan) return;
    const prefs = await getOnboarding();
    setSaving(true);
    try {
      await createTrip({
        title: `${origin.replace('BL-', '')} Trip`,
        walking_limit_m: prefs.walking_limit_m ?? 500,
        budget_baht: prefs.budget_baht ?? 500,
        stops: plan.stops.map((s, i) => ({
          name: s.name,
          order_index: i,
          note: s.note,
        })),
      });
      navigation.navigate('SaveTrip');
    } catch {
      navigation.navigate('SaveTrip');
    } finally {
      setSaving(false);
    }
  };

  const handleNav = (tab: NavTab) => {
    if (tab === 'planner') return;
    if (tab === 'home') navigation.navigate('Home');
    if (tab === 'saved') navigation.navigate('SaveTrip');
  };

  const distanceKm = plan
    ? (plan.total_distance_m / 1000).toFixed(1)
    : '—';
  const durationHours = plan ? Math.round(plan.estimated_duration_min / 60) : 0;

  return (
    <GradientBg>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Ari Trip Plan</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.meta}>
            ~{distanceKm} km · Approximately {durationHours} hours
          </Text>

          <NeuCard radius={24} style={styles.stopsCard}>
            {loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              plan?.stops.map((stop, idx) => {
                const Icon = iconFor(stop.kind);
                const isLast = idx === plan.stops.length - 1;
                return (
                  <View key={idx} style={styles.stopRow}>
                    <View style={styles.stopLeft}>
                      <View style={styles.avatar}>
                        <Icon color={colors.primary} size={18} />
                      </View>
                      {!isLast && <View style={styles.trail} />}
                    </View>
                    <View style={styles.stopText}>
                      <Text style={styles.stopName}>{stop.name}</Text>
                      {stop.distance_m > 0 && (
                        <Text style={styles.stopDistance}>
                          {stop.distance_m} m
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </NeuCard>

          <View style={styles.actions}>
            <PrimaryButton
              label="Save Plan"
              variant="pink"
              onPress={handleSave}
              loading={saving}
            />
            <SecondaryButton label="Edit Plan" variant="outline" />
          </View>
        </ScrollView>

        <View style={styles.navWrap}>
          <BottomNavPill current="planner" onSelect={handleNav} />
        </View>
      </SafeAreaView>
    </GradientBg>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.primaryDeep,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  meta: {
    textAlign: 'center',
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  stopsCard: {
    padding: 20,
    gap: 4,
    marginBottom: 32,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 64,
  },
  stopLeft: {
    alignItems: 'center',
    width: 48,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(63, 81, 181, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trail: {
    width: 2,
    flex: 1,
    minHeight: 24,
    backgroundColor: 'rgba(63, 81, 181, 0.2)',
    marginTop: 4,
  },
  stopText: {
    flex: 1,
    paddingLeft: 16,
    paddingTop: 6,
    paddingBottom: 20,
  },
  stopName: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    color: colors.primaryDeep,
    marginBottom: 2,
  },
  stopDistance: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  actions: { gap: 14 },
  navWrap: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
  },
});
