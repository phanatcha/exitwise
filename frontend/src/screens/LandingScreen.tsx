import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Train } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { GradientBg } from '../components/GradientBg';
import { NeuCard } from '../components/NeuCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { colors, fontFamily, fontSize } from '../theme';
import type { AuthStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Landing'>;

// Figma node 25:12. The illustration in Figma is a custom skytrain + cityscape.
// We render a neumorphic circular badge with Lucide's Train icon as a clean
// placeholder until we wire up the real SVG asset.

export const LandingScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <GradientBg>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.illustration}>
            <NeuCard radius={999} style={styles.trainCircle}>
              <Train color={colors.primary} size={88} strokeWidth={1.5} />
            </NeuCard>
          </View>

          <View style={styles.badgeWrap}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Your City, Reimagined</Text>
            </View>
          </View>

          <Text style={styles.title}>ExitWise</Text>

          <Text style={styles.tagline}>
            Stop just commuting. Start exploring. Discover what&apos;s around
            every MRT Blue Line station, tuned to how far you want to walk and
            what you want to spend.
          </Text>

          <View style={styles.actions}>
            <PrimaryButton
              label="Sign Up"
              onPress={() => navigation.navigate('SignUp')}
            />
            <SecondaryButton
              label="Log In"
              onPress={() => navigation.navigate('LogIn')}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </GradientBg>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  illustration: {
    alignItems: 'center',
    marginBottom: 32,
  },
  trainCircle: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  badge: {
    backgroundColor: 'rgba(63, 81, 181, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  badgeText: {
    color: colors.primary,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    letterSpacing: 0.5,
  },
  title: {
    textAlign: 'center',
    fontFamily: fontFamily.bold,
    fontSize: fontSize.display,
    color: colors.primaryDeep,
    marginBottom: 14,
    letterSpacing: -0.5,
  },
  tagline: {
    textAlign: 'center',
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.textSecondary,
    lineHeight: 24,
    paddingHorizontal: 8,
    marginBottom: 40,
  },
  actions: {
    gap: 16,
  },
});
