import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fontFamily, fontSize, neuRaised } from '../theme';

// Indigo (or pink) gradient CTA. Structure:
//   outer View: holds the shadow (no overflow:hidden — iOS clips shadows
//                otherwise)
//   inner Pressable: holds the border radius + overflow:hidden + gradient
// This keeps the iOS drop shadow intact while the gradient still rounds.

interface Props {
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  rightSlot?: React.ReactNode;
  style?: ViewStyle;
  variant?: 'primary' | 'pink';
}

export const PrimaryButton: React.FC<Props> = ({
  label,
  onPress,
  loading = false,
  disabled = false,
  rightSlot,
  style,
  variant = 'primary',
}) => {
  const colorsGradient =
    variant === 'pink'
      ? (['#F472B6', '#DB2777'] as const)
      : ([colors.primaryGradientStart, colors.primaryGradientEnd] as const);

  return (
    <View style={[styles.shadowWrap, neuRaised, style]}>
      <Pressable
        disabled={disabled || loading}
        onPress={onPress}
        style={({ pressed }) => [
          styles.pressable,
          { opacity: disabled ? 0.55 : pressed ? 0.9 : 1 },
        ]}
      >
        <LinearGradient
          colors={colorsGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.inner}
        >
          {loading ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <View style={styles.content}>
              <Text style={styles.label}>{label}</Text>
              {rightSlot ? <View style={styles.slot}>{rightSlot}</View> : null}
            </View>
          )}
        </LinearGradient>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  shadowWrap: {
    borderRadius: 999,
    // iOS shadow is already set via neuRaised; no overflow:hidden here.
  },
  pressable: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  inner: {
    paddingVertical: 16,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    color: colors.textInverse,
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    letterSpacing: 0.3,
  },
  slot: {
    marginLeft: 10,
  },
});
