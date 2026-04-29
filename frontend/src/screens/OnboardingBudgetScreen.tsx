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
import { useAuth } from '../lib/auth';
import { GradientBg } from '../components/GradientBg';
import { NeuInput } from '../components/NeuInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { BackButton } from '../components/BackButton';
import { StepDots } from '../components/StepDots';
import { colors, fontFamily, fontSize } from '../theme';
import { saveBudget, markOnboardingDone } from '../lib/onboarding';
import { updatePreferences } from '../services/users';
import type { OnboardingStackParamList } from '../navigation/types';
import { NeuCard } from '../components/NeuCard';

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
  const { session } = useAuth();
  const [baht, setBaht] = useState('1000');
  const [submitting, setSubmitting] = useState(false);

  const handleDone = async () => {
    const n = Number(baht.replace(/[^0-9]/g, ''));
    if (!Number.isFinite(n) || n <= 0) return;

    setSubmitting(true);
    try {
      await saveBudget(session!.user.id, n);
      await markOnboardingDone(session!.user.id);
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
      <SafeAreaView style={styles.flex}>
        <View style={styles.inner}>

          {/* Back button */}
          <BackButton onPress={() => navigation.goBack()} />

          {/* Step dots */}
          <View style={styles.progress}>
            <StepDots total={2} current={2} />
            <Text style={styles.step}>Step 2 of 2</Text>
          </View>

          {/* Center card */}
          <View style={styles.body}>
            <NeuCard radius={24} style={styles.card}>
              <Text style={styles.title}>
                What's your comfortable spending range?
              </Text>
              <Text style={styles.hint}>
                Budget-friendly for students or ready to splurge?
              </Text>

              {/* Inset input */}
              <NeuInput
                value={`${baht} Baht`}
                onChangeText={(t) => setBaht(t.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                placeholder="1000 Baht"
                containerStyle={styles.input}
              />

              {/* Next button */}
              <PrimaryButton
                label="Next"
                onPress={handleDone}
                loading={submitting}
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
  flex: { flex: 1 },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  progress: {
    marginTop: 16,
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
  input: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  btn: {
    marginTop: 8,
    borderRadius: 8,
  },
});