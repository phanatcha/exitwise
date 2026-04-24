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
  LogOut,
  Minus,
  Plus,
  Sparkles,
  User as UserIcon,
  Zap,
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
  const { user, signOut } = useAuth();

  const [travelMode, setTravelMode] = useState<TravelModePref>('explorer');
  const [budget, setBudget] = useState(500);
  const [walkingLimit, setWalkingLimit] = useState(500);
  const [loaded, setLoaded] = useState(false);

  // Rehydrate each time the screen gains focus so if the user tweaked knobs
  // elsewhere (e.g. the Edit Plan sheet on AITripPlanner) this reflects them.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getOnboarding().then((o) => {
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
    await saveTravelMode(mode);
  };

  const adjustBudget = async (delta: number) => {
    const next = Math.max(100, Math.min(5000, budget + delta));
    setBudget(next);
    await saveBudget(next);
  };

  const adjustWalking = async (delta: number) => {
    const next = Math.max(100, Math.min(3000, walkingLimit + delta));
    setWalkingLimit(next);
    await saveWalkingLimit(next);
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
          <NeuCard radius={24} style={styles.identityCard}>
            <View style={styles.avatar}>
              <UserIcon color={colors.primary} size={28} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>
                {emailPrefix}
              </Text>
              <Text style={styles.email} numberOfLines={1}>
                {user?.email ?? 'Not signed in'}
              </Text>
            </View>
          </NeuCard>

          <Text style={styles.sectionLabel}>Travel mode</Text>
          <NeuCard radius={24} style={styles.modeCard}>
            <ModeOption
              active={travelMode === 'lazy'}
              Icon={Zap}
              title="Lazy"
              subtitle="Shortest walk, one great pick"
              onPress={() => pickMode('lazy')}
            />
            <View style={styles.divider} />
            <ModeOption
              active={travelMode === 'explorer'}
              Icon={Sparkles}
              title="Explorer"
              subtitle="A 2-3 stop walking tour"
              onPress={() => pickMode('explorer')}
            />
          </NeuCard>

          <Text style={styles.sectionLabel}>Preferences</Text>
          <NeuCard radius={24} style={styles.prefsCard}>
            <View style={styles.prefRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.prefTitle}>Budget per trip</Text>
                <Text style={styles.prefHint}>
                  How much you're willing to spend on food & activities.
                </Text>
              </View>
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

            <View style={styles.divider} />

            <View style={styles.prefRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.prefTitle}>Walking limit</Text>
                <Text style={styles.prefHint}>
                  Max walking distance between stops.
                </Text>
              </View>
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
          </NeuCard>

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

interface ModeOptionProps {
  active: boolean;
  Icon: React.ComponentType<any>;
  title: string;
  subtitle: string;
  onPress: () => void;
}

const ModeOption: React.FC<ModeOptionProps> = ({
  active,
  Icon,
  title,
  subtitle,
  onPress,
}) => (
  <Pressable onPress={onPress} style={styles.modeRow}>
    <View style={[styles.modeIcon, active && styles.modeIconActive]}>
      <Icon
        color={active ? colors.textInverse : colors.primary}
        size={20}
      />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.modeTitle, active && styles.modeTitleActive]}>
        {title}
      </Text>
      <Text style={styles.modeSubtitle}>{subtitle}</Text>
    </View>
    <View style={[styles.radioOuter, active && styles.radioOuterActive]}>
      {active ? <View style={styles.radioInner} /> : null}
    </View>
  </Pressable>
);

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
    gap: 12,
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 14,
    marginBottom: 8,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(63, 81, 181, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    color: colors.primaryDeep,
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  email: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  sectionLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 12,
    marginLeft: 6,
    marginBottom: 2,
  },
  modeCard: {
    padding: 8,
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 14,
  },
  modeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(63, 81, 181, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeIconActive: {
    backgroundColor: colors.primary,
  },
  modeTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    color: colors.primaryDeep,
  },
  modeTitleActive: {
    color: colors.primaryDeep,
  },
  modeSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(63, 81, 181, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(63, 81, 181, 0.08)',
    marginHorizontal: 12,
  },
  prefsCard: {
    padding: 8,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  prefTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.primaryDeep,
  },
  prefHint: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    minWidth: 64,
    textAlign: 'center',
  },
  navWrap: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
  },
});
