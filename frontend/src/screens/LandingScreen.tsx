import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Dimensions,
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
import ImageLogo from '../../assets/Logo.svg';
import skytrain from '../../assets/skytrain 3.png';
import Ellipse from '../../assets/Ellipse 1.png';
import { Image } from 'react-native';
import { TouchableOpacity } from 'react-native';
type Props = NativeStackScreenProps<AuthStackParamList, 'Landing'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const LandingScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <GradientBg>
      <SafeAreaView style={styles.safe}>
        {/* ── Logo mark (top-left) ── */}
        <View style={styles.logoMark}>
          <ImageLogo 
            width={167}
            height={229}
            style={{ 
              transform: [{ scale: 0.15 }],
              position: 'absolute',
              top: -80,
              left: -60, }}
          />
        </View>

        {/* ── Subtitle pill (top-center) ── */}
        <View style={styles.subtitlePillWrap}>
          <NeuCard radius={999} style={styles.subtitlePill}>
            <Text style={styles.subtitleText}>Your City, Reimagined</Text>
          </NeuCard>
        </View>

        {/* ── Tilted illustration card ── */}
        <View style={styles.illustrationWrap}>
          <View style={styles.illustrationTilted}>
            {/* Glassy ellipse accent */}
            <Image
              source={Ellipse}
              style={[styles.illustrationInner, { position: 'absolute', top: 30  }]}
              resizeMode="contain"
            />
            {/* Placeholder for skytrain/cityscape SVG */}
              <Image
                source={skytrain}
                style={styles.illustrationInner}
                resizeMode="contain"
              />
           
          </View>
        </View>

        {/* ── Bottom card ── */}
        <View style={styles.bottomCardWrap}>
          <NeuCard radius={24} style={styles.bottomCard}>
            <Text style={styles.title}>ExitWise</Text>

            <Text style={styles.tagline}>
              Stop just commuting. Start exploring. Discover what&apos;s around
              every MRT Blue Line station, tuned to how far you want to walk
              and what you want to spend.
            </Text>

            <View style={styles.actions}>
              {/* Sign Up */}
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={() => navigation.navigate('SignUp')}
              >
                <Text style={styles.btnPrimaryText}>Sign Up</Text>
              </TouchableOpacity>

              {/* Log In */}
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={() => navigation.navigate('LogIn')}
              >
                <Text style={styles.btnSecondaryText}>Log In</Text>
              </TouchableOpacity>
            </View>
          </NeuCard>
        </View>
      </SafeAreaView>
    </GradientBg>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },

  /* ── Logo mark (two overlapping squares, top-left) ── */
  logoMark: {
  position: 'absolute',
  top: 52,
  left: 28,
  width: 167,
  height: 229,
  },
  

  /* ── Subtitle pill ── */
  subtitlePillWrap: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  subtitlePill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  subtitleText: {
    color: colors.textSecondary,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
  },

  /* ── Tilted illustration ── */
  illustrationWrap: {
    position: 'absolute',
    top: 120,
    left: -24,
    right: -24,
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  illustrationTilted: {
    width: SCREEN_WIDTH * 0.88,
    height: 200,
    transform: [{ rotate: '11deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  illustrationInner: {
    width: SCREEN_WIDTH * 0.82,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Bottom info card ── */
  bottomCardWrap: {
    position: 'absolute',
    bottom: 64,
    left: 24,
    right: 24,
  },
  bottomCard: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 28,
  },
  title: {
    textAlign: 'center',
    fontFamily: fontFamily.bold,
    fontSize: 48,
    lineHeight: 48,
    color: '#3F487B',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  tagline: {
    textAlign: 'center',
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: 24,
  },
actions: {
  flexDirection: 'row',
  gap: 16,
  alignItems: 'center',
},
btnPrimary: {
  paddingHorizontal: 24,
  paddingVertical: 8,
  borderRadius: 9,
  backgroundColor: '#3F51B5',
  shadowColor: '#C5C7D1',
  shadowOffset: { width: 6, height: 6 },
  shadowOpacity: 1,
  shadowRadius: 12,
  elevation: 4,
},
btnPrimaryText: {
  color: '#FFFFFF',
  fontSize: 14,
  fontFamily: fontFamily.bold,
  lineHeight: 20,
  letterSpacing: 0.35,
},
btnSecondary: {
  paddingHorizontal: 24,
  paddingVertical: 8,
  borderRadius: 9,
  backgroundColor: '#E8EAF6',
  shadowColor: '#C5C7D1',
  shadowOffset: { width: 6, height: 6 },
  shadowOpacity: 1,
  shadowRadius: 12,
  elevation: 4,
},
btnSecondaryText: {
  color: '#3F51B5',
  fontSize: 14,
  fontFamily: fontFamily.bold,
  lineHeight: 20,
  letterSpacing: 0.35,
},
});