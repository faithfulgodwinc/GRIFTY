// Grit App - Premium Modern Aesthetic
// Clean Obsidian + Soft Emerald & Rose Accents

// Dark Theme Colors - Rich Deep Blue-Black with Soft Accents
const DarkColors = {
  // Deep Rich Base
  background: '#0F172A', // Slate 900
  richBlack: '#0A0A0C',  // Neo-Fintech Rich Black
  darkPurple: '#1E293B', // Slate 800
  cardBackground: 'rgba(30, 41, 59, 0.70)', // Slate 800 with transparency

  // Primary Colors - Sophisticated & Clean
  radiantMagenta: '#F43F5E', // Rose 500
  sunKissedAmber: '#F59E0B', // Amber 500
  electricTeal: '#10B981',   // Emerald 500
  amethyst: '#8B5CF6',       // Violet 500

  // Accent Colors
  neonPink: '#FB7185',       // Rose 400
  vibrantPurple: '#A78BFA',  // Violet 400
  glowingGreen: '#34D399',   // Emerald 400

  // Neutral Colors
  white: '#FFFFFF',
  lightGray: '#F1F5F9',      // Slate 100
  mediumGray: '#94A3B8',     // Slate 400
  darkGray: '#475569',       // Slate 600
  lightCream: '#1E293B',     // Slate 800

  // Muted silver-grey for secondary labels
  silverGrey: '#94A3B8',     // Slate 400
  mutedSilver: '#64748B',    // Slate 500

  // Status Colors
  success: '#10B981',        // Emerald 500
  warning: '#F59E0B',        // Amber 500
  error: '#EF4444',          // Red 500

  // Premium Glassmorphism
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassHighlight: 'rgba(255, 255, 255, 0.05)',
  glassSurface: 'rgba(15, 23, 42, 0.6)',

  // Text Colors
  primaryText: '#F8FAFC',    // Slate 50
  secondaryText: '#CBD5E1',  // Slate 300
  tertiaryText: '#94A3B8',   // Slate 400
};

// Light Theme Colors - Crisp White & Soft Slate
const LightColors = {
  // Crisp White Base
  background: '#FFFFFF',
  richBlack: '#0A0A0C',  // Neo-Fintech Rich Black (Available in light mode too for specific elements)
  darkPurple: '#F8FAFC',     // Slate 50
  lightCream: '#F1F5F9',     // Slate 100
  cardBackground: 'rgba(255, 255, 255, 0.85)',

  // Primary Colors
  radiantMagenta: '#E11D48', // Rose 600
  sunKissedAmber: '#D97706', // Amber 600
  electricTeal: '#059669',   // Emerald 600
  amethyst: '#7C3AED',       // Violet 600

  // Accent Colors
  neonPink: '#F43F5E',       // Rose 500
  vibrantPurple: '#8B5CF6',  // Violet 500
  glowingGreen: '#10B981',   // Emerald 500

  // Neutral Colors
  white: '#FFFFFF',
  lightGray: '#E2E8F0',      // Slate 200
  mediumGray: '#64748B',     // Slate 500
  darkGray: '#334155',       // Slate 700

  // Muted silver-grey for secondary labels
  silverGrey: '#64748B',     // Slate 500
  mutedSilver: '#94A3B8',    // Slate 400

  // Status Colors
  success: '#059669',
  warning: '#D97706',
  error: '#DC2626',

  // Premium Glassmorphism
  glassBorder: 'rgba(0, 0, 0, 0.05)',
  glassHighlight: 'rgba(255, 255, 255, 0.8)',
  glassSurface: 'rgba(255, 255, 255, 0.7)',

  // Text Colors
  primaryText: '#0F172A',    // Slate 900
  secondaryText: '#334155',  // Slate 700
  tertiaryText: '#64748B',   // Slate 500
};

// Theme getter function
export const getThemeColors = (isDark: boolean) => isDark ? DarkColors : LightColors;

// Export default light theme
export const Colors = LightColors;
export const DarkTheme = DarkColors;

// Dynamic gradients - Refined & Subtler
export const getGradients = (isDark: boolean) => ({
  primary: ['#F43F5E', '#F59E0B'] as const,   // Rose to Amber
  secondary: ['#10B981', '#34D399'] as const, // Emerald
  hero: isDark
    ? ['#0A0A0C', '#0A0A0C'] as const
    : ['#FFFFFF', '#FFFFFF'] as const,
  mesh: isDark
    ? ['#0A0A0C', '#0A0A0C'] as const
    : ['#FFFFFF', '#FFFFFF'] as const,
  wellness: ['#10B981', '#F43F5E'] as const,
  card: isDark
    ? ['rgba(30, 41, 59, 0.7)', 'rgba(30, 41, 59, 0.8)'] as const
    : ['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0.95)'] as const,
  background: isDark
    ? ['#0A0A0C', '#0A0A0C'] as const
    : ['#FFFFFF', '#FFFFFF'] as const,
  amethystGlow: ['#8B5CF6', '#A78BFA'] as const,
  fire: ['#F59E0B', '#F43F5E'] as const,
  neonBar: isDark
    ? ['#10B981', '#34D399'] as const
    : ['#059669', '#10B981'] as const,
  premium: isDark
    ? ['rgba(16, 185, 129, 0.1)', 'rgba(139, 92, 246, 0.1)'] as const
    : ['rgba(16, 185, 129, 0.05)', 'rgba(139, 92, 246, 0.05)'] as const,
});

// Static gradients for compatibility
export const Gradients = getGradients(false);
