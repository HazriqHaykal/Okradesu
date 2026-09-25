/**
 * Japan Eateries design tokens (direction 1b "Street poster"), mirrored from
 * `Japan Eateries color pairings/tokens/*.css`. One orange accent on a cream
 * ground with warm ink. Labels on orange are always ink, never white.
 */

export const Palette = {
  orange50: '#FFF7EC',
  orange100: '#FFF1DC',
  orange150: '#FFE9CC',
  orange200: '#FFE3BE',
  orange300: '#FFCB85',
  orange400: '#F8B04E',
  orange500: '#F29A1E',
  orange600: '#DB8410',
  orange700: '#A85E00',
  orange800: '#7A4400',

  ink900: '#1E1A16',
  ink700: '#4A443D',
  ink500: '#6F675D',
  ink300: '#B8AFA3',
  ink200: '#EADCC6',
  ink100: '#F4ECE0',
  white: '#FFFFFF',

  green500: '#3E8E5A',
  red500: '#D2462C',
} as const;

export const Colors = {
  bgApp: Palette.orange50,
  heroTop: Palette.orange200,
  surfaceCard: Palette.white,
  surfaceTint: Palette.orange150,
  surfaceSunken: Palette.ink100,
  textPrimary: Palette.ink900,
  textSecondary: Palette.ink500,
  textBody: Palette.ink700,
  textAccent: Palette.orange700,
  textOnAccent: Palette.ink900,
  accent: Palette.orange500,
  accentHover: Palette.orange400,
  accentPressed: Palette.orange600,
  borderSubtle: Palette.ink200,
  borderStrong: Palette.ink900,
  success: Palette.green500,
  successBg: '#E3F1E7',
  successFg: '#2C6A42',
  danger: Palette.red500,
  // Added for this product: the system only ships success/accent/neutral badge tones.
  dangerBg: '#FBE1DA',
  dangerFg: '#9A2E1B',
} as const;

export const Fonts = {
  display: 'Anton_400Regular',
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extrabold: 'Manrope_800ExtraBold',
} as const;

export const TextSize = {
  displayXl: 44,
  display: 38,
  displaySm: 28,
  title: 22,
  heading: 17,
  bodyLg: 15,
  body: 13,
  small: 12,
  caption: 11,
  micro: 10,
} as const;

export const Spacing = {
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
  eight: 32,
  ten: 40,
  twelve: 48,
  gutter: 24,
} as const;

export const Radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  sheet: 28,
  pill: 999,
} as const;

export const Shadow = {
  card: '0px 4px 14px rgba(30, 26, 22, 0.05)',
  tile: '0px 2px 8px rgba(30, 26, 22, 0.06)',
  float: '0px 6px 18px rgba(30, 26, 22, 0.08)',
  glow: '0px 4px 14px rgba(242, 154, 30, 0.22)',
} as const;

/** Space the floating tab bar takes at the bottom of a tab screen. */
export const TabBarSpace = 110;
export const MaxContentWidth = 560;
