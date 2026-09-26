import { Pressable, StyleSheet, View } from 'react-native';

import { Txt } from '@/components/ui/text';
import { Colors, Radius, Shadow } from '@/constants/theme';

export type Segment<T extends string> = { value: T; label: string; count?: number };

/** Pill switcher in the tab bar's style: the active segment fills orange. */
export function Segmented<T extends string>({
  segments,
  value,
  onChange,
  label,
}: {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <View role="tablist" aria-label={label} style={styles.track}>
      {segments.map((s) => {
        const on = s.value === value;
        return (
          <Pressable
            key={s.value}
            role="tab"
            aria-selected={on}
            onPress={() => onChange(s.value)}
            style={({ pressed }) => [styles.seg, on && styles.segOn, pressed && !on && styles.segPressed]}>
            <Txt
              variant="small"
              weight={700}
              color={on ? Colors.textOnAccent : Colors.textSecondary}
              numberOfLines={1}>
              {s.label}
            </Txt>
            {s.count != null ? (
              <View style={[styles.count, on && styles.countOn]}>
                <Txt
                  variant="caption"
                  weight={800}
                  tabular
                  color={on ? Colors.textOnAccent : Colors.textSecondary}>
                  {s.count}
                </Txt>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: 5,
    gap: 4,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surfaceCard,
    boxShadow: Shadow.tile,
  },
  seg: {
    flex: 1,
    height: 40,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  segOn: { backgroundColor: Colors.accent, boxShadow: Shadow.glow },
  segPressed: { backgroundColor: Colors.surfaceSunken },
  count: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: Colors.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countOn: { backgroundColor: 'rgba(30, 26, 22, 0.12)' },
});
