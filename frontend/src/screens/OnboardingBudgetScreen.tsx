import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { GradientBg } from '../components/GradientBg';
import { NeuInput } from '../components/NeuInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { BackButton } from '../components/BackButton';
import { StepDots } from '../components/StepDots';
import { colors, fontFamily, fontSize } from '../theme';
import { saveBudget, markOnboardingDone } from '../lib/onboarding';
import { updatePreferences } from '../services/users';
import type { OnboardingStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingBudget'> & {
  onDone: () => void;
};

// Figma node 46:64. "What's your comfortable spending range?" with a Baht
// input. On Next we persist locally AND PATCH /me so the backend knows.

export const OnboardingBudgetScreen: React.FC<Props> = ({
  navigation,
  route,
  onDone,
}) => {
  const [baht, setBaht] = useState('1000');
  const [submitting, setSubmitting] = useState(false);

  const handleDone = async () => {
    const n = Number(baht.replace(/[^0-9]/g, ''));
    if (!Number.isFinite(n) || n <= 0) return;

    setSubmitting(true);
    try {
      await saveBudget(n);
      await markOnboardingDone();
      // Fire-and-forget to the backend. The local state is the source of truth
      // for navigation, so backend failure doesn't block the user.
      updatePreferences({
        walking_limit_m: route.params.walking_limit_m,
        budget_baht: n,
        onboarding_completed: true,
      }).catch(() => {});
    } finally {
      setSubmitting(false);
      onDone();
    }
  };

  return (
    <GradientBg>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <SafeAreaView style={styles.flex}>
          <View style={styles.inner}>
            <View style={styles.header}>
              <BackButton onPress={() => navigation.goBack()} />
              <View style={{ flex: 1 }} />
            </View>

            <View style={styles.progress}>
              <StepDots total={2} current={2} />
              <Text style={styles.step}>Step 2 of 2</Text>
            </View>

            <View style={styles.body}>
              <Text style={styles.title}>
                What&apos;s your comfortable spending range?
              </Text>
              <Text style={styles.hint}>
                Per outing — we&apos;ll tune food and activity picks to this.
              </Text>

              <NeuInput
                value={baht}
                onChangeText={(t) => setBaht(t.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                placeholder="1000"
                containerStyle={styles.input}
                style={styles.inputText}
              />
              <Text style={styles.suffix}>Baht</Text>
            </View>

            <View style={styles.footer}>
              <PrimaryButton
                label="Next"
                onPress={handleDone}
                loading={submitting}
                rightSlot={<ArrowRight color={colors.textInverse} size={18} />}
              />
            </View>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </GradientBg>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  inner: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progress: {
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
  input: {
    paddingVertical: 20,
  },
  inputText: {
    fontSize: 24,
    fontFamily: fontFamily.semiBold,
    color: colors.primaryDeep,
  },
  suffix: {
    marginTop: 12,
    textAlign: 'right',
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  footer: { paddingTop: 16 },
});
