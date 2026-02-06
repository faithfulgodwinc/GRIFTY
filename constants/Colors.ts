// Grit App - Vibrant Velocity Design System

// Dark Theme Colors
const DarkColors = {
  // Electric Midnight Base
  background: '#1E1B4B',
  darkPurple: '#0F0A2E',
  cardBackground: 'rgba(30, 27, 75, 0.6)',

  // Primary Colors
  radiantMagenta: '#E11D48',
  sunKissedAmber: '#F59E0B',
  electricTeal: '#2DD4BF',

  // Accent Colors
  neonPink: '#EC4899',
  vibrantPurple: '#A855F7',
  glowingGreen: '#10B981',

  // Neutral Colors
  white: '#FFFFFF',
  lightGray: '#E5E7EB',
  mediumGray: '#9CA3AF',
  darkGray: '#4B5563',

  // Status Colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',

  // Glassmorphism
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  glassHighlight: 'rgba(255, 255, 255, 0.05)',

  // Text Colors
  primaryText: '#FFFFFF',
  secondaryText: '#E5E7EB',
  tertiaryText: '#9CA3AF',
};

// Light Theme Colors - Sophisticated Light Canvas
const LightColors = {
  // Sophisticated Light Base
  background: '#FAF9F7',
  lightCream: '#F5F3F0',
  cardBackground: 'rgba(255, 255, 255, 0.85)',

  // Primary Colors (same vibrant accents)
  radiantMagenta: '#E11D48',
  sunKissedAmber: '#F59E0B',
  electricTeal: '#14B8A6',

  // Accent Colors
  neonPink: '#EC4899',
  vibrantPurple: '#A855F7',
  glowingGreen: '#10B981',

  // Neutral Colors
  white: '#FFFFFF',
  lightGray: '#6B7280',
  mediumGray: '#4B5563',
  darkGray: '#1F2937',

  // Status Colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',

  // Glassmorphism for Light Mode
  glassBorder: 'rgba(0, 0, 0, 0.08)',
  glassHighlight: 'rgba(0, 0, 0, 0.02)',

  // Text Colors
  primaryText: '#1F2937',
  secondaryText: '#374151',
  tertiaryText: '#6B7280',
};

// Use Light Theme by default (can be toggled via context/state later)
export const Colors = LightColors;
export const DarkTheme = DarkColors;

export const Gradients = {
  primary: ['#E11D48', '#F59E0B'] as const,
  secondary: ['#14B8A6', '#10B981'] as const,
  hero: ['#7C3AED', '#EC4899', '#F59E0B'] as const,
  wellness: ['#14B8A6', '#E11D48'] as const,
  card: ['rgba(255, 255, 255, 0.9)', 'rgba(250, 249, 247, 0.9)'] as const,
  background: ['#FAF9F7', '#F5F3F0'] as const,
};
