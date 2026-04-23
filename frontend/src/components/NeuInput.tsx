import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { colors, fontFamily, fontSize, neuInset } from '../theme';

// Inset pill input. The Figma inputs for Email / Password / Budget all share
// this treatment: rounded-full, inner shadow, 16px vertical pad, Outfit Regular.

interface Props extends TextInputProps {
  containerStyle?: ViewStyle;
}

export const NeuInput: React.FC<Props> = ({
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...rest
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.shell,
        neuInset,
        focused && styles.shellFocused,
        containerStyle,
      ]}
    >
      <TextInput
        {...rest}
        placeholderTextColor={colors.textMuted}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[styles.input, style]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  shell: {
    backgroundColor: colors.bgStart,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 14,
    // Simulates the inset shadow: a faint inner border gives the impression
    // of the shell "sinking" — paired with the neuInset shadow above.
    borderWidth: 1,
    borderColor: 'rgba(197, 199, 209, 0.4)',
  },
  shellFocused: {
    borderColor: colors.primary,
  },
  input: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.textPrimary,
    padding: 0,
  },
});
