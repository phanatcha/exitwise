import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { colors, fontFamily, fontSize, neuRaised } from '../theme';

// Neumorphic light button. Used for "Log In" on landing (filled, light bg)
// and "Edit Plan" (outlined indigo) on the trip planner.

interface Props {
  label: string;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'light' | 'outline';
}

export const SecondaryButton: React.FC<Props> = ({
  label,
  onPress,
  style,
  variant = 'light',
}) => {
  const isOutline = variant === 'outline';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        !isOutline && neuRaised,
        isOutline && styles.outline,
        { opacity: pressed ? 0.85 : 1 },
        style,
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.label, isOutline && styles.labelOutline]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    backgroundColor: colors.bgStart,
    paddingVertical: 16,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outline: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
  },
  content: { flexDirection: 'row', alignItems: 'center' },
  label: {
    color: colors.primary,
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    letterSpacing: 0.3,
  },
  labelOutline: {
    color: colors.primary,
  },
});
