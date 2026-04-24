import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { GradientBg } from '../components/GradientBg';
import { NeuCard } from '../components/NeuCard';
import { NeuInput } from '../components/NeuInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { BottomSheet } from '../components/BottomSheet';
import { BackButton } from '../components/BackButton';
import { useAuth } from '../lib/auth';
import { colors, fontFamily, fontSize } from '../theme';
import type { AuthStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

// Figma node 25:13. Lock+key illustration (rendered with Lucide Lock inside a
// neumorphic circle) on top, bottom sheet with form below.

export const SignUpScreen: React.FC<Props> = ({ navigation }) => {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setErr(null);

    if (!email.trim() || !password || !confirm) {
      setErr('Please fill in every field.');
      return;
    }
    if (password !== confirm) {
      setErr("Passwords don't match.");
      return;
    }
    if (password.length < 6) {
      setErr('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const { error } = await signUp(email.trim(), password);
    setLoading(false);
    if (error) {
      setErr(error.message);
    }
    // On success the onAuthStateChange listener in AuthProvider flips
    // `session` and RootNavigator swaps us into the onboarding stack.
  };

  return (
    <GradientBg>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <SafeAreaView style={styles.flex} edges={['top']}>
          <View style={styles.header}>
            <BackButton onPress={() => navigation.goBack()} />
          </View>

          <View style={styles.illustration}>
            <NeuCard radius={999} style={styles.lockCircle}>
              <Lock color={colors.primary} size={64} strokeWidth={1.5} />
            </NeuCard>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>
              Start exploring Bangkok, one station at a time.
            </Text>
          </View>

          <BottomSheet style={styles.sheet}>
            <ScrollView
              contentContainerStyle={styles.form}
              keyboardShouldPersistTaps="handled"
            >
              <NeuInput
                placeholder="Email"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
                containerStyle={styles.input}
              />
              <NeuInput
                placeholder="Password"
                secureTextEntry
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
                containerStyle={styles.input}
              />
              <NeuInput
                placeholder="Confirm Password"
                secureTextEntry
                autoCapitalize="none"
                value={confirm}
                onChangeText={setConfirm}
                containerStyle={styles.input}
              />

              {err ? <Text style={styles.err}>{err}</Text> : null}

              <PrimaryButton
                label="Create Account"
                onPress={handleSignUp}
                loading={loading}
                style={styles.cta}
              />

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <Pressable onPress={() => navigation.navigate('LogIn')}>
                  <Text style={styles.footerLink}>Log in</Text>
                </Pressable>
              </View>
            </ScrollView>
          </BottomSheet>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </GradientBg>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  illustration: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 32,
  },
  lockCircle: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.primaryDeep,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sheet: { flex: 1 },
  form: { gap: 16 },
  input: {},
  err: {
    color: colors.danger,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  cta: { marginTop: 8 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  footerLink: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
});
