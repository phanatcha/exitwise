import React from 'react';
import {
  StyleSheet,
  View,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { colors } from '../theme';

// Rounded-top card that anchors to the bottom of the screen. Used on Sign Up
// and Log In (Figma uses a 70px radius on the top corners, white fill).

interface Props extends ViewProps {
  style?: ViewStyle | ViewStyle[];
  topRadius?: number;
}

export const BottomSheet: React.FC<Props> = ({
  children,
  style,
  topRadius = 70,
  ...rest
}) => {
  return (
    <View
      style={[
        styles.sheet,
        { borderTopLeftRadius: topRadius, borderTopRightRadius: topRadius },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: colors.surface,
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 40,
    // Soft shadow at the top edge (lifts the sheet off the gradient).
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
});
