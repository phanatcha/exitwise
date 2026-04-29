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
import { useAuth } from '../lib/auth';
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
  const { session } = useAuth();
  const handleNext = async () => {
    await saveWalkingLimit(session!.user.id, meters);
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
            <NeuCard radius={24} style={styles.card}>
              <Text style={styles.title}>
                What's your absolute walking limit?
              </Text>
              <Text style={styles.hint}>
                We won't suggest places further than this, no matter how cool they are.
              </Text>

              {/* Readout */}
              <NeuCard radius={999} style={styles.readoutCard}>
                <Text style={styles.readout}>{label}</Text>
              </NeuCard>

              {/* Slider */}
              <View style={styles.sliderWrap}>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={2000}
                  step={50}
                  value={meters}
                  onValueChange={(val) => setMeters(Math.round(val))}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor="#D6DBE6"
                  thumbTintColor="#F3F3F3"
                />
                <View style={styles.scaleRow}>
                  <Text style={styles.scaleText}>0 km</Text>
                  <Text style={styles.scaleText}>2 km</Text>
                </View>
              </View>

              {/* Next button inside card */}
              <PrimaryButton
                label="Next"
                onPress={handleNext}
                rightSlot={<ArrowRight color={colors.textInverse} size={18} />}
                style={styles.btn}
              />
            </NeuCard>
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
    paddingHorizontal: 24,
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
  card: {
    padding: 24,
    gap: 16,
  },
  title: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xl,
    color: colors.primaryDeep,
    lineHeight: 28,
  },
  hint: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  readoutCard: {
    alignSelf: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  readout: {
    fontFamily: fontFamily.bold,
    fontSize: 36,
    color: colors.primaryDeep,
    lineHeight: 40,
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
  btn: {
    marginTop: 8,
    borderRadius: 8,
  },
});
