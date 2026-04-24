import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

// Full-screen pale indigo → pale mint wash. Every top-level screen wraps itself
// in this so the neumorphic components sit on the designed backdrop.
// Figma: linear-gradient(114.7deg, #E8EAF6 0%, #E0FFF9 100%).

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const GradientBg: React.FC<Props> = ({ children, style }) => {
  return (
    <LinearGradient
      colors={[colors.bgStart, colors.bgEnd]}
      // 114.7deg ≈ top-left → bottom-right with a slight tilt toward bottom.
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.fill, style]}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
