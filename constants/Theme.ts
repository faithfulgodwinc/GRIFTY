// Premium Design System - Mom-Boss Elite Aesthetic
// Strict 8dp grid system with typographic scale

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
} as const;

// Strict typographic scale
export const Typography = {
  // Display - Hero text
  displayLarge: {
    fontSize: 48,
    fontWeight: '800' as const,
    letterSpacing: -1.5,
    lineHeight: 56,
  },
  displayMedium: {
    fontSize: 36,
    fontWeight: '700' as const,
    letterSpacing: -1,
    lineHeight: 44,
  },
  displaySmall: {
    fontSize: 32,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  // Headings
  headlineLarge: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
    lineHeight: 36,
  },
  headlineMedium: {
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
    lineHeight: 32,
  },
  headlineSmall: {
    fontSize: 20,
    fontWeight: '600' as const,
    letterSpacing: 0,
    lineHeight: 28,
  },
  // Titles
  titleLarge: {
    fontSize: 18,
    fontWeight: '600' as const,
    letterSpacing: 0,
    lineHeight: 26,
  },
  titleMedium: {
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.1,
    lineHeight: 24,
  },
  titleSmall: {
    fontSize: 14,
    fontWeight: '600' as const,
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  // Body
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400' as const,
    letterSpacing: 0.15,
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400' as const,
    letterSpacing: 0.15,
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400' as const,
    letterSpacing: 0.2,
    lineHeight: 16,
  },
  // Labels
  labelLarge: {
    fontSize: 14,
    fontWeight: '600' as const,
    letterSpacing: 0.4,
    lineHeight: 20,
  },
  labelMedium: {
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  labelSmall: {
    fontSize: 10,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    lineHeight: 14,
  },
} as const;

// Border radius scale
export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 999,
} as const;

// Shadow presets
export const Shadows = {
  soft: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  strong: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  }),
  neonGlow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  }),
} as const;

// Animation durations
export const Animation = {
  fast: 150,
  normal: 300,
  slow: 500,
  entrance: 400,
  exit: 250,
} as const;

// Glass effect presets
export const GlassEffect = {
  subtle: {
    blurIntensity: 20,
    borderWidth: 1,
    borderOpacity: 0.08,
  },
  standard: {
    blurIntensity: 40,
    borderWidth: 1,
    borderOpacity: 0.12,
  },
  prominent: {
    blurIntensity: 60,
    borderWidth: 1,
    borderOpacity: 0.18,
  },
} as const;
