import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { colors, neuRaised } from '../theme';

// Circular neumorphic back button used on Sign Up / Log In / Onboarding.

interface Props {
  onPress?: () => void;
  style?: ViewStyle;
}

export const BackButton: React.FC<Props> = ({ onPress, style }) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.wrap,
        neuRaised,
        { opacity: pressed ? 0.85 : 1 },
        style,
      ]}
      hitSlop={8}
    >
      <ChevronLeft color={colors.primary} size={22} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bgStart,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
