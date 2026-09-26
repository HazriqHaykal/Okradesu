import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Colors, Radius, Shadow } from '@/constants/theme';

/** White card, radius 18, soft shadow, no border. */
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Tinted square that holds an icon, like the category tiles' image well. */
export function IconWell({
  icon: Icon,
  size = 44,
  radius = Radius.md,
  bg = Colors.surfaceTint,
  fg = Colors.textAccent,
}: {
  icon: LucideIcon;
  size?: number;
  radius?: number;
  bg?: string;
  fg?: string;
}) {
  return (
    <View style={[styles.well, { width: size, height: size, borderRadius: radius, backgroundColor: bg }]}>
      <Icon size={Math.round(size * 0.5)} color={fg} strokeWidth={2} />
    </View>
  );
}

/** Hairline separator in the subtle border colour, for lists inside a Card. */
export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, style]} />;
}

/** Horizontal fill bar (risk meters). */
export function Meter({
  value,
  color,
  track = Colors.surfaceSunken,
}: {
  value: number;
  color: string;
  track?: string;
}) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: value }}
      style={[styles.meter, { backgroundColor: track }]}>
      <View style={[styles.meterFill, { width: `${value}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.lg,
    boxShadow: Shadow.card,
  },
  well: { alignItems: 'center', justifyContent: 'center' },
  divider: { height: StyleSheet.hairlineWidth * 2, backgroundColor: Colors.borderSubtle },
  meter: { height: 8, borderRadius: Radius.pill, overflow: 'hidden' },
  meterFill: { height: 8, borderRadius: Radius.pill },
});
