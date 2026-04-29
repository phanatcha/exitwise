import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  Image,
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
import { useAuth } from '../lib/auth';
import { colors, fontFamily, fontSize } from '../theme';
import type { AuthStackParamList } from '../navigation/types';
import lockImg from '../../assets/Vector-1.png';
import keyImg from '../../assets/Vector-2.png';
import Logo from '../../assets/Logo.svg';

type Props = NativeStackScreenProps<AuthStackParamList, 'LogIn'>;

// Figma node 25:14. Same structure as SignUp but only email + password.

export const LogInScreen: React.FC<Props> = ({ navigation }) => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogIn = async () => {
    setErr(null);
    if (!email.trim() || !password) {
      setErr('Please enter your email and password.');
      return;
    }
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) {
      setErr(error.message);
    }
  };

  return (
    <GradientBg>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <SafeAreaView style={styles.flex} edges={['top']}>
          <View style={styles.header}>
            <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
              <Logo width={44} height={44} />
            </Pressable>
          </View>

          <View style={styles.illustration}>
            <NeuCard radius={999} style={styles.lockCircle}>
              <Image
                source={lockImg}
                resizeMode="contain"
              />
              <Image
                source={keyImg}
                resizeMode="contain"
              />
            </NeuCard>
          </View>

          <BottomSheet style={styles.sheet}>
            <ScrollView
              contentContainerStyle={styles.form}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.title}>Log In</Text>

              <NeuInput
                placeholder="Email"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
              />
              <NeuInput
                placeholder="Password"
                secureTextEntry
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
              />

              {err ? <Text style={styles.err}>{err}</Text> : null}

              <PrimaryButton
                label="Log In"
                onPress={handleLogIn}
                loading={loading}
                style={styles.cta}
              />

              <View style={styles.footer}>
                <Text style={styles.footerText}>New here? </Text>
                <Pressable onPress={() => navigation.navigate('SignUp')}>
                  <Text style={styles.footerLink}>Create an account</Text>
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
    width: 323,
    height: 323,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  lockImg: {
    width: 112,
    height: 152,
    position: 'absolute',
  },
  keyImg: {
    width: 135,
    height: 135,
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 30,
    color: colors.primaryDeep,
    marginBottom: 8,
  },
  sheet: { flex: 1 },
  form: { gap: 16 },
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
