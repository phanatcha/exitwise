// ExitWise color tokens — sourced directly from Figma.
// The app lives on a two-stop neumorphic gradient (pale indigo → pale mint),
// with deep indigo for primary actions and soft mid-grays for secondary text.

export const colors = {
  // Gradient background stops (114.7deg).
  bgStart: '#E8EAF6',
  bgEnd: '#E0FFF9',

  // Primary accent (buttons, pills, active nav tint).
  primary: '#3F51B5',
  primaryDeep: '#12102A',
  primaryGradientStart: '#4A5BC8',
  primaryGradientEnd: '#3F51B5',

  // Secondary action / "Save Plan" pink (from AI Trip Planner).
  accentPink: '#F15BB5',

  // Header wash used on Save Trip Plan.
  tealWash: '#E4F5F8',

  // Text.
  textPrimary: '#3F487B',
  textSecondary: '#6C757D',
  textInverse: '#FFFFFF',
  textMuted: '#9CA3AF',

  // Neumorphic shadow sources.
  shadowDark: '#C5C7D1',
  shadowLight: '#FFFFFF',

  // Surfaces.
  surface: '#FFFFFF',
  surfaceMuted: '#F5F5F7',

  // Semantic.
  danger: '#E53935',
  success: '#10B981',
  border: 'rgba(63, 72, 123, 0.08)',
} as const;

export type ColorToken = keyof typeof colors;
