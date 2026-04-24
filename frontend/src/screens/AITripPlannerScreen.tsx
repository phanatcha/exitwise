import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Coffee,
  DoorOpen,
  MapPin,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  Utensils,
} from 'lucide-react-native';
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
import { fetchStations, type Station } from '../services/stations';
import {
  getOnboarding,
  saveBudget,
  saveWalkingLimit,
  type TravelModePref,
} from '../lib/onboarding';
import { createTrip } from '../services/trips';
import type { MainStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'AITripPlanner'>;

const iconFor = (kind: PlannerStop['kind']) => {
  switch (kind) {
    case 'exit':
      return DoorOpen;
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
  const [start, setStart] = useState<Station | null>(route.params?.start ?? null);
  const [destination, setDestination] = useState<Station | null>(
    route.params?.destination ?? null,
  );
  const [plan, setPlan] = useState<PlannerResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Trip knobs. We hydrate from the onboarding store on first mount so the
  // user's saved budget / walking limit seed the planner, then let them tweak
  // inline via the "Edit Plan" sheet — regenerating the Gemini plan each time.
  const [budget, setBudget] = useState(500);
  const [walkingLimit, setWalkingLimit] = useState(500);
  const [travelMode, setTravelMode] = useState<TravelModePref>('explorer');
  const [editing, setEditing] = useState(false);
  // Bumping this forces the plan effect to re-run without changing start/dest.
  const [regenKey, setRegenKey] = useState(0);

  useEffect(() => {
    getOnboarding().then((o) => {
      if (o.budget_baht) setBudget(o.budget_baht);
      if (o.walking_limit_m) setWalkingLimit(o.walking_limit_m);
      setTravelMode(o.travel_mode);
    });
  }, []);

  // Resolve legacy `origin_station_code` param by hydrating from /stations.
  useEffect(() => {
    if (start || !route.params?.origin_station_code) return;
    fetchStations()
      .then((rows) => {
        const hit = rows.find(
          (s) => s.code === route.params?.origin_station_code,
        );
        if (hit) setStart(hit);
      })
      .catch(() => {});
  }, [route.params?.origin_station_code, start]);

  useEffect(() => {
    if (!start) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const endId = destination?.id ?? start.id;
        const res = await generateItinerary({
          start_station_id: start.id,
          end_station_id: endId,
          budget,
          max_walking_distance: walkingLimit,
          // Honour the user's Profile setting:
          //   - 'lazy'     → Gemini returns one great POI
          //   - 'explorer' → 2-3 stop walking tour
          travel_mode: travelMode,
        });
        if (!cancelled) setPlan(res);
      } catch (e: any) {
        if (!cancelled) {
          setError(
            e?.response?.data?.error ??
              'The AI planner is unavailable right now. Try again in a moment.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [start?.id, destination?.id, regenKey]);

  const handleSave = async () => {
    if (!plan || !start) return;
    setSaving(true);
    try {
      // Use the live knobs the user just saw, not the onboarding defaults,
      // so the saved card on SaveTripScreen matches what they actually
      // generated (e.g. "Walking Limit 700 m / Budget 800 Baht").
      await createTrip({
        title: destination
          ? `${start.name} → ${destination.name}`
          : `${start.name} Trip`,
        walking_limit_m: walkingLimit,
        budget_baht: budget,
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
    if (tab === 'profile') navigation.navigate('Profile');
  };

  const adjustBudget = (delta: number) =>
    setBudget((b) => Math.max(100, Math.min(5000, b + delta)));
  const adjustWalking = (delta: number) =>
    setWalkingLimit((w) => Math.max(100, Math.min(3000, w + delta)));

  const handleApplyEdit = async () => {
    // Persist so subsequent screens / sessions see the new knobs.
    await Promise.all([saveBudget(budget), saveWalkingLimit(walkingLimit)]);
    setEditing(false);
    setRegenKey((k) => k + 1);
  };

  const title = useMemo(() => {
    if (start && destination) return `${start.name} → ${destination.name}`;
    if (start) return `${start.name} Trip`;
    return 'AI Trip Plan';
  }, [start, destination]);

  const distanceKm = plan ? (plan.total_distance_m / 1000).toFixed(1) : '—';
  // Walking trips are almost always under an hour, so rounding to whole
  // hours used to display "Approximately 0 hours" for 30–45 minute tours.
  // Format in minutes when <60 min, otherwise as Xh Ymin.
  const durationLabel = (() => {
    if (!plan) return '—';
    const mins = Math.max(0, Math.round(plan.estimated_duration_min));
    if (mins < 60) return `about ${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m === 0 ? `about ${h} hr` : `about ${h} hr ${m} min`;
  })();

  return (
    <GradientBg>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>{title}</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {!start ? (
            <NeuCard radius={24} style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Sparkles color={colors.primary} size={24} />
              </View>
              <Text style={styles.emptyTitle}>No station picked yet</Text>
              <Text style={styles.emptyBody}>
                Go to the Blue Line map and tap a station to get an AI trip
                suggestion starting from there.
              </Text>
              <PrimaryButton
                label="Browse stations"
                onPress={() => navigation.navigate('Home')}
              />
            </NeuCard>
          ) : (
            <>
              <Text style={styles.meta}>
                ~{distanceKm} km · {durationLabel}
              </Text>

              {plan?.recommended_exit ? (
                <NeuCard radius={20} style={styles.exitCard}>
                  <DoorOpen color={colors.accentPink} size={18} />
                  <Text style={styles.exitCardText}>
                    Gemini suggests{' '}
                    <Text style={styles.exitCardBold}>
                      {/* Accept both "2" and "Exit 2" from the backend so we
                          never render "Exit Exit 2". */}
                      {/^\s*exit\b/i.test(plan.recommended_exit)
                        ? plan.recommended_exit
                        : `Exit ${plan.recommended_exit}`}
                    </Text>{' '}
                    from {start.name}.
                  </Text>
                </NeuCard>
              ) : null}

              <NeuCard radius={24} style={styles.stopsCard}>
                {loading ? (
                  <View style={styles.loadingWrap}>
                    <ActivityIndicator color={colors.primary} />
                    <Text style={styles.loadingText}>
                      Asking Gemini for a trip…
                    </Text>
                  </View>
                ) : error ? (
                  <View style={styles.loadingWrap}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
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
                          {stop.note ? (
                            <Text style={styles.stopNote}>{stop.note}</Text>
                          ) : null}
                        </View>
                      </View>
                    );
                  })
                )}
              </NeuCard>

              {editing ? (
                <NeuCard radius={24} style={styles.editCard}>
                  <Text style={styles.editTitle}>Edit Plan</Text>

                  <View style={styles.editRow}>
                    <Text style={styles.editLabel}>Budget</Text>
                    <View style={styles.stepper}>
                      <Pressable
                        style={styles.stepBtn}
                        onPress={() => adjustBudget(-100)}
                      >
                        <Minus color={colors.primaryDeep} size={16} />
                      </Pressable>
                      <Text style={styles.stepValue}>{budget} ฿</Text>
                      <Pressable
                        style={styles.stepBtn}
                        onPress={() => adjustBudget(100)}
                      >
                        <Plus color={colors.primaryDeep} size={16} />
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.editRow}>
                    <Text style={styles.editLabel}>Walking</Text>
                    <View style={styles.stepper}>
                      <Pressable
                        style={styles.stepBtn}
                        onPress={() => adjustWalking(-100)}
                      >
                        <Minus color={colors.primaryDeep} size={16} />
                      </Pressable>
                      <Text style={styles.stepValue}>{walkingLimit} m</Text>
                      <Pressable
                        style={styles.stepBtn}
                        onPress={() => adjustWalking(100)}
                      >
                        <Plus color={colors.primaryDeep} size={16} />
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.editActions}>
                    <SecondaryButton
                      label="Cancel"
                      variant="outline"
                      onPress={() => setEditing(false)}
                      style={{ flex: 1 }}
                    />
                    <PrimaryButton
                      label="Regenerate"
                      variant="pink"
                      onPress={handleApplyEdit}
                      style={{ flex: 1 }}
                    />
                  </View>
                </NeuCard>
              ) : null}

              {plan ? (
                <View style={styles.actions}>
                  <PrimaryButton
                    label="Save Plan"
                    variant="pink"
                    onPress={handleSave}
                    loading={saving}
                  />
                  {destination ? (
                    <SecondaryButton
                      label="Start Navigation"
                      variant="outline"
                      onPress={() =>
                        navigation.navigate('Navigation', {
                          start,
                          destination,
                        })
                      }
                    />
                  ) : (
                    <SecondaryButton
                      label="Edit Plan"
                      variant="outline"
                      onPress={() => setEditing((v) => !v)}
                    />
                  )}
                </View>
              ) : null}
            </>
          )}
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
    marginBottom: 16,
  },
  exitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    marginBottom: 16,
  },
  exitCardText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  exitCardBold: {
    fontFamily: fontFamily.semiBold,
    color: colors.primaryDeep,
  },
  stopsCard: {
    padding: 20,
    gap: 4,
    marginBottom: 24,
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
  stopNote: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 10,
  },
  loadingText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  errorText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.danger,
    textAlign: 'center',
  },
  actions: { gap: 14 },
  navWrap: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
  },
  emptyCard: {
    padding: 24,
    gap: 12,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(63, 81, 181, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    color: colors.primaryDeep,
  },
  emptyBody: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  editCard: {
    padding: 20,
    gap: 14,
    marginBottom: 16,
  },
  editTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    color: colors.primaryDeep,
    marginBottom: 4,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(63, 81, 181, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.primaryDeep,
    minWidth: 80,
    textAlign: 'center',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
});
