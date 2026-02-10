// Grit App - Premium Mom-Boss Elite Design System
// Deep Obsidian + Electric Teal & Amethyst Accents

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

  // Muted silver-grey for secondary labels
  silverGrey: '#8B92A0',
  mutedSilver: '#6B7280',

  // Status Colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',

  // Premium Glassmorphism
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassHighlight: 'rgba(168, 85, 247, 0.06)',
  glassSurface: 'rgba(20, 10, 36, 0.75)',

  // Text Colors - Crisp white + muted silver
  primaryText: '#FFFFFF',
  secondaryText: '#C9CDD4',
  tertiaryText: '#8B92A0',
};

// Light Theme Colors - Warm Cream & Soft Slate with Glassmorphism
const LightColors = {
  // Warm Cream Base
  background: '#FAF8F5',
  darkPurple: '#F5F2EE',
  lightCream: '#F5F2EE',
  cardBackground: 'rgba(255, 255, 255, 0.75)',

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

  // Muted silver-grey for secondary labels
  silverGrey: '#6B7280',
  mutedSilver: '#9CA3AF',

  // Status Colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',

  // Premium Glassmorphism
  glassBorder: 'rgba(0, 0, 0, 0.06)',
  glassHighlight: 'rgba(255, 255, 255, 0.6)',
  glassSurface: 'rgba(255, 255, 255, 0.6)',

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
  fire: ['#FF6B35', '#F59E0B', '#E11D48'] as const,
  neonBar: isDark
    ? ['#2DD4BF', '#10B981'] as const
    : ['#14B8A6', '#10B981'] as const,
  premium: isDark
    ? ['rgba(45, 212, 191, 0.15)', 'rgba(168, 85, 247, 0.15)'] as const
    : ['rgba(20, 184, 166, 0.08)', 'rgba(168, 85, 247, 0.08)'] as const,
});

// Static gradients for compatibility
export const Gradients = getGradients(false);
