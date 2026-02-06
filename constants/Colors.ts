// Grit App - Dual-Glow Mom-Boss Design System

// Dark Theme Colors - Deep Obsidian with Electric Teal & Amethyst Accents
const DarkColors = {
  // Deep Obsidian Base
  background: '#0A0612',
  darkPurple: '#140A24',
  cardBackground: 'rgba(20, 10, 36, 0.85)',

  // Primary Colors - Electric Teal & Amethyst
  radiantMagenta: '#E11D48',
  sunKissedAmber: '#F59E0B',
  electricTeal: '#2DD4BF',
  amethyst: '#A855F7',

  // Accent Colors
  neonPink: '#EC4899',
  vibrantPurple: '#A855F7',
  glowingGreen: '#10B981',

  // Neutral Colors
  white: '#FFFFFF',
  lightGray: '#E5E7EB',
  mediumGray: '#9CA3AF',
  darkGray: '#4B5563',
  lightCream: '#2D1B3D',

  // Status Colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',

  // Glassmorphism
  glassBorder: 'rgba(45, 212, 191, 0.2)',
  glassHighlight: 'rgba(168, 85, 247, 0.1)',

  // Text Colors
  primaryText: '#FFFFFF',
  secondaryText: '#E5E7EB',
  tertiaryText: '#9CA3AF',
};

// Light Theme Colors - Warm Cream & Soft Slate with Glassmorphism
const LightColors = {
  // Warm Cream Base
  background: '#FAF8F5',
  darkPurple: '#F5F2EE',
  lightCream: '#F5F2EE',
  cardBackground: 'rgba(255, 255, 255, 0.7)',

  // Primary Colors
  radiantMagenta: '#E11D48',
  sunKissedAmber: '#F59E0B',
  electricTeal: '#14B8A6',
  amethyst: '#A855F7',

  // Accent Colors
  neonPink: '#EC4899',
  vibrantPurple: '#A855F7',
  glowingGreen: '#10B981',

  // Neutral Colors - Soft Slate
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
  glassHighlight: 'rgba(255, 255, 255, 0.6)',

  // Text Colors
  primaryText: '#1F2937',
  secondaryText: '#374151',
  tertiaryText: '#6B7280',
};

// Theme getter function
export const getThemeColors = (isDark: boolean) => isDark ? DarkColors : LightColors;

// Export default light theme
export const Colors = LightColors;
export const DarkTheme = DarkColors;

// Dynamic gradients
export const getGradients = (isDark: boolean) => ({
  primary: ['#E11D48', '#F59E0B'] as const,
  secondary: ['#14B8A6', '#10B981'] as const,
  hero: isDark
    ? ['#2DD4BF', '#A855F7', '#EC4899'] as const
    : ['#7C3AED', '#EC4899', '#F59E0B'] as const,
  wellness: ['#14B8A6', '#E11D48'] as const,
  card: isDark
    ? ['rgba(20, 10, 36, 0.85)', 'rgba(20, 10, 36, 0.9)'] as const
    : ['rgba(255, 255, 255, 0.7)', 'rgba(255, 255, 255, 0.9)'] as const,
  background: isDark
    ? ['#0A0612', '#140A24'] as const
    : ['#FAF8F5', '#F5F2EE'] as const,
  amethystGlow: ['#A855F7', '#2DD4BF'] as const,
});

// Static gradients for compatibility
export const Gradients = getGradients(false);
