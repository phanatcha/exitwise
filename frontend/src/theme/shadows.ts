import { Platform, type ViewStyle } from 'react-native';
import { colors } from './colors';

// iOS renders dual-direction shadows natively; Android only supports single-side
// elevation, so we emulate neumorphism by stacking two overlay Views inside the
// component. See NeuCard/NeuInput for the Android branch.

/** Raised neumorphic card (default state). */
export const neuRaised: ViewStyle = Platform.select({
  ios: {
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
  default: {
    // Android: fall back to a single elevation; the inner highlight is drawn
    // by an overlay View in the component itself.
    elevation: 6,
  },
}) as ViewStyle;

/** Pressed / inset input. */
export const neuInset: ViewStyle = Platform.select({
  ios: {
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  default: {
    elevation: 2,
  },
}) as ViewStyle;

/** Subtle drop for floating action buttons on top of the map. */
export const neuFab: ViewStyle = Platform.select({
  ios: {
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 4, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  default: {
    elevation: 8,
  },
}) as ViewStyle;
