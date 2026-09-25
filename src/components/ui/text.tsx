import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { Colors, Fonts, TextSize } from '@/constants/theme';

export type TextVariant =
  | 'displayXl'
  | 'display'
  | 'displaySm'
  | 'title'
  | 'heading'
  | 'bodyLg'
  | 'body'
  | 'small'
  | 'caption'
  | 'micro';

type Weight = keyof typeof WEIGHT_FONT;

const WEIGHT_FONT = {
  400: Fonts.regular,
  500: Fonts.medium,
  600: Fonts.semibold,
  700: Fonts.bold,
  800: Fonts.extrabold,
} as const;

const DEFAULT_WEIGHT: Record<TextVariant, Weight> = {
  displayXl: 400,
  display: 400,
  displaySm: 400,
  title: 800,
  heading: 800,
  bodyLg: 400,
  body: 400,
  small: 400,
  caption: 400,
  micro: 800,
};

export type TxtProps = TextProps & {
  variant?: TextVariant;
  weight?: Weight;
  color?: string;
  tabular?: boolean;
  align?: TextStyle['textAlign'];
};

/** Anton for screen titles only; Manrope for everything else. */
export function Txt({
  variant = 'body',
  weight,
  color = Colors.textPrimary,
  tabular,
  align,
  style,
  ...rest
}: TxtProps) {
  const isDisplay = variant.startsWith('display');
  return (
    <Text
      style={[
        styles[variant],
        { color, fontFamily: isDisplay ? Fonts.display : WEIGHT_FONT[weight ?? DEFAULT_WEIGHT[variant]] },
        tabular && styles.tabular,
        align && { textAlign: align },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  displayXl: {
    fontSize: TextSize.displayXl,
    lineHeight: TextSize.displayXl * 1.05,
    letterSpacing: TextSize.displayXl * 0.02,
    textTransform: 'uppercase',
  },
  display: {
    fontSize: TextSize.display,
    lineHeight: TextSize.display * 1.05,
    letterSpacing: TextSize.display * 0.02,
    textTransform: 'uppercase',
  },
  displaySm: {
    fontSize: TextSize.displaySm,
    lineHeight: TextSize.displaySm * 1.05,
    letterSpacing: TextSize.displaySm * 0.02,
    textTransform: 'uppercase',
  },
  title: { fontSize: TextSize.title, lineHeight: 28 },
  heading: { fontSize: TextSize.heading, lineHeight: 22 },
  bodyLg: { fontSize: TextSize.bodyLg, lineHeight: 21 },
  body: { fontSize: TextSize.body, lineHeight: 20 },
  small: { fontSize: TextSize.small, lineHeight: 18 },
  caption: { fontSize: TextSize.caption, lineHeight: 16 },
  micro: {
    fontSize: TextSize.micro,
    lineHeight: 14,
    letterSpacing: TextSize.micro * 0.08,
    textTransform: 'uppercase',
  },
  tabular: { fontVariant: ['tabular-nums'] },
});
