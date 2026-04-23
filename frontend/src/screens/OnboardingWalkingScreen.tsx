import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { ArrowRight } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { GradientBg } from '../components/GradientBg';
import { NeuCard } from '../components/NeuCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { StepDots } from '../components/StepDots';
import { colors, fontFamily, fontSize } from '../theme';
import { saveWalkingLimit } from '../lib/onboarding';
import type { OnboardingStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingWalking'>;

// Figma node 25:15. "What's your absolute walking limit?" with a 0km–2km
// slider, default 500m.

export const OnboardingWalkingScreen: React.FC<Props> = ({ navigation }) => {
  const [meters, setMeters] = useState(500);

  const handleNext = async () => {
    await saveWalkingLimit(meters);
    navigation.navigate('OnboardingBudget', { walking_limit_m: meters });
  };

  // Format 500 → "500 m", 1500 → "1.5 km".
  const label = meters >= 1000
    ? `${(meters / 1000).toFixed(meters % 1000 === 0 ? 0 : 1)} km`
    : `${meters} m`;

  return (
    <GradientBg>
      <SafeAreaView style={styles.safe}>
        <View style={styles.inner}>
          <View style={styles.header}>
            <StepDots total={2} current={1} />
            <Text style={styles.step}>Step 1 of 2</Text>
          </View>

          <View style={styles.body}>
            <Text style={styles.title}>
              What&apos;s your absolute walking limit?
            </Text>
            <Text style={styles.hint}>
              We&apos;ll only suggest places you&apos;re willing to walk to.
            </Text>

            <NeuCard radius={30} style={styles.readoutCard}>
              <Text style={styles.readout}>{label}</Text>
              <Text style={styles.readoutLabel}>from the station exit</Text>
            </NeuCard>

            <View style={styles.sliderWrap}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={2000}
                step={50}
                value={meters}
                onValueChange={setMeters}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor="rgba(63, 81, 181, 0.2)"
                thumbTintColor={colors.primary}
              />
              <View style={styles.scaleRow}>
                <Text style={styles.scaleText}>0 km</Text>
                <Text style={styles.scaleText}>2 km</Text>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <PrimaryButton
              label="Next"
              onPress={handleNext}
              rightSlot={<ArrowRight color={colors.textInverse} size={18} />}
            />
          </View>
        </View>
      </SafeAreaView>
    </GradientBg>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  inner: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  step: {
    marginTop: 8,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.primaryDeep,
    marginBottom: 8,
  },
  hint: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginBottom: 32,
  },
  readoutCard: {
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 32,
  },
  readout: {
    fontFamily: fontFamily.bold,
    fontSize: 44,
    color: colors.primary,
  },
  readoutLabel: {
    marginTop: 4,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  sliderWrap: {
    paddingHorizontal: 6,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  scaleText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  footer: {
    paddingTop: 16,
  },
});
