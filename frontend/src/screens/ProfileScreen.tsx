import React, { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { 
  ChevronRight,
  LogOut,
  Minus,
  Plus, 
  Sparkles, 
  Zap 
} from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { GradientBg } from '../components/GradientBg';
import { NeuCard } from '../components/NeuCard';
import { BackButton } from '../components/BackButton';
import { BottomNavPill, type NavTab } from '../components/BottomNavPill';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, fontFamily, fontSize } from '../theme';
import { useAuth } from '../lib/auth';
import {
  getOnboarding,
  saveBudget,
  saveTravelMode,
  saveWalkingLimit,
  type TravelModePref,
} from '../lib/onboarding';
import type { MainStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'Profile'>;

// User profile + preferences. All changes persist immediately to the
// onboarding AsyncStorage store so they take effect the next time the AI
// planner runs — no explicit Save button needed.
export const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user, signOut, session } = useAuth();

  const [travelMode, setTravelMode] = useState<TravelModePref>('explorer');
  const [budget, setBudget] = useState(500);
  const [walkingLimit, setWalkingLimit] = useState(500);
  const [loaded, setLoaded] = useState(false);

  // Rehydrate each time the screen gains focus so if the user tweaked knobs
  // elsewhere (e.g. the Edit Plan sheet on AITripPlanner) this reflects them.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getOnboarding(session!.user.id).then((o) => {
        if (cancelled) return;
        setTravelMode(o.travel_mode);
        if (o.budget_baht) setBudget(o.budget_baht);
        if (o.walking_limit_m) setWalkingLimit(o.walking_limit_m);
        setLoaded(true);
      });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const pickMode = async (mode: TravelModePref) => {
    setTravelMode(mode);
    await saveTravelMode(session!.user.id, mode);
  };

  const adjustBudget = async (delta: number) => {
    const next = Math.max(100, Math.min(5000, budget + delta));
    setBudget(next);
    await saveBudget(session!.user.id, next);
  };

  const adjustWalking = async (delta: number) => {
    const next = Math.max(100, Math.min(3000, walkingLimit + delta));
    setWalkingLimit(next);
    await saveWalkingLimit(session!.user.id, next);
  };

  const handleSignOut = () => {
    Alert.alert('Sign out?', 'You can always sign back in with your email.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const handleNav = (tab: NavTab) => {
    if (tab === 'profile') return;
    if (tab === 'home') navigation.navigate('Home');
    if (tab === 'planner') navigation.navigate('AITripPlanner');
    if (tab === 'saved') navigation.navigate('SaveTrip');
  };

  const emailPrefix =
    user?.email && user.email.includes('@')
      ? user.email.split('@')[0]
      : user?.email ?? 'traveller';

  return (
    <GradientBg>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar + identity */}
          <View style={styles.avatarWrap}>
            <View style={styles.avatarCircle} />
            <Text style={styles.name}>{emailPrefix}</Text>
            <Text style={styles.email}>{user?.email ?? 'Not signed in'}</Text>
          </View>

          {/* Preferences — Walking & Budget as tappable cards */}
          <NeuCard radius={24} style={styles.prefCard}>
            <View style={styles.prefRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.prefTitle}>Walking Distance Limit</Text>
                <Text style={styles.prefValue}>{walkingLimit} m</Text>
              </View>
              <View style={styles.stepper}>
                <Pressable style={styles.stepBtn} onPress={() => adjustWalking(-100)}>
                  <Minus color={colors.primaryDeep} size={16} />
                </Pressable>
                <Pressable style={styles.stepBtn} onPress={() => adjustWalking(100)}>
                  <Plus color={colors.primaryDeep} size={16} />
                </Pressable>
              </View>
            </View>
          </NeuCard>

          <NeuCard radius={24} style={styles.prefCard}>
            <View style={styles.prefRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.prefTitle}>Budget</Text>
                <Text style={styles.prefValue}>{budget} Baht</Text>
              </View>
              <View style={styles.stepper}>
                <Pressable style={styles.stepBtn} onPress={() => adjustBudget(-100)}>
                  <Minus color={colors.primaryDeep} size={16} />
                </Pressable>
                <Pressable style={styles.stepBtn} onPress={() => adjustBudget(100)}>
                  <Plus color={colors.primaryDeep} size={16} />
                </Pressable>
              </View>
            </View>
          </NeuCard>

          {/* Travel mode */}
          <Text style={styles.sectionLabel}>Travel mode</Text>
          <View style={styles.modeGrid}>
            <Pressable
              style={[styles.modeCard, travelMode === 'lazy' && styles.modeCardActive]}
              onPress={() => pickMode('lazy')}
            >
              <Zap
                color={travelMode === 'lazy' ? colors.textInverse : colors.primaryDeep}
                size={28}
                style={styles.modeCardIcon}
              />
              <Text style={[styles.modeCardTitle, travelMode === 'lazy' && styles.modeCardTitleActive]}>
                Lazy
              </Text>
              <Text style={[styles.modeCardSub, travelMode === 'lazy' && styles.modeCardSubActive]}>
                Closest picks
              </Text>
            </Pressable>

            <Pressable
              style={[styles.modeCard, travelMode === 'explorer' && styles.modeCardActive]}
              onPress={() => pickMode('explorer')}
            >
              <Sparkles
                color={travelMode === 'explorer' ? colors.textInverse : colors.primaryDeep}
                size={28}
                style={styles.modeCardIcon}
              />
              <Text style={[styles.modeCardTitle, travelMode === 'explorer' && styles.modeCardTitleActive]}>
                Explorer
              </Text>
              <Text style={[styles.modeCardSub, travelMode === 'explorer' && styles.modeCardSubActive]}>
                More stops & fun
              </Text>
            </Pressable>
          </View>

          {loaded ? (
            <PrimaryButton
              label="Sign out"
              variant="pink"
              onPress={handleSignOut}
              rightSlot={<LogOut color={colors.textInverse} size={18} />}
              style={{ marginTop: 8 }}
            />
          ) : null}
        </ScrollView>

        <View style={styles.navWrap}>
          <BottomNavPill current="profile" onSelect={handleNav} />
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
  headerTitleWrap: { flex: 1, alignItems: 'center' },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.primaryDeep,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 120,
    gap: 12,
  },

  // Avatar block
  avatarWrap: {
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  avatarCircle: {
    width: 131,
    height: 131,
    borderRadius: 66,
    backgroundColor: 'rgba(63,81,181,0.15)',
    marginBottom: 4,
  },
  name: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    color: colors.primaryDeep,
    textTransform: 'capitalize',
  },
  email: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },

  // Pref cards (walking / budget)
  prefCard: {
    padding: 0,
    overflow: 'hidden',
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  prefTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    color: colors.primaryDeep,
    marginBottom: 2,
  },
  prefValue: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    color: colors.primary,
  },

  // Section label
  sectionLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.lg,
    color: colors.primaryDeep,
    marginTop: 12,
    marginLeft: 4,
  },

  // Mode grid
  modeGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  modeCard: {
    flex: 1,
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
    // neumorphic light (inactive)
    shadowColor: '#C5C7D1',
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  modeCardActive: {
    backgroundColor: colors.primaryDeep, // dark fill when selected
  },
  modeCardIcon: {
    marginBottom: 4,
  },
  modeCardTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xl,
    color: colors.primaryDeep,
  },
  modeCardTitleActive: {
    color: colors.textInverse,
  },
  modeCardSub: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modeCardSubActive: {
    color: 'rgba(255,255,255,0.7)',
  },

  navWrap: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
  },
  stepper: {
  flexDirection: 'row',
  gap: 8,
},
stepBtn: {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: 'rgba(63, 81, 181, 0.12)',
  alignItems: 'center',
  justifyContent: 'center',
  },
});