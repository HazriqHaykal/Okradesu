import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Txt } from '@/components/ui/text';
import { Colors, Radius, Shadow } from '@/constants/theme';

/** White pill that fills orange when selected (the Harvest tab's farm chips). */
export function Chip({
  label,
  selected,
  onPress,
  icon: Icon,
  disabled,
  size = 'md',
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: LucideIcon;
  disabled?: boolean;
  size?: 'sm' | 'md';
}) {
  const color = selected ? Colors.textOnAccent : Colors.textPrimary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        size === 'sm' && styles.sm,
        selected && styles.on,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}>
      {Icon ? <Icon size={14} color={color} strokeWidth={2} /> : null}
      <Txt variant="small" weight={700} color={color}>
        {label}
      </Txt>
    </Pressable>
  );
}

/** A row of chips that scrolls sideways past the screen gutter. */
export function ChipRow({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}>
      {children}
    </ScrollView>
  );
}

/** Two or three equal options in a sunken track; the active one fills orange. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; icon?: LucideIcon }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View accessibilityRole="tablist" style={styles.track}>
      {options.map((o) => {
        const on = o.value === value;
        const Icon = o.icon;
        const color = on ? Colors.textOnAccent : Colors.textSecondary;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.value)}
            style={[styles.segment, on && styles.segmentOn]}>
            {Icon ? <Icon size={15} color={color} strokeWidth={2} /> : null}
            <Txt variant="small" weight={800} color={on ? Colors.textOnAccent : Colors.textSecondary}>
              {o.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 16,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceCard,
    boxShadow: Shadow.tile,
  },
  sm: { height: 32, paddingHorizontal: 12 },
  on: { backgroundColor: Colors.accent, boxShadow: Shadow.glow },
  pressed: { transform: [{ scale: 0.97 }] },
  disabled: { opacity: 0.45 },
  scroll: { marginHorizontal: -24, flexGrow: 0 },
  row: { gap: 8, paddingHorizontal: 24, paddingVertical: 4 },
  track: {
    flexDirection: 'row',
    padding: 4,
    gap: 4,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceSunken,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: Radius.pill,
  },
  segmentOn: { backgroundColor: Colors.accent, boxShadow: Shadow.glow },
});
