import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Txt } from '@/components/ui/text';
import { Colors, Palette, Radius } from '@/constants/theme';

export type BadgeTone = 'accent' | 'neutral' | 'success' | 'solid' | 'danger';

const TONES: Record<BadgeTone, { bg: string; fg: string }> = {
  accent: { bg: Colors.warnBg, fg: Colors.warnFg },
  neutral: { bg: Colors.surfaceSunken, fg: Palette.ink700 },
  success: { bg: Colors.successBg, fg: Colors.successFg },
  solid: { bg: Colors.accent, fg: Colors.textOnAccent },
  danger: { bg: Colors.dangerBg, fg: Colors.dangerFg },
};

/** Small uppercase status pill. Tones: accent (amber, needs attention), neutral, success (teal), solid (green fill), danger (red). */
export function Badge({
  label,
  tone = 'accent',
  icon: Icon,
}: {
  label: string;
  tone?: BadgeTone;
  icon?: LucideIcon;
}) {
  const t = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      {Icon ? <Icon size={11} color={t.fg} strokeWidth={2.5} /> : null}
      <Txt variant="micro" color={t.fg} numberOfLines={1}>
        {label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    height: 22,
    paddingHorizontal: 9,
    borderRadius: Radius.pill,
  },
});
