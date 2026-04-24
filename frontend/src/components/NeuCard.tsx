import React from 'react';
import {
  Platform,
  StyleSheet,
  View,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { colors, neuRaised } from '../theme';

// Neumorphic raised card. On iOS we use a real shadow. On Android we fake the
// "light from top-left" highlight by layering a translucent white View above
// the base, since Android elevation only casts shadows downward.

interface Props extends ViewProps {
  /** radius in px — matches Figma per-screen (12, 20, 30, 50). */
  radius?: number;
  style?: ViewStyle | ViewStyle[];
}

export const NeuCard: React.FC<Props> = ({
  children,
  radius = 20,
  style,
  ...rest
}) => {
  const container: ViewStyle = {
    backgroundColor: colors.bgStart,
    borderRadius: radius,
  };

  return (
    <View style={[container, neuRaised, style]} {...rest}>
      {Platform.OS === 'android' && (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            {
              borderRadius: radius,
              borderTopWidth: 1,
              borderLeftWidth: 1,
              borderColor: 'rgba(255,255,255,0.8)',
            },
          ]}
        />
      )}
      {children}
    </View>
  );
};
