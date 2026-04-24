import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { colors } from '../theme';

// "Step 1 of 2" indicator used across the onboarding questions.
// Figma shows two pills — current one filled indigo, inactive one pale.

interface Props {
  total: number;
  current: number; // 1-indexed
  style?: ViewStyle;
}

export const StepDots: React.FC<Props> = ({ total, current, style }) => {
  return (
    <View style={[styles.row, style]}>
      {Array.from({ length: total }).map((_, i) => {
        const active = i + 1 === current;
        return (
          <View
            key={i}
            style={[
              styles.pill,
              active ? styles.pillActive : styles.pillInactive,
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  pill: {
    height: 6,
    borderRadius: 3,
  },
  pillActive: {
    width: 28,
    backgroundColor: colors.primary,
  },
  pillInactive: {
    width: 12,
    backgroundColor: 'rgba(63, 81, 181, 0.2)',
  },
});
