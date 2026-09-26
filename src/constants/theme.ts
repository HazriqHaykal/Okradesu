/**
 * Okradesu design tokens. One fresh-leaf green accent on a soft mint-cream
 * ground with dark ink. Labels on green are always ink, never white. Amber is
 * kept only for warnings (overgrown pods, surplus, offline devices).
 */

export const Palette = {
  leaf50: '#F4F8EF',
  leaf100: '#EAF4E3',
  leaf150: '#E3F1DC',
  leaf200: '#D5EBCB',
  leaf300: '#B2DBA6',
  leaf400: '#86C88A',
  leaf500: '#5DB36B',
  leaf600: '#479A55',
  leaf700: '#2F7A3D',
  leaf800: '#1F5A2B',

  amber100: '#FFF1DC',
  amber200: '#FFE3BE',
  amber300: '#FFCB85',
  amber500: '#F29A1E',
  amber600: '#DB8410',
  amber800: '#7A4400',

  ink900: '#1B211C',
  ink700: '#434B44',
  ink500: '#677066',
  ink300: '#AEB5A8',
  ink200: '#DCE5D3',
  ink100: '#EDF2E8',
  white: '#FFFFFF',

  teal500: '#1F8A7A',
  red500: '#D2462C',
} as const;

export const Colors = {
  bgApp: Palette.leaf50,
  heroTop: Palette.leaf200,
  surfaceCard: Palette.white,
  surfaceTint: Palette.leaf150,
  surfaceSunken: Palette.ink100,
  textPrimary: Palette.ink900,
  textSecondary: Palette.ink500,
  textBody: Palette.ink700,
  textAccent: Palette.leaf700,
  textOnAccent: Palette.ink900,
  accent: Palette.leaf500,
  accentHover: Palette.leaf400,
  accentPressed: Palette.leaf600,
  borderSubtle: Palette.ink200,
  borderStrong: Palette.ink900,
  // Teal, so "done / all good" still stands apart from the green accent.
  success: Palette.teal500,
  successBg: '#DDF1EC',
  successFg: '#16675B',
  // Amber: needs attention, but not an emergency.
  warn: Palette.amber500,
  warnBg: Palette.amber200,
  warnFg: Palette.amber800,
  danger: Palette.red500,
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
  glow: '0px 4px 14px rgba(93, 179, 107, 0.25)',
} as const;

/** Space the docked tab bar (64 px plus breathing room) takes at the bottom of a tab screen. */
export const TabBarSpace = 84;
export const MaxContentWidth = 560;
